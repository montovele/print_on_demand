import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MachineStatus, ProductionJobStatus, StockMovementType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database.js";
import { asyncRoute, assertBody, HttpError, pathParam, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { getOrderArtworkSideUrls } from "../storefront/order-artwork.js";
import {
  aggregateUpsTracking,
  createUpsShipment,
  getCheapestUpsRate,
  getUpsConfigurationStatus,
  getUpsTracking,
  validateUpsCredentials,
  type UpsDestination,
} from "../storefront/ups.js";

const router = Router();
router.use(requireAuth, requireRole("owner", "admin", "editor", "viewer"));
const shipmentLabelRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../uploads/shipping-labels");

const storedShippingAddressSchema = z.object({
  recipient: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(30),
  addressLine1: z.string().trim().min(3).max(191),
  addressLine2: z.string().trim().max(191).default(""),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().regex(/^\d{5}$/),
  country: z.literal("MX"),
  shippingServiceCode: z.string().trim().min(1).max(40).optional(),
  shippingServiceName: z.string().trim().max(120).optional(),
});

function getStoredLabelKeys(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((key): key is string => typeof key === "string") : [];
}

function serializeShipment(shipment: {
  id: string;
  productionJobId: string;
  carrier: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: string;
  upsShipmentIdentificationNumber: string | null;
  upsServiceCode: string | null;
  upsServiceName: string | null;
  packageTrackingNumbers: Prisma.JsonValue | null;
  trackingStatus: string | null;
  trackingUpdatedAt: Date | null;
  shippedAt: Date;
  deliveredAt: Date | null;
  labelStorageKeys: Prisma.JsonValue | null;
}) {
  const labelCount = getStoredLabelKeys(shipment.labelStorageKeys).length;
  const { labelStorageKeys: _labelStorageKeys, ...fields } = shipment;
  return {
    ...fields,
    packageTrackingNumbers: Array.isArray(shipment.packageTrackingNumbers)
      ? shipment.packageTrackingNumbers.filter((trackingNumber): trackingNumber is string => typeof trackingNumber === "string")
      : [],
    labelUrls: Array.from({ length: labelCount }, (_, index) => `/production/shipments/${shipment.id}/labels/${index}`),
  };
}

async function updateOrderAfterShipment(
  transaction: Prisma.TransactionClient,
  orderId: string,
) {
  const remainingJobs = await transaction.productionJob.count({
    where: { orderId, status: { notIn: ["shipped", "completed"] } },
  });
  if (remainingJobs > 0) return;
  const order = await transaction.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { fulfillmentMode: true } } } } },
  });
  if (order?.items.every((item) => item.product?.fulfillmentMode === "in_house")) {
    await transaction.order.update({ where: { id: orderId }, data: { status: "shipped" } });
  }
}

const jobTransitions: Record<ProductionJobStatus, ProductionJobStatus[]> = {
  queued: ["prepress", "blocked", "cancelled"],
  prepress: ["ready", "blocked", "cancelled"],
  ready: ["in_production", "blocked", "cancelled"],
  in_production: ["quality_check", "blocked"],
  quality_check: ["in_production", "packed", "blocked"],
  packed: [],
  shipped: ["completed"],
  completed: [],
  blocked: ["queued", "prepress", "ready", "in_production", "quality_check", "packed"],
  cancelled: [],
};

const machineSchema = z.object({
  name: z.string().trim().min(2).max(160),
  technology: z.string().trim().min(2).max(100),
  location: z.string().trim().max(191).optional(),
  hourlyRate: z.number().finite().min(0).max(999999999).default(0),
  notes: z.string().max(5000).optional(),
});

const materialSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(2).max(160),
  unit: z.string().trim().min(1).max(40),
  onHand: z.number().finite().min(0).max(999999999).default(0),
  reorderPoint: z.number().finite().min(0).max(999999999).default(0),
  unitCost: z.number().finite().min(0).max(99999999.9999).default(0),
  currency: z.string().trim().length(3).default("MXN"),
});

router.get("/jobs/summary", asyncRoute(async (_req, res) => {
  const items = await prisma.productionJob.findMany({
    where: {
      tenantId: res.locals.auth.tenantId,
      status: { notIn: ["completed", "cancelled"] },
    },
    select: {
      id: true,
      code: true,
      status: true,
      productionMethod: true,
      orderId: true,
      order: { select: { id: true, orderNumber: true } },
      orderItem: { select: { productName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ items });
}));

router.get("/jobs", asyncRoute(async (req, res) => {
  const status = typeof req.query.status === "string" && Object.values(ProductionJobStatus).includes(req.query.status as ProductionJobStatus)
    ? req.query.status as ProductionJobStatus
    : undefined;
  const jobs = await prisma.productionJob.findMany({
    where: { tenantId: res.locals.auth.tenantId, ...(status ? { status } : {}) },
    include: {
      product: { select: { id: true, name: true, productionMethod: true } },
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          currency: true,
          shippingAddress: true,
          productionJobs: { select: { id: true, status: true, quantity: true } },
          shipments: {
            select: {
              id: true,
              productionJobId: true,
              carrier: true,
              trackingNumber: true,
              trackingUrl: true,
              status: true,
              upsShipmentIdentificationNumber: true,
              upsServiceCode: true,
              upsServiceName: true,
              packageTrackingNumbers: true,
              trackingStatus: true,
              trackingUpdatedAt: true,
              shippedAt: true,
              deliveredAt: true,
              labelStorageKeys: true,
            },
            orderBy: { shippedAt: "desc" },
          },
        },
      },
      orderItem: {
        select: {
          quantity: true,
          productName: true,
          designConfig: true,
          printInstructions: true,
          artworkAsset: { select: { id: true } },
        },
      },
      machine: { select: { id: true, name: true, technology: true, status: true } },
      shipment: true,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
  res.json({
    items: jobs.map((job) => {
      const { shipment, order, ...jobFields } = job;
      const { shipments, shippingAddress, ...orderFields } = order;
      const relatedShipment = shipment
        ?? shipments.find((item) => item.carrier === "UPS")
        ?? shipments.find((item) => item.productionJobId === job.id)
        ?? null;
      return {
        ...jobFields,
        order: { ...orderFields, hasShippingAddress: Boolean(shippingAddress) },
        shipment: relatedShipment ? serializeShipment(relatedShipment) : null,
        orderItem: {
          ...job.orderItem,
          artworkUrl: job.orderItem.artworkAsset ? `/designer/assets/${job.orderItem.artworkAsset.id}` : null,
          artworkSides: getOrderArtworkSideUrls(job.orderItem.designConfig),
        },
      };
    }),
  });
}));

router.get("/machines", asyncRoute(async (_req, res) => {
  const items = await prisma.machine.findMany({
    where: { tenantId: res.locals.auth.tenantId },
    include: {
      _count: {
        select: {
          productionJobs: {
            where: { status: { in: ["queued", "prepress", "ready", "in_production", "quality_check", "packed"] } },
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  res.json({ items });
}));

router.post("/machines", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(machineSchema, req.body);
  const item = await prisma.machine.create({
    data: {
      tenantId: res.locals.auth.tenantId,
      name: body.name,
      technology: body.technology,
      location: body.location ?? null,
      hourlyRate: body.hourlyRate,
      notes: body.notes ?? null,
    },
  });
  res.status(201).json(item);
}));

router.patch("/machines/:id/status", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(z.object({ status: z.nativeEnum(MachineStatus) }), req.body);
  const changed = await prisma.machine.updateMany({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId },
    data: { status: body.status },
  });
  if (changed.count === 0) throw new HttpError(404, "Equipo no encontrado.", "MACHINE_NOT_FOUND");
  const item = await prisma.machine.findFirst({ where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId } });
  res.json(item);
}));

router.get("/materials", asyncRoute(async (_req, res) => {
  const items = await prisma.material.findMany({
    where: { tenantId: res.locals.auth.tenantId, isActive: true },
    orderBy: { name: "asc" },
  });
  res.json({
    items: items.map((item) => ({
      ...item,
      onHand: item.onHand.toNumber(),
      reorderPoint: item.reorderPoint.toNumber(),
      unitCost: item.unitCost.toNumber(),
      lowStock: item.onHand.lte(item.reorderPoint),
    })),
  });
}));

router.post("/materials", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(materialSchema, req.body);
  const item = await prisma.$transaction(async (transaction) => {
    const material = await transaction.material.create({
      data: {
        tenantId: res.locals.auth.tenantId,
        sku: body.sku,
        name: body.name,
        unit: body.unit,
        onHand: body.onHand,
        reorderPoint: body.reorderPoint,
        unitCost: body.unitCost,
        currency: body.currency.toUpperCase(),
      },
    });
    if (body.onHand > 0) {
      await transaction.stockMovement.create({
        data: {
          tenantId: res.locals.auth.tenantId,
          materialId: material.id,
          type: "receipt",
          quantity: body.onHand,
          note: "Inventario inicial",
          actorUserId: res.locals.auth.userId,
        },
      });
    }
    return material;
  });
  res.status(201).json({
    ...item,
    onHand: item.onHand.toNumber(),
    reorderPoint: item.reorderPoint.toNumber(),
    unitCost: item.unitCost.toNumber(),
  });
}));

router.post("/materials/:id/movements", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(z.object({
    type: z.enum(["receipt", "adjustment", "return"]),
    quantity: z.number().finite().refine((quantity) => quantity !== 0),
    note: z.string().trim().max(255).optional(),
  }).refine((value) => value.type === "adjustment" || value.quantity > 0, {
    message: "Recepciones y devoluciones deben ser cantidades positivas.",
  }), req.body);
  const tenantId = res.locals.auth.tenantId;
  const materialId = pathParam(req, "id");
  const movement = await prisma.$transaction(async (transaction) => {
    const material = await transaction.material.findFirst({ where: { id: materialId, tenantId, isActive: true } });
    if (!material) throw new HttpError(404, "Material no encontrado.", "MATERIAL_NOT_FOUND");
    const stockUpdate = body.type === "adjustment" && body.quantity < 0
      ? await transaction.material.updateMany({
        where: { id: material.id, tenantId, isActive: true, onHand: { gte: Math.abs(body.quantity) } },
        data: { onHand: { decrement: Math.abs(body.quantity) } },
      })
      : await transaction.material.updateMany({
        where: { id: material.id, tenantId, isActive: true },
        data: { onHand: { increment: body.quantity } },
      });
    if (stockUpdate.count !== 1) {
      throw new HttpError(409, "El ajuste dejaría el inventario en negativo o el material ya no está disponible.", "INSUFFICIENT_STOCK");
    }
    return transaction.stockMovement.create({
      data: {
        tenantId,
        materialId,
        type: body.type as StockMovementType,
        quantity: body.quantity,
        note: body.note ?? null,
        actorUserId: res.locals.auth.userId,
      },
    });
  });
  res.status(201).json(movement);
}));

router.put("/products/:id/materials", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(z.object({
    requirements: z.array(z.object({
      materialId: z.string().min(1),
      quantity: z.number().finite().positive().max(999999999),
    })).max(100),
  }), req.body);
  const tenantId = res.locals.auth.tenantId;
  const productId = pathParam(req, "id");
  const product = await prisma.product.findFirst({ where: { id: productId, tenantId, status: { not: "archived" } } });
  if (!product) throw new HttpError(404, "Producto no encontrado.", "PRODUCT_NOT_FOUND");
  const materialIds = body.requirements.map((requirement) => requirement.materialId);
  if (new Set(materialIds).size !== materialIds.length) {
    throw new HttpError(400, "No repitas un material en la receta del producto.", "DUPLICATE_PRODUCT_MATERIAL");
  }
  const materials = materialIds.length
    ? await prisma.material.findMany({ where: { id: { in: materialIds }, tenantId, isActive: true }, select: { id: true } })
    : [];
  if (materials.length !== new Set(materialIds).size) {
    throw new HttpError(400, "Uno o más materiales no existen en esta cuenta o están inactivos.", "INVALID_PRODUCT_MATERIAL");
  }
  await prisma.$transaction([
    prisma.productMaterialRequirement.deleteMany({ where: { productId } }),
    ...body.requirements.map((requirement) => prisma.productMaterialRequirement.create({
      data: { productId, materialId: requirement.materialId, quantity: requirement.quantity },
    })),
  ]);
  res.json({ requirements: body.requirements });
}));

router.get("/products/:id/materials", asyncRoute(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId, status: { not: "archived" } },
    include: { materialRequirements: { include: { material: { select: { id: true, sku: true, name: true, unit: true } } } } },
  });
  if (!product) throw new HttpError(404, "Producto no encontrado.", "PRODUCT_NOT_FOUND");
  res.json({
    requirements: product.materialRequirements.map((requirement) => ({
      materialId: requirement.materialId,
      material: requirement.material,
      quantity: requirement.quantity.toNumber(),
    })),
  });
}));

router.patch("/jobs/:id/assign", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(z.object({ machineId: z.string().min(1) }), req.body);
  const tenantId = res.locals.auth.tenantId;
  const [job, machine] = await Promise.all([
    prisma.productionJob.findFirst({ where: { id: pathParam(req, "id"), tenantId } }),
    prisma.machine.findFirst({ where: { id: body.machineId, tenantId } }),
  ]);
  if (!job) throw new HttpError(404, "Trabajo de producción no encontrado.", "PRODUCTION_JOB_NOT_FOUND");
  if (!machine) throw new HttpError(404, "Equipo no encontrado en esta cuenta.", "MACHINE_NOT_FOUND");
  if (machine.status !== "active") throw new HttpError(409, "El equipo no está disponible para producción.", "MACHINE_UNAVAILABLE");
  const updated = await prisma.productionJob.update({
    where: { id: job.id },
    data: { machineId: machine.id },
    include: { machine: true },
  });
  res.json(updated);
}));

router.patch("/jobs/:id/status", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(z.object({
    status: z.nativeEnum(ProductionJobStatus),
    note: z.string().trim().max(5000).optional(),
    blockedReason: z.string().trim().min(3).max(5000).optional(),
  }).refine((value) => value.status !== "blocked" || Boolean(value.blockedReason), {
    message: "Indica el motivo para bloquear el trabajo.",
  }), req.body);
  const tenantId = res.locals.auth.tenantId;
  const jobId = pathParam(req, "id");
  const updated = await prisma.$transaction(async (transaction) => {
    const job = await transaction.productionJob.findFirst({
      where: { id: jobId, tenantId },
      include: {
        product: { include: { materialRequirements: { include: { material: true } } } },
        shipment: { select: { carrier: true } },
        order: {
          select: {
            shipments: {
              where: { carrier: "UPS" },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });
    if (!job) throw new HttpError(404, "Trabajo de producción no encontrado.", "PRODUCTION_JOB_NOT_FOUND");
    if (body.status === "shipped") {
      throw new HttpError(409, "Registra el envío y su rastreo mediante la acción de envío.", "SHIPMENT_RECORD_REQUIRED");
    }
    if (body.status === "completed" && job.order.shipments.length > 0) {
      throw new HttpError(409, "Confirma la entrega consultando el rastreo de UPS.", "UPS_TRACKING_REQUIRED");
    }
    if (!jobTransitions[job.status].includes(body.status)) {
      throw new HttpError(409, `No se permite cambiar el trabajo de ${job.status} a ${body.status}.`, "INVALID_PRODUCTION_TRANSITION");
    }

    if (body.status === "in_production") {
      if (!job.machineId) throw new HttpError(409, "Asigna un equipo antes de iniciar la producción.", "MACHINE_REQUIRED");
      const machine = await transaction.machine.findFirst({ where: { id: job.machineId, tenantId, status: "active" } });
      if (!machine) throw new HttpError(409, "El equipo asignado no está activo.", "MACHINE_UNAVAILABLE");

      if (!job.materialsConsumedAt) {
        for (const requirement of job.product.materialRequirements) {
          const quantity = requirement.quantity.mul(job.quantity);
          const stockUpdate = await transaction.material.updateMany({
            where: { id: requirement.materialId, tenantId, isActive: true, onHand: { gte: quantity } },
            data: { onHand: { decrement: quantity } },
          });
          if (stockUpdate.count !== 1) {
            throw new HttpError(409, `Inventario insuficiente de ${requirement.material.name}.`, "INSUFFICIENT_STOCK");
          }
          await transaction.stockMovement.create({
            data: {
              tenantId,
              materialId: requirement.materialId,
              jobId: job.id,
              type: "consumption",
              quantity: quantity.neg(),
              note: `Consumo para ${job.code}`,
              actorUserId: res.locals.auth.userId,
            },
          });
        }
      }
    }

    const result = await transaction.productionJob.updateMany({
      where: { id: job.id, tenantId, status: job.status },
      data: {
        status: body.status,
        blockedReason: body.status === "blocked" ? body.blockedReason ?? null : null,
        ...(body.status === "in_production" && !job.startedAt ? { startedAt: new Date() } : {}),
        ...(body.status === "in_production" && !job.materialsConsumedAt ? { materialsConsumedAt: new Date() } : {}),
        ...(body.status === "completed" ? { completedAt: new Date() } : {}),
      },
    });
    if (result.count !== 1) throw new HttpError(409, "El trabajo cambió en otra operación. Recarga e intenta de nuevo.", "PRODUCTION_JOB_CONFLICT");
    await transaction.productionJobHistory.create({
      data: {
        jobId: job.id,
        fromStatus: job.status,
        toStatus: body.status,
        note: body.status === "blocked" ? body.blockedReason ?? null : body.note ?? null,
        actorUserId: res.locals.auth.userId,
      },
    });

    if (body.status === "in_production") {
      const order = await transaction.order.findUnique({
        where: { id: job.orderId },
        include: { items: { include: { product: { select: { fulfillmentMode: true } } } } },
      });
      if (order?.items.every((item) => item.product?.fulfillmentMode === "in_house")) {
        await transaction.order.update({ where: { id: job.orderId }, data: { status: "in_production" } });
      }
    }
    if (body.status === "completed") {
      const unfinished = await transaction.productionJob.count({
        where: { orderId: job.orderId, id: { not: job.id }, status: { not: "completed" } },
      });
      if (unfinished === 0) {
        const order = await transaction.order.findUnique({
          where: { id: job.orderId },
          include: { items: { include: { product: { select: { fulfillmentMode: true } } } } },
        });
        if (order?.items.every((item) => item.product?.fulfillmentMode === "in_house")) {
          await transaction.order.update({ where: { id: job.orderId }, data: { status: "delivered" } });
        }
      }
    }

    return transaction.productionJob.findUniqueOrThrow({
      where: { id: job.id },
      include: { product: true, order: true, machine: true, shipment: true },
    });
  });
  res.json(updated);
}));

router.post("/orders/:id/ups-label", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const tenantId = res.locals.auth.tenantId;
  const orderId = pathParam(req, "id");
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      items: { include: { product: { select: { fulfillmentMode: true } } } },
      productionJobs: {
        select: { id: true, code: true, status: true, quantity: true },
        orderBy: { createdAt: "asc" },
      },
      shipments: { select: { id: true, carrier: true, status: true } },
    },
  });
  if (!order) throw new HttpError(404, "Pedido no encontrado.", "ORDER_NOT_FOUND");
  if (!order.productionJobs.length) throw new HttpError(409, "El pedido no tiene trabajos de producción.", "ORDER_HAS_NO_PRODUCTION_JOBS");
  if (order.productionJobs.some((job) => job.status !== "packed")) {
    throw new HttpError(409, "Empaca todos los trabajos del pedido antes de crear una guía UPS conjunta.", "ORDER_JOBS_NOT_PACKED");
  }
  if (order.items.some((item) => item.product?.fulfillmentMode !== "in_house")) {
    throw new HttpError(409, "La guía UPS conjunta solo está disponible para pedidos de fabricación propia.", "ORDER_FULFILLMENT_MISMATCH");
  }
  if (order.shipments.length) throw new HttpError(409, "Este pedido ya tiene un envío registrado.", "SHIPMENT_ALREADY_EXISTS");
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "not_required") {
    throw new HttpError(409, "Confirma el pago del pedido antes de comprar una guía UPS.", "ORDER_NOT_PAID");
  }
  const packageCount = order.productionJobs.reduce((sum, job) => sum + job.quantity, 0);
  if (packageCount < 1 || packageCount > 30) {
    throw new HttpError(400, "UPS permite crear guías para un máximo de 30 paquetes por pedido.", "UPS_PACKAGE_COUNT_INVALID");
  }
  const upsStatus = getUpsConfigurationStatus();
  if (!upsStatus.labelReady) {
    throw new HttpError(503, "UPS aún no está listo. Completa las variables de configuración que faltan en el servidor.", "UPS_NOT_CONFIGURED");
  }
  const address = storedShippingAddressSchema.safeParse(order.shippingAddress);
  if (!address.success) {
    throw new HttpError(409, "El pedido no tiene una dirección de envío válida para UPS.", "ORDER_SHIPPING_ADDRESS_MISSING");
  }

  const destination: UpsDestination = {
    recipient: address.data.recipient,
    phone: address.data.phone,
    addressLine1: address.data.addressLine1,
    addressLine2: address.data.addressLine2,
    city: address.data.city,
    state: address.data.state,
    postalCode: address.data.postalCode,
    country: address.data.country,
  };
  let serviceCode = address.data.shippingServiceCode;
  let serviceName = address.data.shippingServiceName ?? "";
  if (!serviceCode) {
    const rate = await getCheapestUpsRate(destination, packageCount);
    serviceCode = rate.serviceCode;
    serviceName = rate.serviceName;
  }
  await validateUpsCredentials();
  const shipmentId = randomUUID();
  const primaryJob = order.productionJobs[0];
  if (!primaryJob) throw new HttpError(409, "El pedido no tiene un trabajo para asociar el envío.", "ORDER_HAS_NO_PRODUCTION_JOBS");
  const shipment = await prisma.shipment.create({
    data: {
      id: shipmentId,
      tenantId,
      orderId: order.id,
      productionJobId: primaryJob.id,
      carrier: "UPS",
      status: "label_pending",
      upsServiceCode: serviceCode,
      upsServiceName: serviceName || null,
      notes: "Compra de guía UPS conjunta iniciada desde Producción.",
    },
  });

  let purchased;
  try {
    purchased = await createUpsShipment(destination, serviceCode, packageCount, order.orderNumber);
  } catch (error) {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: "label_pending_review",
        notes: "UPS no confirmó el resultado de la solicitud. Verifica la cuenta UPS antes de reintentar o registrar manualmente el rastreo.",
      },
    });
    throw error;
  }

  if (purchased.labels.length !== packageCount) {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: "label_pending_review",
        trackingNumber: purchased.labels[0]?.trackingNumber ?? null,
        upsShipmentIdentificationNumber: purchased.shipmentIdentificationNumber,
        packageTrackingNumbers: purchased.labels.map((label) => label.trackingNumber),
        notes: "UPS creó una cantidad de etiquetas distinta a los paquetes solicitados. Verifica la compra antes de continuar.",
      },
    });
    throw new HttpError(502, "UPS devolvió una cantidad de etiquetas inesperada. Revisa la compra antes de reintentar.", "UPS_LABEL_RESPONSE_INVALID");
  }

  const packageTrackingNumbers = purchased.labels.map((label) => label.trackingNumber);
  const primaryTrackingNumber = packageTrackingNumbers[0];
  if (!primaryTrackingNumber) {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: "label_pending_review",
        upsShipmentIdentificationNumber: purchased.shipmentIdentificationNumber,
        packageTrackingNumbers,
        notes: "UPS aceptó la guía, pero no devolvió un número de rastreo. Verifica la compra antes de continuar.",
      },
    });
    throw new HttpError(502, "UPS no devolvió un número de rastreo. Revisa la compra antes de reintentar.", "UPS_LABEL_RESPONSE_INVALID");
  }
  const trackingUrl = `https://www.ups.com/track?tracknum=${encodeURIComponent(primaryTrackingNumber)}`;
  await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      trackingNumber: primaryTrackingNumber,
      trackingUrl,
      upsShipmentIdentificationNumber: purchased.shipmentIdentificationNumber,
      packageTrackingNumbers,
      trackingStatus: "Etiqueta creada",
      status: "label_storage_pending",
    },
  });

  const labelKeys: string[] = [];
  try {
    await mkdir(shipmentLabelRoot, { recursive: true });
    for (const [index, label] of purchased.labels.entries()) {
      const key = `${randomUUID()}.gif`;
      await writeFile(resolve(shipmentLabelRoot, key), label.image, { flag: "wx" });
      labelKeys.push(key);
      if (label.trackingNumber !== packageTrackingNumbers[index]) {
        throw new HttpError(502, "UPS devolvió etiquetas en un orden inesperado.", "UPS_LABEL_RESPONSE_INVALID");
      }
    }
  } catch (error) {
    await Promise.all(labelKeys.map((key) => unlink(resolve(shipmentLabelRoot, key))));
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: "label_storage_pending",
        notes: "UPS creó la guía, pero no se pudieron guardar sus archivos. Conserva el rastreo y recupera las etiquetas desde UPS.",
      },
    });
    throw error;
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const currentJob = await transaction.productionJob.findFirst({
        where: { orderId: order.id, tenantId, status: { not: "packed" } },
        select: { id: true },
      });
      if (currentJob) {
        throw new HttpError(409, "Un trabajo cambió mientras UPS procesaba la guía; revisa el envío antes de continuar.", "JOB_STATUS_CHANGED");
      }
      const shippedJobs = await transaction.productionJob.updateMany({
        where: { orderId: order.id, tenantId, status: "packed" },
        data: { status: "shipped" },
      });
      if (shippedJobs.count !== order.productionJobs.length) {
        throw new HttpError(409, "El conjunto de trabajos cambió mientras UPS procesaba la guía; revisa el envío antes de continuar.", "JOB_STATUS_CHANGED");
      }
      const savedShipment = await transaction.shipment.update({
        where: { id: shipment.id },
        data: {
          status: "shipped",
          labelStorageKeys: labelKeys,
          shippedAt: new Date(),
          notes: null,
        },
      });
      await transaction.productionJobHistory.createMany({
        data: order.productionJobs.map((job) => ({
          jobId: job.id,
          fromStatus: "packed",
          toStatus: "shipped",
          note: `Guía UPS conjunta ${purchased.shipmentIdentificationNumber} · rastreo ${primaryTrackingNumber}`,
          actorUserId: res.locals.auth.userId,
        })),
      });
      await transaction.order.update({ where: { id: order.id }, data: { status: "shipped" } });
      return savedShipment;
    });
    res.status(201).json(serializeShipment(result));
  } catch (error) {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: "label_storage_pending",
        labelStorageKeys: labelKeys,
        notes: "UPS creó la guía, pero no se pudo completar el registro. Revisa y reconcilia el envío antes de volver a procesarlo.",
      },
    });
    throw error;
  }
}));

router.post("/orders/:id/ups-label/reconcile", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(z.object({
    trackingNumbers: z.array(z.string().trim().min(1).max(191)).min(1).max(30),
    notes: z.string().trim().max(5000).optional(),
  }), req.body);
  const tenantId = res.locals.auth.tenantId;
  const orderId = pathParam(req, "id");
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      shipments: { where: { carrier: "UPS" } },
      productionJobs: { select: { id: true, status: true, quantity: true } },
    },
  });
  if (!order) throw new HttpError(404, "Pedido no encontrado.", "ORDER_NOT_FOUND");
  const shipment = order.shipments[0];
  if (!shipment || !["label_pending_review", "label_storage_pending"].includes(shipment.status)) {
    throw new HttpError(409, "No hay una compra UPS pendiente de reconciliación para este pedido.", "UPS_RECONCILIATION_NOT_REQUIRED");
  }
  if (order.productionJobs.some((job) => job.status !== "packed")) {
    throw new HttpError(409, "Revisa los trabajos del pedido; no todos siguen listos para enviarse.", "ORDER_JOBS_NOT_PACKED");
  }
  const expectedPackages = order.productionJobs.reduce((sum, job) => sum + job.quantity, 0);
  if (body.trackingNumbers.length !== expectedPackages || new Set(body.trackingNumbers).size !== body.trackingNumbers.length) {
    throw new HttpError(400, `Registra los ${expectedPackages} números de rastreo UPS del pedido, sin duplicados.`, "UPS_TRACKING_DATA_INVALID");
  }
  const primaryTrackingNumber = body.trackingNumbers[0];
  if (!primaryTrackingNumber) {
    throw new HttpError(400, "UPS requiere al menos un número de rastreo.", "UPS_TRACKING_DATA_INVALID");
  }
  const trackingUrl = `https://www.ups.com/track?tracknum=${encodeURIComponent(primaryTrackingNumber)}`;
  const result = await prisma.$transaction(async (transaction) => {
    const currentJobs = await transaction.productionJob.findMany({
      where: { orderId: order.id, tenantId },
      select: { id: true, status: true },
    });
    if (
      currentJobs.length !== order.productionJobs.length
      || currentJobs.some((job) => job.status !== "packed")
    ) {
      throw new HttpError(409, "Revisa los trabajos del pedido; su estado cambió antes de registrar el rastreo.", "ORDER_JOBS_NOT_PACKED");
    }
    const updatedShipment = await transaction.shipment.update({
      where: { id: shipment.id },
      data: {
        trackingNumber: primaryTrackingNumber,
        packageTrackingNumbers: body.trackingNumbers,
        trackingUrl,
        status: "shipped",
        notes: body.notes ?? "Rastreo registrado después de verificar manualmente la compra en UPS.",
      },
    });
    const updatedJobs = await transaction.productionJob.updateMany({
      where: { id: { in: currentJobs.map((job) => job.id) }, tenantId, status: "packed" },
      data: { status: "shipped" },
    });
    if (updatedJobs.count !== currentJobs.length) {
      throw new HttpError(409, "Los trabajos del pedido cambiaron antes de registrar el rastreo.", "ORDER_JOBS_NOT_PACKED");
    }
    await transaction.productionJobHistory.createMany({
      data: currentJobs.map((job) => ({
        jobId: job.id,
        fromStatus: "packed",
        toStatus: "shipped",
        note: `Envío UPS reconciliado; rastreo ${primaryTrackingNumber}`,
        actorUserId: res.locals.auth.userId,
      })),
    });
    await transaction.order.update({ where: { id: order.id }, data: { status: "shipped" } });
    return updatedShipment;
  });
  res.json(serializeShipment(result));
}));

router.get("/shipments/:id/labels/:index", asyncRoute(async (req, res) => {
  const shipment = await prisma.shipment.findFirst({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId, carrier: "UPS" },
    select: { id: true, orderId: true, labelStorageKeys: true, trackingNumber: true },
  });
  if (!shipment) throw new HttpError(404, "Envío UPS no encontrado.", "SHIPMENT_NOT_FOUND");
  const index = Number(pathParam(req, "index"));
  const keys = getStoredLabelKeys(shipment.labelStorageKeys);
  if (!Number.isInteger(index) || index < 0 || index >= keys.length) {
    throw new HttpError(404, "Etiqueta de envío no encontrada.", "SHIPMENT_LABEL_NOT_FOUND");
  }
  const key = keys[index];
  if (!key || !/^[0-9a-f-]{36}\.gif$/i.test(key)) {
    throw new HttpError(500, "La ruta de la etiqueta UPS no es válida.", "SHIPMENT_LABEL_PATH_INVALID");
  }
  const file = await readFile(resolve(shipmentLabelRoot, key));
  const filenameTrackingNumber = (shipment.trackingNumber ?? shipment.id).replace(/[^a-z0-9_-]/gi, "");
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Content-Disposition", `attachment; filename="UPS-${filenameTrackingNumber}-${index + 1}.gif"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(file);
}));

router.post("/shipments/:id/tracking", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const shipment = await prisma.shipment.findFirst({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId, carrier: "UPS" },
    include: { productionJob: true },
  });
  if (!shipment || !shipment.trackingNumber) throw new HttpError(404, "Envío UPS con rastreo no encontrado.", "SHIPMENT_NOT_FOUND");
  const packageTrackingNumbers = Array.isArray(shipment.packageTrackingNumbers)
    ? shipment.packageTrackingNumbers.filter((trackingNumber): trackingNumber is string => typeof trackingNumber === "string")
    : [shipment.trackingNumber];
  if (!packageTrackingNumbers.length || packageTrackingNumbers.length > 30) {
    throw new HttpError(409, "La lista de rastreos de UPS no es válida; verifica el envío antes de actualizarlo.", "UPS_TRACKING_DATA_INVALID");
  }
  const packageTrackingResults = [];
  for (let index = 0; index < packageTrackingNumbers.length; index += 5) {
    const batch = packageTrackingNumbers.slice(index, index + 5);
    packageTrackingResults.push(...await Promise.all(batch.map((trackingNumber) => getUpsTracking(trackingNumber))));
  }
  const tracking = aggregateUpsTracking(packageTrackingResults);
  const result = await prisma.$transaction(async (transaction) => {
    const updatedShipment = await transaction.shipment.update({
      where: { id: shipment.id },
      data: {
        status: tracking.status,
        trackingStatus: tracking.description,
        trackingUpdatedAt: new Date(),
        ...(tracking.status === "delivered" ? { deliveredAt: new Date() } : {}),
      },
    });
    if (tracking.status === "delivered") {
      const shippedJobs = await transaction.productionJob.findMany({
        where: { orderId: shipment.orderId, tenantId: shipment.tenantId, status: "shipped" },
        select: { id: true },
      });
      if (shippedJobs.length > 0) {
        await transaction.productionJob.updateMany({
          where: { id: { in: shippedJobs.map((job) => job.id) }, status: "shipped" },
          data: { status: "completed", completedAt: new Date() },
        });
        await transaction.productionJobHistory.createMany({
          data: shippedJobs.map((job) => ({
            jobId: job.id,
            fromStatus: "shipped",
            toStatus: "completed",
            note: `UPS confirmó la entrega: ${tracking.description}`,
            actorUserId: res.locals.auth.userId,
          })),
        });
      }
      const order = await transaction.order.findUnique({
        where: { id: shipment.orderId },
        include: { items: { include: { product: { select: { fulfillmentMode: true } } } } },
      });
      if (order?.items.every((item) => item.product?.fulfillmentMode === "in_house")) {
        const unfinished = await transaction.productionJob.count({
          where: { orderId: order.id, status: { not: "completed" } },
        });
        if (unfinished === 0) {
          await transaction.order.update({ where: { id: order.id }, data: { status: "delivered" } });
        }
      }
    }
    return updatedShipment;
  });
  res.json({ ...serializeShipment(result), tracking });
}));

router.post("/jobs/:id/shipment", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(z.object({
    carrier: z.string().trim().min(2).max(100),
    trackingNumber: z.string().trim().min(1).max(191),
    trackingUrl: z.string().url().max(2048).optional(),
    notes: z.string().max(5000).optional(),
  }), req.body);
  const tenantId = res.locals.auth.tenantId;
  const jobId = pathParam(req, "id");
  const result = await prisma.$transaction(async (transaction) => {
    const job = await transaction.productionJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new HttpError(404, "Trabajo de producción no encontrado.", "PRODUCTION_JOB_NOT_FOUND");
    if (job.status !== "packed") throw new HttpError(409, "Solo se pueden registrar envíos de trabajos empacados.", "JOB_NOT_PACKED");
    const existingShipment = await transaction.shipment.findUnique({ where: { productionJobId: job.id }, select: { status: true } });
    if (existingShipment) {
      throw new HttpError(409, "Este trabajo ya tiene un envío registrado. Revisa o reconcilia el rastreo existente.", "SHIPMENT_ALREADY_EXISTS");
    }
    const existingUpsOrderShipment = await transaction.shipment.findFirst({
      where: { orderId: job.orderId, carrier: "UPS" },
      select: { id: true },
    });
    if (existingUpsOrderShipment) {
      throw new HttpError(409, "El pedido ya tiene una guía UPS conjunta. Usa el rastreo de esa guía en lugar de crear otro envío.", "SHIPMENT_ALREADY_EXISTS");
    }
    const shipment = await transaction.shipment.create({
      data: {
        tenantId,
        orderId: job.orderId,
        productionJobId: job.id,
        carrier: body.carrier,
        trackingNumber: body.trackingNumber,
        trackingUrl: body.trackingUrl ?? null,
        notes: body.notes ?? null,
      },
    });
    await transaction.productionJob.update({ where: { id: job.id }, data: { status: "shipped" } });
    await transaction.productionJobHistory.create({
      data: {
        jobId: job.id,
        fromStatus: "packed",
        toStatus: "shipped",
        note: `Enviado con ${body.carrier}; rastreo ${body.trackingNumber}`,
        actorUserId: res.locals.auth.userId,
      },
    });
    const unshipped = await transaction.productionJob.count({
      where: { orderId: job.orderId, id: { not: job.id }, status: { notIn: ["shipped", "completed"] } },
    });
    if (unshipped === 0) {
      const order = await transaction.order.findUnique({
        where: { id: job.orderId },
        include: { items: { include: { product: { select: { fulfillmentMode: true } } } } },
      });
      if (order?.items.every((item) => item.product?.fulfillmentMode === "in_house")) {
        await transaction.order.update({ where: { id: job.orderId }, data: { status: "shipped" } });
      }
    }
    return shipment;
  });
  res.status(201).json(result);
}));

router.get("/materials/:id/movements", asyncRoute(async (req, res) => {
  const materialId = pathParam(req, "id");
  const material = await prisma.material.findFirst({
    where: { id: materialId, tenantId: res.locals.auth.tenantId },
    select: { id: true },
  });
  if (!material) throw new HttpError(404, "Material no encontrado.", "MATERIAL_NOT_FOUND");
  const movements = await prisma.stockMovement.findMany({
    where: { materialId, tenantId: res.locals.auth.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({
    items: movements.map((movement) => ({ ...movement, quantity: movement.quantity.toNumber() })),
  });
}));

export default router;

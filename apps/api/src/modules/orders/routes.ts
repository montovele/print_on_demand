import { Router } from "express";
import { randomUUID } from "node:crypto";
import { OrderStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../database.js";
import { asyncRoute, assertBody, HttpError, pathParam, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { getOrderArtworkSideUrls } from "../storefront/order-artwork.js";

const router = Router();
const orderInclude = {
  items: {
    include: {
      artworkAsset: { select: { id: true } },
      product: { select: { artworkAsset: { select: { id: true } } } },
    },
  },
  customer: { select: { id: true, name: true, email: true } },
  shipments: {
    select: {
      id: true,
      carrier: true,
      trackingNumber: true,
      packageTrackingNumbers: true,
      trackingUrl: true,
      status: true,
      trackingStatus: true,
      shippedAt: true,
      deliveredAt: true,
      labelStorageKeys: true,
    },
    orderBy: { shippedAt: "desc" },
  },
} satisfies Prisma.OrderInclude;

type OrderWithDetails = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const createOrderSchema = z.object({
  orderNumber: z.string().trim().min(1).max(100),
  customerName: z.string().trim().min(1).max(191),
  storeName: z.string().trim().min(1).max(120).default("Manual"),
  currency: z.string().trim().length(3).default("MXN"),
  customerTotal: z.number().finite().min(0).max(999999999),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().trim().min(1).max(191).optional(),
    quantity: z.number().int().min(1).max(10000),
    unitSalePrice: z.number().finite().min(0).max(999999999),
    unitProviderCost: z.number().finite().min(0).max(999999999).optional(),
  })).min(1).max(100),
});

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  received: ["validation_pending", "awaiting_approval", "action_required"],
  validation_pending: ["awaiting_approval", "action_required", "failed"],
  awaiting_approval: ["action_required"],
  submitted: [],
  accepted: [],
  in_production: [],
  shipped: [],
  delivered: [],
  cancel_requested: [],
  cancelled: [],
  failed: ["validation_pending", "awaiting_approval"],
  action_required: ["validation_pending", "awaiting_approval"],
};

function serializeOrder(order: OrderWithDetails) {
  const {
    customerTotal,
    providerTotal,
    shippingTotal,
    stripeCheckoutSessionId: _stripeCheckoutSessionId,
    stripePaymentIntentId: _stripePaymentIntentId,
    items,
    shipments,
    ...orderFields
  } = order;
  return {
    ...orderFields,
    customerTotal: customerTotal.toNumber(),
    providerTotal: providerTotal?.toNumber() ?? null,
    shippingTotal: shippingTotal.toNumber(),
    shipments: shipments.map(({ labelStorageKeys, ...shipment }) => {
      const labelCount = Array.isArray(labelStorageKeys)
        ? labelStorageKeys.filter((key) => typeof key === "string").length
        : 0;
      return {
        ...shipment,
        packageTrackingNumbers: Array.isArray(shipment.packageTrackingNumbers)
          ? shipment.packageTrackingNumbers.filter((trackingNumber): trackingNumber is string => typeof trackingNumber === "string")
          : [],
        labelCount,
        labelUrls: Array.from(
          { length: labelCount },
          (_, index) => `/production/shipments/${shipment.id}/labels/${index}`,
        ),
      };
    }),
    items: items.map((item) => {
      const { unitProviderCost, product, artworkAsset, ...itemFields } = item;
      return {
        ...itemFields,
        unitProviderCost: unitProviderCost?.toNumber() ?? null,
        unitSalePrice: item.unitSalePrice.toNumber(),
        artworkUrl: artworkAsset
          ? `/designer/assets/${artworkAsset.id}`
          : product?.artworkAsset
            ? `/designer/assets/${product.artworkAsset.id}`
            : null,
        artworkSides: getOrderArtworkSideUrls(item.designConfig),
      };
    }),
  };
}

router.use(requireAuth);

router.get("/", requireRole("owner", "admin", "editor", "viewer"), asyncRoute(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const status = typeof req.query.status === "string" && Object.values(OrderStatus).includes(req.query.status as OrderStatus)
    ? req.query.status as OrderStatus
    : undefined;
  const where: Prisma.OrderWhereInput = {
    tenantId: res.locals.auth.tenantId,
    ...(status ? { status } : {}),
  };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({
    items: orders.map(serializeOrder),
    page,
    pageSize,
    total,
  });
}));

router.post("/", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(createOrderSchema, req.body);
  const tenantId = res.locals.auth.tenantId;
  const productIds = [...new Set(body.items.flatMap((item) => item.productId ? [item.productId] : []))];
  const products = productIds.length
    ? await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, status: { not: "archived" } },
      select: {
        id: true,
        name: true,
        baseCost: true,
        fulfillmentMode: true,
        productionMethod: true,
        productionMinutes: true,
        manufacturingNotes: true,
      },
    })
    : [];
  if (products.length !== productIds.length) {
    throw new HttpError(400, "Uno o más productos no existen o no pertenecen a esta cuenta.", "INVALID_ORDER_PRODUCT");
  }
  const productMap = new Map(products.map((product) => [product.id, product]));
  const order = await prisma.$transaction(async (transaction) => {
    const createdOrder = await transaction.order.create({
      data: {
        tenantId,
        orderNumber: body.orderNumber,
        customerName: body.customerName,
        storeName: body.storeName,
        currency: body.currency.toUpperCase(),
        customerTotal: body.customerTotal,
        status: "received",
        items: {
          create: body.items.map((item) => {
            const product = item.productId ? productMap.get(item.productId) : undefined;
            return {
              productId: product?.id ?? null,
              productName: item.productName ?? product?.name ?? "Producto",
              quantity: item.quantity,
              unitSalePrice: item.unitSalePrice,
              unitProviderCost: item.unitProviderCost ?? product?.baseCost ?? null,
            };
          }),
        },
      },
      include: orderInclude,
    });

    for (const orderItem of createdOrder.items) {
      const product = orderItem.productId ? productMap.get(orderItem.productId) : undefined;
      if (!product || product.fulfillmentMode !== "in_house") continue;
      const code = `JOB-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
      const job = await transaction.productionJob.create({
        data: {
          tenantId,
          orderId: createdOrder.id,
          orderItemId: orderItem.id,
          productId: product.id,
          code,
          quantity: orderItem.quantity,
          productionMethod: product.productionMethod,
          estimatedMinutes: product.productionMinutes,
          notes: product.manufacturingNotes,
        },
      });
      await transaction.productionJobHistory.create({
        data: {
          jobId: job.id,
          toStatus: "queued",
          note: "Trabajo creado automáticamente al registrar el pedido.",
          actorUserId: res.locals.auth.userId,
        },
      });
    }

    return createdOrder;
  });
  res.status(201).json(serializeOrder(order));
}));

router.patch("/:id/status", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(z.object({ status: z.nativeEnum(OrderStatus) }), req.body);
  const order = await prisma.order.findFirst({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId },
    select: { id: true, status: true },
  });
  if (!order) throw new HttpError(404, "Pedido no encontrado.", "ORDER_NOT_FOUND");
  if (!allowedTransitions[order.status].includes(body.status)) {
    throw new HttpError(409, `No se permite cambiar el pedido de ${order.status} a ${body.status}.`, "INVALID_ORDER_TRANSITION");
  }
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: body.status },
    include: orderInclude,
  });
  res.json(serializeOrder(updated));
}));

router.get("/:id", requireRole("owner", "admin", "editor", "viewer"), asyncRoute(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: {
      id: pathParam(req, "id"),
      tenantId: res.locals.auth.tenantId,
    },
    include: orderInclude,
  });
  if (!order) throw new HttpError(404, "Pedido no encontrado.", "ORDER_NOT_FOUND");
  res.json(serializeOrder(order));
}));

export default router;

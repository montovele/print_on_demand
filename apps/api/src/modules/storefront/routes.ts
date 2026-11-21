import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express, { Router } from "express";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { config } from "../../config.js";
import { prisma } from "../../database.js";
import { asyncRoute, assertBody, HttpError, pathParam, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireCustomerAuth, requireRole } from "../../middleware/auth.js";
import { MAX_ARTWORK_BYTES, validateArtworkFile } from "../designer/artwork-validation.js";
import { storefrontDesignerProductTypes } from "../products/bulk-publication.js";
import { getCheapestUpsRate, type UpsDestination } from "./ups.js";
import { getDefaultStickerVariantPricing } from "./sticker-pricing.js";
import { getEnabledTextColors, isEnabledTextColor } from "./text-color-options.js";
import { getCustomerDesignerOptions, getDefaultProductColor } from "./customer-designer-options.js";

const router = Router();
const stripe = config.STRIPE_SECRET_KEY ? new Stripe(config.STRIPE_SECRET_KEY) : null;
const artworkRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../uploads/artwork");
const storefrontDesignerProductTypeSet = new Set<string>(storefrontDesignerProductTypes);
const orderDesignSideSchema = z.object({
  artwork: z.boolean(),
  positionX: z.number().min(0).max(100),
  positionY: z.number().min(0).max(100),
  scale: z.number().min(10).max(100),
  rotation: z.number().min(-180).max(180).optional(),
});
const shippingAddressSchema = z.object({
  recipient: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(30),
  addressLine1: z.string().trim().min(3).max(191),
  addressLine2: z.string().trim().max(191).default(""),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().regex(/^\d{5}$/),
  country: z.literal("MX"),
});
const customerCheckoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1).max(191),
    variantId: z.string().min(1).max(191),
    quantity: z.number().int().min(1).max(30),
    artworkAssetId: z.string().uuid().optional(),
    artworkSides: z.object({
      front: z.string().uuid().optional(),
      back: z.string().uuid().optional(),
    }).optional(),
    designConfig: z.object({
      text: z.string().max(60),
      textColor: z.string().regex(/^#[0-9a-f]{6}$/i),
      sides: z.object({
        front: orderDesignSideSchema,
        back: orderDesignSideSchema,
      }),
    }).optional(),
    options: z.record(z.string(), z.string().trim().min(1).max(191)).default({}),
  })).min(1).max(30),
  shippingAddress: shippingAddressSchema,
  quotedShippingCents: z.number().int().min(0).max(999999999),
  quotedPackageCount: z.number().int().min(1).max(30),
});
const shippingQuoteSchema = shippingAddressSchema.extend({
  packageCount: z.number().int().min(1).max(30),
});

const stickerProducts = [
  { id: "stickers-con-nombre-y-bandera", name: "Nombre y bandera", description: "Planilla personalizable de nombres y banderas en vinil reflejante o transparente.", variants: ["S · 8.5 × 1 cm · 24 piezas", "M · 12.5 × 1.5 cm · 12 piezas", "L · 16.5 × 2 cm · 4 piezas", "XL · 23.5 × 3 cm · 4 piezas"] },
  { id: "stickers-con-relieve", name: "Con relieve", description: "Sticker impreso con barniz UV localizado para aportar textura al diseño.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
  { id: "stickers-espejo", name: "Efecto espejo", description: "Sticker de acabado metálico reflectante con laminado protector.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
  { id: "stickers-fantasy-glitter", name: "Fantasy Glitter", description: "Sticker holográfico con destellos multicolor.", variants: ["25", "50", "100", "200", "300", "500", "1,000"] },
  { id: "stickers-fibra-de-carbono", name: "Fibra de carbono", description: "Sticker en vinil con patrón visual inspirado en fibra de carbono.", variants: ["5 × 5 cm", "7.5 × 7.5 cm", "10 × 10 cm", "12.5 × 12.5 cm"] },
  { id: "stickers-glow-in-the-dark", name: "Glow in the Dark", description: "Sticker en vinil fotoluminiscente que brilla después de exponerse a la luz.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
  { id: "stickers-holograficos", name: "Holográficos", description: "Sticker con acabado arcoíris que cambia según la luz y el ángulo.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
  { id: "stickers-metalicos", name: "Metálicos", description: "Sticker de apariencia metálica disponible en dorado o plata.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
  { id: "stickers-para-auto-bumper-stickers", name: "Para auto · Bumper", description: "Sticker para vehículo impreso a color en vinil con laminado mate.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
  { id: "stickers-para-piso-floor-graphics", name: "Para piso · Floor Graphics", description: "Gráfico adhesivo de alta adherencia para aplicaciones en piso.", variants: ["1", "5", "10", "25", "50", "100"] },
  { id: "stickers-reflejantes", name: "Reflejantes", description: "Sticker en vinil reflejante para señalización y objetos de uso exterior.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
  { id: "stickers-reversibles-adhesivo-frontal", name: "Reversibles · Adhesivo frontal", description: "Sticker de impresión invertida para instalar en el interior del vidrio y leer desde afuera.", variants: ["25", "50", "100", "200", "300", "500", "1,000"] },
  { id: "stickers-semi-troqueladas-kiss-cut", name: "Semi troqueladas · Kiss-Cut", description: "Sticker solicitado con corte semi-troquelado; la ficha del proveedor tiene datos que deben confirmarse.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
  { id: "stickers-transferibles", name: "Transferibles", description: "Diseño de vinil de un solo color que se aplica con película de transferencia.", variants: ["25", "50", "100", "200", "300", "500", "1,000"] },
  { id: "stickers-transparentes", name: "Transparentes", description: "Sticker impreso en material transparente con opciones de tinta blanca y acabado.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
  { id: "stikers-troqueladas-die-cut", name: "Troqueladas · Die-Cut", description: "Sticker individual cortado siguiendo el contorno exterior del diseño.", variants: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
] as const;
const stickerProductIds = new Set<string>(stickerProducts.map((product) => product.id));

async function getStorefrontTenant() {
  const tenantId = config.STOREFRONT_TENANT_ID;
  if (!tenantId) throw new HttpError(503, "La tienda central todavía no está configurada.", "STOREFRONT_NOT_CONFIGURED");
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, status: "active" }, select: { id: true } });
  if (!tenant) throw new HttpError(503, "La cuenta operativa de la tienda no existe o está suspendida.", "STOREFRONT_TENANT_UNAVAILABLE");
  return tenant;
}

router.get("/catalog", asyncRoute(async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const tenant = await getStorefrontTenant();
  const [products, designerProducts, catalogOnlyProducts] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: tenant.id, providerCode: "pegapega", status: "published", fulfillmentMode: "in_house" },
      include: { variants: true },
    }),
    prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        status: "published",
        fulfillmentMode: "in_house",
        productType: { in: [...storefrontDesignerProductTypes] },
      },
      include: { variants: true },
    }),
    prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        status: "published",
        fulfillmentMode: "in_house",
        productType: { notIn: [...storefrontDesignerProductTypes] },
      },
      include: { variants: true },
    }),
  ]);
  res.json({
    items: products.map((product) => ({
      externalProductId: product.externalProductId,
      productId: product.id,
      salePrice: product.salePrice.toNumber(),
      currency: product.currency,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        salePrice: variant.salePrice.toNumber(),
        currency: variant.currency,
      })),
    })),
    designerProducts: designerProducts.map((product) => {
      const variants = product.variants.filter((variant) => variant.salePrice.gt(0) && variant.currency === "MXN");
      const configuredDefaultColor = getDefaultProductColor(product.designConfig);
      const defaultProductColor = configuredDefaultColor && variants.some((variant) => (
        variant.color?.trim().toLowerCase() === configuredDefaultColor.toLowerCase()
      ))
        ? configuredDefaultColor
        : variants.find((variant) => variant.color)?.color ?? configuredDefaultColor;
      return {
        productId: product.id,
        name: product.name,
        productType: product.productType,
        textColorOptions: getEnabledTextColors(product.designConfig),
        customerDesignerOptions: getCustomerDesignerOptions(product.designConfig),
        defaultProductColor,
        variants: variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          size: variant.size,
          color: variant.color,
          salePrice: variant.salePrice.toNumber(),
          currency: variant.currency,
        })),
      };
    }),
    catalogProducts: catalogOnlyProducts
        .filter((product) => product.providerCode !== "pegapega"
          || !product.externalProductId
          || !stickerProductIds.has(product.externalProductId))
        .flatMap((product) => {
          const prices = product.variants
            .filter((variant) => variant.salePrice.gt(0) && variant.currency === "MXN")
            .map((variant) => variant.salePrice.toNumber());
          return [{
            productId: product.id,
            name: product.name,
            description: product.description,
            productType: product.productType,
            startingPrice: prices.length ? Math.min(...prices) : null,
          }];
        }),
  });
}));

router.put("/artwork", requireCustomerAuth, requireCsrf, express.raw({
  type: ["image/png", "image/jpeg", "image/webp"],
  limit: MAX_ARTWORK_BYTES,
}), asyncRoute(async (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    throw new HttpError(415, "Formato no compatible. Sube una imagen PNG, JPG o WebP.", "UNSUPPORTED_ARTWORK_TYPE");
  }
  const contentType = req.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (!contentType) throw new HttpError(415, "Indica un tipo de imagen PNG, JPG o WebP.", "UNSUPPORTED_ARTWORK_TYPE");
  if (req.body.byteLength > MAX_ARTWORK_BYTES) {
    throw new HttpError(413, "La imagen debe pesar hasta 5 MB.", "ARTWORK_TOO_LARGE");
  }
  const image = validateArtworkFile(req.body, contentType);
  if (!image) throw new HttpError(415, "La imagen debe ser PNG, JPG o WebP válida, de hasta 10000 px por lado y 50 MP.", "INVALID_ARTWORK_FILE");

  const tenant = await getStorefrontTenant();
  const id = randomUUID();
  const storageKey = `${id}.${image.extension}`;
  await mkdir(artworkRoot, { recursive: true });
  const filePath = resolve(artworkRoot, storageKey);
  await writeFile(filePath, req.body, { flag: "wx" });
  try {
    await prisma.productArtworkAsset.create({
      data: {
        id,
        tenantId: tenant.id,
        uploadedByUserId: res.locals.auth.userId,
        storageKey,
        mimeType: contentType,
        fileSize: req.body.byteLength,
      },
    });
  } catch (error) {
    await unlink(filePath);
    throw error;
  }
  res.status(201).json({ id, mimeType: contentType, fileSize: req.body.byteLength });
}));

router.get("/artwork/:id", requireCustomerAuth, asyncRoute(async (req, res) => {
  const tenant = await getStorefrontTenant();
  const asset = await prisma.productArtworkAsset.findFirst({
    where: {
      id: pathParam(req, "id"),
      uploadedByUserId: res.locals.auth.userId,
      tenantId: tenant.id,
    },
  });
  if (!asset) throw new HttpError(404, "Archivo de diseño no encontrado.", "ARTWORK_NOT_FOUND");
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.type(asset.mimeType).send(await readFile(resolve(artworkRoot, asset.storageKey)));
}));

router.get("/orders/:id", requireCustomerAuth, asyncRoute(async (req, res) => {
  const tenant = await getStorefrontTenant();
  const order = await prisma.order.findFirst({
    where: {
      id: pathParam(req, "id"),
      tenantId: tenant.id,
      customerUserId: res.locals.auth.userId,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      customerTotal: true,
      shippingTotal: true,
      shipments: {
        select: {
          carrier: true,
          trackingNumber: true,
          packageTrackingNumbers: true,
          trackingUrl: true,
          status: true,
          trackingStatus: true,
          shippedAt: true,
          deliveredAt: true,
        },
        orderBy: { shippedAt: "desc" },
      },
    },
  });
  if (!order) throw new HttpError(404, "Pedido no encontrado.", "ORDER_NOT_FOUND");
  res.json({
    ...order,
    shipments: order.shipments.map((shipment) => ({
      ...shipment,
      packageTrackingNumbers: Array.isArray(shipment.packageTrackingNumbers)
        ? shipment.packageTrackingNumbers.filter((trackingNumber): trackingNumber is string => typeof trackingNumber === "string")
        : [],
    })),
    customerTotal: order.customerTotal.toNumber(),
    shippingTotal: order.shippingTotal.toNumber(),
  });
}));

router.post("/shipping/quote", requireCustomerAuth, requireCsrf, asyncRoute(async (req, res) => {
  const body = assertBody(shippingQuoteSchema, req.body);
  const rate = await getCheapestUpsRate({
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    city: body.city,
    state: body.state,
    postalCode: body.postalCode,
    country: body.country,
  } satisfies UpsDestination, body.packageCount);
  res.json({
    serviceName: rate.serviceName,
    serviceCode: rate.serviceCode,
    currency: rate.currency,
    shippingCents: rate.totalCents,
    shippingTotal: rate.totalCents / 100,
    packageCount: body.packageCount,
  });
}));

router.post("/checkout", requireCustomerAuth, requireCsrf, asyncRoute(async (req, res) => {
  if (!stripe) throw new HttpError(503, "Stripe no está configurado.", "PAYMENTS_NOT_CONFIGURED");
  const body = assertBody(customerCheckoutSchema, req.body);
  const tenant = await getStorefrontTenant();
  const user = await prisma.user.findUnique({
    where: { id: res.locals.auth.userId },
    select: { id: true, name: true, email: true, customerAccount: { select: { id: true } } },
  });
  if (!user?.customerAccount) throw new HttpError(401, "La sesión de cliente ya no es válida.", "SESSION_INVALID");
  const packageCount = body.items.reduce((sum, item) => sum + item.quantity, 0);
  if (packageCount > 30 || body.quotedPackageCount !== packageCount) {
    throw new HttpError(409, "La bolsa cambió después de cotizar el envío. Vuelve a cotizar.", "SHIPPING_PACKAGE_COUNT_CHANGED");
  }
  const shippingRate = await getCheapestUpsRate({
    addressLine1: body.shippingAddress.addressLine1,
    addressLine2: body.shippingAddress.addressLine2,
    city: body.shippingAddress.city,
    state: body.shippingAddress.state,
    postalCode: body.shippingAddress.postalCode,
    country: body.shippingAddress.country,
  }, packageCount);
  if (shippingRate.totalCents !== body.quotedShippingCents) {
    throw new HttpError(409, "La tarifa de UPS cambió. Vuelve a cotizar antes de continuar al pago.", "SHIPPING_RATE_CHANGED");
  }

  const productIds = [...new Set(body.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      tenantId: tenant.id,
      status: "published",
      fulfillmentMode: "in_house",
    },
    include: { variants: true },
  });
  if (
    products.length !== productIds.length
    || products.some((product) => product.providerCode !== "pegapega" && !storefrontDesignerProductTypeSet.has(product.productType))
  ) {
    throw new HttpError(400, "Uno o más productos ya no están disponibles.", "INVALID_CHECKOUT_PRODUCT");
  }
  const productMap = new Map(products.map((product) => [product.id, product]));
  const artworkIdsByItem = body.items.map((item) => {
    const sideArtworkIds = item.artworkSides
      ? Object.values(item.artworkSides).filter((id): id is string => Boolean(id))
      : [];
    return sideArtworkIds.length ? sideArtworkIds : item.artworkAssetId ? [item.artworkAssetId] : [];
  });
  const allArtworkIds = artworkIdsByItem.flat();
  const artworkIds = [...new Set(allArtworkIds)];
  if (
    artworkIds.length !== allArtworkIds.length
    || body.items.some((item, index) => (
      item.artworkSides
      && item.artworkAssetId
      && Object.values(item.artworkSides).some(Boolean)
      && !Object.values(item.artworkSides).includes(item.artworkAssetId)
    ) || (!artworkIdsByItem[index]?.length && !item.designConfig?.text.trim()))
  ) {
    throw new HttpError(400, "Cada diseño debe incluir una imagen válida o texto para imprimir; los archivos de cada lado deben ser únicos.", "INVALID_CHECKOUT_DESIGN");
  }
  const artworkAssets = await prisma.productArtworkAsset.findMany({
    where: {
      id: { in: artworkIds },
      tenantId: tenant.id,
      uploadedByUserId: user.id,
    },
    select: { id: true },
  });
  if (artworkAssets.length !== artworkIds.length) {
    throw new HttpError(400, "Falta un diseño válido para uno o más productos.", "INVALID_CHECKOUT_ARTWORK");
  }

  const lineItems = body.items.map((item, index) => {
    const product = productMap.get(item.productId);
    const variant = product?.variants.find((candidate) => candidate.id === item.variantId);
    if (!product || !variant || variant.salePrice.lte(0) || variant.currency !== "MXN") {
      throw new HttpError(400, "Una presentación no tiene precio de venta válido.", "INVALID_CHECKOUT_VARIANT");
    }
    const designerOptions = getCustomerDesignerOptions(product.designConfig);
    if (!designerOptions.text && item.designConfig?.text.trim()) {
      throw new HttpError(400, "Este producto no permite agregar texto al diseño.", "CHECKOUT_TEXT_DISABLED");
    }
    if (!designerOptions.artwork && (artworkIdsByItem[index]?.length ?? 0) > 0) {
      throw new HttpError(400, "Este producto no permite cargar imágenes al diseño.", "CHECKOUT_ARTWORK_DISABLED");
    }
    if (!designerOptions.sides && (item.artworkSides?.back || item.designConfig?.sides.back.artwork)) {
      throw new HttpError(400, "Este producto solo permite diseñar el frente.", "CHECKOUT_BACK_SIDE_DISABLED");
    }
    if (!designerOptions.transform && item.designConfig && Object.values(item.designConfig.sides).some((side) => (
      side.positionX !== 50 || side.positionY !== 48 || side.scale !== 85 || (side.rotation ?? 0) !== 0
    ))) {
      throw new HttpError(400, "Este producto no permite mover, escalar ni rotar el diseño.", "CHECKOUT_TRANSFORM_DISABLED");
    }
    if (!designerOptions.productColors && variant.color) {
      const defaultProductColor = getDefaultProductColor(product.designConfig);
      const hasPricedDefaultVariant = defaultProductColor && product.variants.some((candidate) => (
        candidate.color?.trim().toLowerCase() === defaultProductColor.toLowerCase()
        && candidate.salePrice.gt(0)
        && candidate.currency === "MXN"
      ));
      if (hasPricedDefaultVariant && variant.color.trim().toLowerCase() !== defaultProductColor.toLowerCase()) {
        throw new HttpError(400, "El color de producto seleccionado no está disponible.", "CHECKOUT_PRODUCT_COLOR_DISABLED");
      }
    }
    if (item.designConfig && !isEnabledTextColor(product.designConfig, item.designConfig.textColor)) {
      throw new HttpError(400, "El color de texto seleccionado ya no está disponible para este producto.", "INVALID_CHECKOUT_TEXT_COLOR");
    }
    return {
      product,
      variant,
      quantity: item.quantity,
      artworkAssetId: item.artworkAssetId,
      artworkSides: item.artworkSides,
      designConfig: item.designConfig,
      options: item.options,
      unitPriceCents: Math.round(variant.salePrice.toNumber() * 100),
    };
  });
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const shippingCents = shippingRate.totalCents;
  const shippingTotal = shippingCents / 100;
  const totalCents = subtotalCents + shippingCents;
  if (totalCents <= 0 || !Number.isSafeInteger(totalCents)) {
    throw new HttpError(400, "El total del pedido no es válido.", "INVALID_CHECKOUT_TOTAL");
  }

  const orderNumber = `POD-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      customerUserId: user.id,
      storeName: "Printly",
      orderNumber,
      customerName: body.shippingAddress.recipient,
      customerEmail: user.email,
      shippingAddress: {
        ...body.shippingAddress,
        shippingProvider: "UPS",
        shippingServiceCode: shippingRate.serviceCode,
        shippingServiceName: shippingRate.serviceName,
      } satisfies Prisma.InputJsonObject,
      shippingTotal,
      currency: "MXN",
      customerTotal: totalCents / 100,
      status: "received",
      paymentStatus: "pending",
      items: {
        create: lineItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          variantName: item.variant.name,
          quantity: item.quantity,
          unitSalePrice: item.unitPriceCents / 100,
          unitProviderCost: item.variant.providerCost,
          artworkAssetId: item.artworkAssetId,
          designConfig: {
            options: item.options,
            ...(item.designConfig ? { design: item.designConfig } : {}),
            ...(item.artworkSides ? { artworkSides: item.artworkSides } : {}),
          } satisfies Prisma.InputJsonObject,
          printInstructions: [
            ...Object.entries(item.options).map(([label, value]) => `${label}: ${value}`),
            ...(item.designConfig
              ? [item.designConfig.text.trim()
                ? `Texto para imprimir: "${item.designConfig.text}" en color ${item.designConfig.textColor}.`
                : "Diseño personalizado según archivos adjuntos."]
              : []),
          ].join("\n") || null,
        })),
      },
    },
    include: { items: true },
  });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        ...lineItems.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "mxn",
            unit_amount: item.unitPriceCents,
            product_data: { name: `${item.product.name} · ${item.variant.name}` },
          },
        })),
        ...(shippingCents > 0 ? [{
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: shippingCents,
            product_data: { name: "Envío" },
          },
        }] : []),
      ],
      success_url: `${config.WEB_ORIGIN}/store/checkout?status=success&order=${order.id}`,
      cancel_url: `${config.WEB_ORIGIN}/store/checkout?status=cancelled&order=${order.id}`,
      metadata: { tenantId: tenant.id, orderId: order.id },
    });
    if (!session.url) throw new Error("Stripe no devolvió una URL de pago.");
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: session.id },
    });
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "failed", status: "failed" },
    });
    throw error;
  }
  res.status(201).json({ orderId: order.id, orderNumber, checkoutUrl: session.url });
}));

router.post("/catalog/import", requireAuth, requireCsrf, requireRole("owner", "admin"), asyncRoute(async (_req, res) => {
  const tenant = await getStorefrontTenant();
  if (res.locals.auth.tenantId !== tenant.id) {
    throw new HttpError(403, "Solo el equipo de la tienda central puede importar este catálogo.", "STOREFRONT_TENANT_REQUIRED");
  }
  const imported: string[] = [];
  const updated: string[] = [];
  for (const sticker of stickerProducts) {
    const existing = await prisma.product.findUnique({
      where: { tenantId_providerCode_externalProductId: { tenantId: tenant.id, providerCode: "pegapega", externalProductId: sticker.id } },
      include: { variants: true },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: sticker.name,
          description: sticker.description,
          productionMethod: "Impresión de stickers",
        },
      });
      for (const [index, name] of sticker.variants.entries()) {
        const defaultPricing = getDefaultStickerVariantPricing(index, sticker.variants.length);
        const existingVariant = existing.variants.find((variant) => variant.name === name);
        if (existingVariant) {
          const salePrice = existingVariant.salePrice.toNumber() > 0
            ? existingVariant.salePrice.toNumber()
            : defaultPricing.salePrice;
          const providerCost = existingVariant.providerCost.toNumber() > 0
            ? existingVariant.providerCost.toNumber()
            : Math.round(salePrice * 50) / 100;
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: { size: name, salePrice, providerCost },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: existing.id,
              name,
              size: name,
              ...defaultPricing,
              currency: "MXN",
            },
          });
        }
      }
      const firstVariant = sticker.variants[0];
      const firstExistingVariant = existing.variants.find((variant) => variant.name === firstVariant);
      const firstPricing = getDefaultStickerVariantPricing(0, sticker.variants.length);
      const firstSalePrice = firstExistingVariant?.salePrice.toNumber() || firstPricing.salePrice;
      const firstProviderCost = firstExistingVariant?.providerCost.toNumber() || Math.round(firstSalePrice * 50) / 100;
      await prisma.product.update({
        where: { id: existing.id },
        data: { salePrice: firstSalePrice, baseCost: firstProviderCost },
      });
      updated.push(sticker.id);
      continue;
    }
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: sticker.name,
        description: sticker.description,
        providerCode: "pegapega",
        externalProductId: sticker.id,
        fulfillmentMode: "in_house",
        productType: "custom",
        productionMethod: "Impresión de stickers",
        manufacturingNotes: "Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.",
        designConfig: { catalogProductId: sticker.id } satisfies Prisma.InputJsonObject,
        baseCost: getDefaultStickerVariantPricing(0, sticker.variants.length).providerCost,
        salePrice: getDefaultStickerVariantPricing(0, sticker.variants.length).salePrice,
        status: "draft",
        currency: "MXN",
        variants: {
          create: sticker.variants.map((name, index) => ({
            name,
            size: name,
            ...getDefaultStickerVariantPricing(index, sticker.variants.length),
            currency: "MXN",
          })),
        },
      },
    });
    imported.push(sticker.id);
  }
  res.status(201).json({
    imported: imported.length,
    updated: updated.length,
    total: stickerProducts.length,
    productIds: imported,
  });
}));

export default router;

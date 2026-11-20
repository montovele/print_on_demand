import { Router } from "express";
import { FulfillmentMode, Prisma, ProductStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../database.js";
import { asyncRoute, assertBody, HttpError, pathParam, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { isProductTemplateId } from "../designer/templates.js";
import { getProductPublicationSkipReason } from "./bulk-publication.js";
import { validateVariantUpdate } from "./variant-validation.js";

const router = Router();
const productSchema = z.object({
  name: z.string().trim().min(2).max(191),
  description: z.string().max(10000).optional(),
  baseCost: z.number().finite().min(0).max(999999999),
  salePrice: z.number().finite().min(0).max(999999999),
  currency: z.string().trim().length(3).default("MXN"),
  status: z.nativeEnum(ProductStatus).optional(),
  providerCode: z.string().trim().max(64).optional(),
  externalProductId: z.string().trim().max(191).optional(),
  fulfillmentMode: z.nativeEnum(FulfillmentMode).default("in_house"),
  productType: z.string().trim().min(2).max(50).default("custom"),
  productionMethod: z.string().trim().max(100).optional(),
  productionMinutes: z.number().int().positive().max(100000).optional(),
  manufacturingNotes: z.string().max(10000).optional(),
  designConfig: z.object({
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    text: z.string().max(120),
    textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    textColorOptions: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1).max(10).optional(),
    customerDesignerOptions: z.object({
      productColors: z.boolean(),
      printTextColors: z.boolean(),
      text: z.boolean(),
      artwork: z.boolean(),
      sides: z.boolean(),
      transform: z.boolean(),
    }).optional().refine((options) => !options || options.text || options.artwork, "Activa texto o carga de imágenes para permitir diseños de clientes."),
    defaultProductColor: z.string().trim().min(1).max(80).optional(),
    scale: z.number().finite().min(10).max(100),
    x: z.number().finite().min(0).max(100),
    y: z.number().finite().min(0).max(100),
    rotation: z.number().finite().min(-180).max(180),
    side: z.enum(["front", "back"]),
  }).optional(),
  artworkAssetId: z.string().uuid().nullable().optional(),
  variants: z.array(z.object({
    id: z.string().min(1).optional(),
    name: z.string().trim().min(1).max(191),
    size: z.string().trim().max(80).optional(),
    color: z.string().trim().max(80).optional(),
    sku: z.string().trim().max(100).optional(),
    providerCost: z.number().finite().min(0).max(999999999).optional(),
    salePrice: z.number().finite().min(0).max(999999999).optional(),
  })).min(1).max(100).optional(),
});

function serializeProduct(product: {
  id: string;
  name: string;
  description: string | null;
  status: ProductStatus;
  providerCode: string | null;
  externalProductId: string | null;
  fulfillmentMode: FulfillmentMode;
  productType: string;
  productionMethod: string | null;
  productionMinutes: number | null;
  manufacturingNotes: string | null;
  designConfig: Prisma.JsonValue | null;
  baseCost: { toNumber(): number };
  salePrice: { toNumber(): number };
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  artworkAsset?: { id: string } | null;
  variants?: Array<{ id: string; sku: string | null; name: string; size: string | null; color: string | null; providerCost: { toNumber(): number }; salePrice: { toNumber(): number }; currency: string }>;
}) {
  return {
    ...product,
    artworkUrl: product.artworkAsset ? `/designer/assets/${product.artworkAsset.id}` : null,
    baseCost: product.baseCost.toNumber(),
    salePrice: product.salePrice.toNumber(),
    variants: product.variants?.map((variant) => ({
      ...variant,
      providerCost: variant.providerCost.toNumber(),
      salePrice: variant.salePrice.toNumber(),
    })),
  };
}

router.use(requireAuth, requireRole("owner", "admin", "editor", "viewer"));

router.get("/", asyncRoute(async (_req, res) => {
  const products = await prisma.product.findMany({
    where: {
      tenantId: res.locals.auth.tenantId,
      status: { not: "archived" },
    },
    include: { variants: true, artworkAsset: { select: { id: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json({
    items: products.map(serializeProduct),
  });
}));

router.post("/publish-bulk", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (_req, res) => {
  const result = await prisma.$transaction(async (transaction) => {
    const products = await transaction.product.findMany({
      where: {
        tenantId: res.locals.auth.tenantId,
        status: { notIn: ["published", "archived"] },
      },
      select: {
        id: true,
        name: true,
        fulfillmentMode: true,
        providerCode: true,
        productType: true,
        variants: { select: { salePrice: true, currency: true } },
      },
    });
    const publishableIds: string[] = [];
    const skipped: Array<{ name: string; reason: string }> = [];
    for (const product of products) {
      const reason = getProductPublicationSkipReason({
        fulfillmentMode: product.fulfillmentMode,
        providerCode: product.providerCode,
        productType: product.productType,
        variants: product.variants.map((variant) => ({
          salePrice: variant.salePrice.toNumber(),
          currency: variant.currency,
        })),
      });
      if (reason) skipped.push({ name: product.name, reason });
      else publishableIds.push(product.id);
    }

    if (publishableIds.length) {
      await transaction.product.updateMany({
        where: {
          tenantId: res.locals.auth.tenantId,
          id: { in: publishableIds },
          status: { notIn: ["published", "archived"] },
        },
        data: { status: "published" },
      });
    }
    return { published: publishableIds.length, skipped };
  });
  res.json(result);
}));

router.post("/", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(productSchema, req.body);
  if (body.productType !== "custom" && !isProductTemplateId(body.productType)) {
    throw new HttpError(400, "La plantilla de producto no es válida.", "INVALID_PRODUCT_TEMPLATE");
  }
  if (body.fulfillmentMode === "printful" && (!body.providerCode || !body.externalProductId)) {
    throw new HttpError(400, "Los productos de Printful requieren su proveedor e identificador externo.", "EXTERNAL_PRODUCT_MAPPING_REQUIRED");
  }
  if (body.status === "published") {
    const reason = getProductPublicationSkipReason({
      fulfillmentMode: body.fulfillmentMode,
      providerCode: body.providerCode ?? null,
      productType: body.productType,
      variants: (body.variants ?? []).map((variant) => ({
        salePrice: variant.salePrice ?? body.salePrice,
        currency: body.currency.toUpperCase(),
      })),
    });
    if (reason) throw new HttpError(400, reason, "PRODUCT_NOT_PUBLISHABLE");
  }
  if (body.variants?.some((variant) => variant.id)) {
    throw new HttpError(400, "No envíes identificadores al crear variantes.", "INVALID_PRODUCT_VARIANT");
  }
  if (body.variants && validateVariantUpdate(body.variants, new Set()) === "DUPLICATE_PRODUCT_VARIANT") {
    throw new HttpError(400, "La lista contiene variantes repetidas.", "DUPLICATE_PRODUCT_VARIANT");
  }
  if (body.artworkAssetId) {
    const artworkAsset = await prisma.productArtworkAsset.findFirst({
      where: { id: body.artworkAssetId, tenantId: res.locals.auth.tenantId },
      select: { id: true },
    });
    if (!artworkAsset) throw new HttpError(404, "El archivo de diseño no existe en esta cuenta.", "ARTWORK_NOT_FOUND");
  }
  const product = await prisma.product.create({
    data: {
      tenantId: res.locals.auth.tenantId,
      name: body.name,
      description: body.description ?? null,
      baseCost: body.baseCost,
      salePrice: body.salePrice,
      currency: body.currency.toUpperCase(),
      status: body.status ?? "draft",
      providerCode: body.providerCode ?? null,
      externalProductId: body.externalProductId ?? null,
      fulfillmentMode: body.fulfillmentMode,
      productType: body.productType,
      productionMethod: body.productionMethod ?? null,
      productionMinutes: body.productionMinutes ?? null,
      manufacturingNotes: body.manufacturingNotes ?? null,
      designConfig: body.designConfig ?? Prisma.DbNull,
      artworkAssetId: body.artworkAssetId ?? null,
      ...(body.variants?.length ? {
        variants: {
          create: body.variants.map((variant) => ({
            name: variant.name,
            size: variant.size ?? null,
            color: variant.color ?? null,
            sku: variant.sku?.trim() || null,
            providerCost: variant.providerCost ?? body.baseCost,
            salePrice: variant.salePrice ?? body.salePrice,
            currency: body.currency.toUpperCase(),
          })),
        },
      } : {}),
    },
    include: { variants: true, artworkAsset: { select: { id: true } } },
  });
  res.status(201).json(serializeProduct(product));
}));

router.get("/:id", asyncRoute(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: {
      id: pathParam(req, "id"),
      tenantId: res.locals.auth.tenantId,
      status: { not: "archived" },
    },
    include: { variants: true, artworkAsset: { select: { id: true } } },
  });
  if (!product) throw new HttpError(404, "Producto no encontrado.", "PRODUCT_NOT_FOUND");
  res.json(serializeProduct(product));
}));

router.patch("/:id", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(productSchema.partial(), req.body);
  if (Object.keys(body).length === 0) throw new HttpError(400, "Indica al menos un campo para actualizar.", "EMPTY_UPDATE");
  const existing = await prisma.product.findFirst({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId, status: { not: "archived" } },
    select: {
      id: true,
      fulfillmentMode: true,
      providerCode: true,
      externalProductId: true,
      productType: true,
      baseCost: true,
      salePrice: true,
      currency: true,
      status: true,
      variants: { select: { id: true, salePrice: true, currency: true } },
    },
  });
  if (!existing) throw new HttpError(404, "Producto no encontrado.", "PRODUCT_NOT_FOUND");
  const publicationFieldsChanged = body.status !== undefined
    || body.fulfillmentMode !== undefined
    || body.providerCode !== undefined
    || body.productType !== undefined
    || body.currency !== undefined
    || body.salePrice !== undefined
    || body.variants !== undefined;
  if ((body.status ?? existing.status) === "published" && publicationFieldsChanged) {
    const variantCount = body.variants?.length ?? existing.variants.length;
    if (variantCount === 0) {
      throw new HttpError(400, "Configura al menos una variante antes de publicar el producto.", "PRODUCT_VARIANTS_REQUIRED");
    }
    const existingVariantPrices = new Map(existing.variants.map((variant) => [variant.id, variant.salePrice.toNumber()]));
    const variantPrices = body.variants
      ? body.variants.map((variant) => variant.salePrice ?? existingVariantPrices.get(variant.id ?? "") ?? body.salePrice ?? existing.salePrice.toNumber())
      : existing.variants.map((variant) => body.salePrice ?? variant.salePrice.toNumber());
    if (variantPrices.some((price) => price <= 0)) {
      throw new HttpError(400, "El precio final de todas las variantes debe ser mayor que cero.", "PRODUCT_PRICE_REQUIRED");
    }
    const existingVariantCurrencies = new Map(existing.variants.map((variant) => [variant.id, variant.currency]));
    const variantCurrencies = body.variants
      ? body.variants.map((variant) => body.currency?.toUpperCase() ?? existingVariantCurrencies.get(variant.id ?? "") ?? existing.currency)
      : existing.variants.map((variant) => body.currency?.toUpperCase() ?? variant.currency);
    const reason = getProductPublicationSkipReason({
      fulfillmentMode: body.fulfillmentMode ?? existing.fulfillmentMode,
      providerCode: body.providerCode ?? existing.providerCode,
      productType: body.productType ?? existing.productType,
      variants: variantPrices.map((salePrice, index) => ({
        salePrice,
        currency: variantCurrencies[index] ?? existing.currency,
      })),
    });
    if (reason) throw new HttpError(400, reason, "PRODUCT_NOT_PUBLISHABLE");
  }
  if (
    (body.fulfillmentMode ?? existing.fulfillmentMode) === "printful"
    && !(body.providerCode ?? existing.providerCode)
  ) {
    throw new HttpError(400, "Los productos de Printful requieren su proveedor e identificador externo.", "EXTERNAL_PRODUCT_MAPPING_REQUIRED");
  }
  if (body.productType && body.productType !== "custom" && !isProductTemplateId(body.productType)) {
    throw new HttpError(400, "La plantilla de producto no es válida.", "INVALID_PRODUCT_TEMPLATE");
  }
  if (body.artworkAssetId) {
    const artworkAsset = await prisma.productArtworkAsset.findFirst({
      where: { id: body.artworkAssetId, tenantId: res.locals.auth.tenantId },
      select: { id: true },
    });
    if (!artworkAsset) throw new HttpError(404, "El archivo de diseño no existe en esta cuenta.", "ARTWORK_NOT_FOUND");
  }
  if (
    (body.fulfillmentMode ?? existing.fulfillmentMode) === "printful"
    && !(body.externalProductId ?? existing.externalProductId)
  ) {
    throw new HttpError(400, "Los productos de Printful requieren su proveedor e identificador externo.", "EXTERNAL_PRODUCT_MAPPING_REQUIRED");
  }
  if (body.variants !== undefined) {
    if ((body.fulfillmentMode ?? existing.fulfillmentMode) === "printful") {
      throw new HttpError(400, "Las variantes de productos externos se administran desde su proveedor.", "EXTERNAL_VARIANTS_MANAGED_BY_PROVIDER");
    }
    const variantValidationError = validateVariantUpdate(body.variants, new Set(existing.variants.map((variant) => variant.id)));
    if (variantValidationError === "DUPLICATE_PRODUCT_VARIANT") {
      throw new HttpError(400, "La lista contiene variantes repetidas.", "DUPLICATE_PRODUCT_VARIANT");
    }
    if (variantValidationError === "DUPLICATE_PRODUCT_VARIANT_ID") {
      throw new HttpError(400, "La lista contiene identificadores de variante repetidos.", "DUPLICATE_PRODUCT_VARIANT_ID");
    }
    if (variantValidationError === "INVALID_PRODUCT_VARIANT") {
      throw new HttpError(400, "Una variante no pertenece a este producto.", "INVALID_PRODUCT_VARIANT");
    }
  }
  const data: Prisma.ProductUpdateInput = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.baseCost !== undefined) data.baseCost = body.baseCost;
  if (body.salePrice !== undefined) data.salePrice = body.salePrice;
  if (body.currency !== undefined) data.currency = body.currency.toUpperCase();
  if (body.status !== undefined) data.status = body.status;
  if (body.providerCode !== undefined) data.providerCode = body.providerCode;
  if (body.externalProductId !== undefined) data.externalProductId = body.externalProductId;
  if (body.fulfillmentMode !== undefined) data.fulfillmentMode = body.fulfillmentMode;
  if (body.productType !== undefined) data.productType = body.productType;
  if (body.productionMethod !== undefined) data.productionMethod = body.productionMethod;
  if (body.productionMinutes !== undefined) data.productionMinutes = body.productionMinutes;
  if (body.manufacturingNotes !== undefined) data.manufacturingNotes = body.manufacturingNotes;
  if (body.designConfig !== undefined) data.designConfig = body.designConfig;
  if (body.artworkAssetId !== undefined) {
    data.artworkAsset = body.artworkAssetId
      ? { connect: { id: body.artworkAssetId } }
      : { disconnect: true };
  }
  const product = await prisma.$transaction(async (transaction) => {
    if (Object.keys(data).length) {
      await transaction.product.update({ where: { id: existing.id }, data });
    }
    if (body.variants !== undefined) {
      const submittedIds = body.variants.flatMap((variant) => variant.id ? [variant.id] : []);
      await transaction.productVariant.deleteMany({
        where: {
          productId: existing.id,
          ...(submittedIds.length ? { id: { notIn: submittedIds } } : {}),
        },
      });
      const updates = [];
      const creates = [];
      for (const variant of body.variants) {
        const variantData = {
          name: variant.name,
          size: variant.size ?? null,
          color: variant.color ?? null,
          sku: variant.sku?.trim() || null,
          ...(variant.providerCost !== undefined ? { providerCost: variant.providerCost } : {}),
          ...(variant.salePrice !== undefined ? { salePrice: variant.salePrice } : {}),
          ...(body.currency !== undefined ? { currency: body.currency.toUpperCase() } : {}),
        };
        if (variant.id) {
          updates.push(transaction.productVariant.update({
            where: { id: variant.id },
            data: variantData,
          }));
        } else {
          creates.push({
            ...variantData,
            providerCost: variant.providerCost ?? body.baseCost ?? existing.baseCost,
            salePrice: variant.salePrice ?? body.salePrice ?? existing.salePrice,
            currency: (body.currency ?? existing.currency).toUpperCase(),
            productId: existing.id,
          });
        }
      }
      await Promise.all(updates);
      if (creates.length) await transaction.productVariant.createMany({ data: creates });
    }
    return transaction.product.findUniqueOrThrow({
      where: { id: existing.id },
      include: { variants: true, artworkAsset: { select: { id: true } } },
    });
  });
  res.json(serializeProduct(product));
}));

router.delete("/:id", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const result = await prisma.product.updateMany({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId, status: { not: "archived" } },
    data: { status: "archived" },
  });
  if (result.count === 0) throw new HttpError(404, "Producto no encontrado.", "PRODUCT_NOT_FOUND");
  res.status(204).end();
}));

export default router;

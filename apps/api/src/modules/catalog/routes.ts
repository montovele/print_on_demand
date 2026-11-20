import { Router } from "express";
import { prisma } from "../../database.js";
import { printfulRequest } from "../../integrations/printful/client.js";
import { decryptSecret } from "../../lib/encryption.js";
import { asyncRoute, HttpError } from "../../lib/http.js";
import { requireAuth } from "../../middleware/auth.js";

type PrintfulCatalogProduct = {
  id: number;
  type?: string;
  title?: string;
  image?: string;
  variant_count?: number;
  description?: string;
};

const router = Router();
router.use(requireAuth);

router.get("/products", asyncRoute(async (_req, res) => {
  if (res.locals.auth.role === "customer" && _req.query.source === "printful") {
    throw new HttpError(403, "El catálogo de proveedores solo está disponible para el equipo de la tienda.", "FORBIDDEN");
  }
  if (_req.query.source !== "printful") {
    const products = await prisma.product.findMany({
      where: {
        tenantId: res.locals.auth.tenantId,
        status: res.locals.auth.role === "customer" ? "published" : { not: "archived" },
        fulfillmentMode: "in_house",
      },
      include: { variants: true, artworkAsset: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json({
      source: "in_house",
      items: products.map((product) => ({
        id: product.id,
        externalId: product.id,
        name: product.name,
        type: product.productionMethod,
        imageUrl: product.artworkAsset ? `/designer/assets/${product.artworkAsset.id}` : null,
        variantCount: product.variants.length,
        description: product.description,
        providerCode: "in_house",
        ...(res.locals.auth.role === "customer" ? {} : { baseCost: product.baseCost.toNumber() }),
        salePrice: product.salePrice.toNumber(),
        currency: product.currency,
        status: product.status,
      })),
    });
    return;
  }

  const account = await prisma.providerAccount.findUnique({
    where: { tenantId_providerCode: { tenantId: res.locals.auth.tenantId, providerCode: "printful" } },
  });
  if (!account || account.connectionStatus !== "connected") {
    throw new HttpError(409, "Conecta una cuenta de Printful para consultar el catálogo.", "PROVIDER_NOT_CONNECTED");
  }

  const response = await printfulRequest<{ result?: PrintfulCatalogProduct[] }>("/products", decryptSecret(account.encryptedAccessToken));
  if (!Array.isArray(response.result)) {
    throw new HttpError(502, "Printful devolvió un catálogo con un formato inesperado.", "PROVIDER_RESPONSE_INVALID");
  }
  res.json({
    source: "printful",
    items: response.result.map((product) => ({
      externalId: String(product.id),
      name: product.title ?? `Producto ${product.id}`,
      type: product.type ?? null,
      imageUrl: product.image ?? null,
      variantCount: product.variant_count ?? null,
      description: product.description ?? null,
      providerCode: "printful",
    })),
  });
}));

export default router;

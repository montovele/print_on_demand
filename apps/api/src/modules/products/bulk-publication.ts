interface PublishableProduct {
  fulfillmentMode: string;
  providerCode: string | null;
  productType: string;
  variants: Array<{ salePrice: number; currency: string }>;
}

export const storefrontDesignerProductTypes = [
  "tshirt",
  "hoodie",
  "mug",
  "tumbler",
  "tote",
  "pillow",
  "puzzle",
  "keychain",
  "photo-plaque",
  "apron",
  "cap",
  "mousepad",
  "poster",
] as const;

export function getProductPublicationSkipReason(product: PublishableProduct) {
  if (product.fulfillmentMode !== "in_house") return "La tienda solo admite productos de fabricación propia.";
  if (product.variants.length === 0) return "Agrega al menos una variante.";
  if (product.variants.some((variant) => variant.salePrice <= 0)) return "Configura un precio mayor que cero en todas las variantes.";
  if (!product.variants.some((variant) => variant.currency === "MXN" && variant.salePrice > 0)) {
    return "Configura al menos una variante con precio válido en MXN.";
  }
  return null;
}

const MIN_STICKER_VARIANT_PRICE = 20;
const MAX_STICKER_VARIANT_PRICE = 100;

export function getDefaultStickerVariantPricing(index: number, variantCount: number) {
  if (!Number.isInteger(index) || !Number.isInteger(variantCount) || variantCount < 1 || index < 0 || index >= variantCount) {
    throw new RangeError("El índice de presentación no es válido.");
  }

  const progress = variantCount === 1 ? 0 : index / (variantCount - 1);
  const salePrice = Math.round((MIN_STICKER_VARIANT_PRICE + progress * (MAX_STICKER_VARIANT_PRICE - MIN_STICKER_VARIANT_PRICE)) * 100) / 100;
  return { salePrice, providerCost: Math.round(salePrice * 50) / 100 };
}

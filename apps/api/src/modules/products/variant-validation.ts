export type VariantUpdateValidationError =
  | "DUPLICATE_PRODUCT_VARIANT"
  | "DUPLICATE_PRODUCT_VARIANT_ID"
  | "INVALID_PRODUCT_VARIANT";

interface SubmittedVariant {
  id?: string | undefined;
  size?: string | undefined;
  color?: string | undefined;
}

export function validateVariantUpdate(
  variants: SubmittedVariant[],
  existingVariantIds: ReadonlySet<string>,
): VariantUpdateValidationError | null {
  const combinations = variants.map((variant) => JSON.stringify([variant.size ?? "", variant.color ?? ""]));
  if (new Set(combinations).size !== variants.length) return "DUPLICATE_PRODUCT_VARIANT";

  const submittedIds = variants.flatMap((variant) => variant.id ? [variant.id] : []);
  if (new Set(submittedIds).size !== submittedIds.length) return "DUPLICATE_PRODUCT_VARIANT_ID";
  if (submittedIds.some((id) => !existingVariantIds.has(id))) return "INVALID_PRODUCT_VARIANT";
  return null;
}

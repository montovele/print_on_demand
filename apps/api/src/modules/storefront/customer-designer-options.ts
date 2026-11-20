export interface CustomerDesignerOptions {
  productColors: boolean;
  printTextColors: boolean;
  text: boolean;
  artwork: boolean;
  sides: boolean;
  transform: boolean;
}

export const DEFAULT_CUSTOMER_DESIGNER_OPTIONS: CustomerDesignerOptions = {
  productColors: true,
  printTextColors: true,
  text: true,
  artwork: true,
  sides: true,
  transform: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function getCustomerDesignerOptions(designConfig: unknown): CustomerDesignerOptions {
  const rawOptions = isRecord(designConfig) && isRecord(designConfig.customerDesignerOptions)
    ? designConfig.customerDesignerOptions
    : {};

  return {
    productColors: typeof rawOptions.productColors === "boolean" ? rawOptions.productColors : true,
    printTextColors: typeof rawOptions.printTextColors === "boolean" ? rawOptions.printTextColors : true,
    text: typeof rawOptions.text === "boolean" ? rawOptions.text : true,
    artwork: typeof rawOptions.artwork === "boolean" ? rawOptions.artwork : true,
    sides: typeof rawOptions.sides === "boolean" ? rawOptions.sides : true,
    transform: typeof rawOptions.transform === "boolean" ? rawOptions.transform : true,
  };
}

export function getDefaultProductColor(designConfig: unknown): string | undefined {
  if (!isRecord(designConfig) || typeof designConfig.defaultProductColor !== "string") return undefined;
  const color = designConfig.defaultProductColor.trim();
  return color || undefined;
}

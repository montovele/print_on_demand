export interface ProductColorOption {
  name: string;
  value: string;
}

export const productVariantColors: ProductColorOption[] = [
  { name: "Blanco", value: "#f7f7f5" },
  { name: "Negro", value: "#292a2d" },
  { name: "Gris", value: "#a9abb0" },
  { name: "Azul marino", value: "#263c5a" },
  { name: "Rojo", value: "#d94e54" },
  { name: "Verde", value: "#4b8c70" },
  { name: "Rosa", value: "#e7a5b1" },
  { name: "Amarillo", value: "#efc75e" },
];

export function getProductVariantColorValue(
  value: string,
  productColors: readonly ProductColorOption[] = [],
): string | undefined {
  const normalized = value.trim().toLowerCase();
  const configuredColor = productVariantColors.find((color) =>
    color.value.toLowerCase() === normalized || color.name.toLowerCase() === normalized,
  );
  if (configuredColor) return configuredColor.value;

  const productColor = productColors.find((color) =>
    color.value.toLowerCase() === normalized || color.name.toLowerCase() === normalized,
  );
  return productColor?.value;
}

export interface PrintTextColor {
  name: string;
  value: string;
}

export const printTextColors: PrintTextColor[] = [
  { name: "Carbón", value: "#252632" },
  { name: "Blanco", value: "#ffffff" },
  { name: "Azul marino", value: "#263c5a" },
  { name: "Rojo", value: "#d94e54" },
  { name: "Verde", value: "#26734d" },
  { name: "Rosa", value: "#c3456c" },
  { name: "Naranja", value: "#ed7a2d" },
  { name: "Amarillo", value: "#d6a11e" },
  { name: "Violeta", value: "#7350a3" },
  { name: "Turquesa", value: "#0e8d8a" },
];

export const defaultPrintTextColors = ["#252632", "#263c5a", "#d94e54"];

export function normalizePrintTextColors(value: unknown): string[] {
  if (!Array.isArray(value)) return [...defaultPrintTextColors];
  const colors = [...new Set(value.filter((color): color is string =>
    typeof color === "string" && /^#[\da-f]{6}$/i.test(color),
  ).map((color) => color.toLowerCase()))];
  return colors.length ? colors : [...defaultPrintTextColors];
}

export function getPrintTextColorName(value: string): string {
  return printTextColors.find((color) => color.value === value.toLowerCase())?.name ?? "Color personalizado";
}

import { getCustomerDesignerOptions } from "./customer-designer-options.js";

const DEFAULT_TEXT_COLOR = "#252632";
const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function getEnabledTextColors(designConfig: unknown): string[] {
  if (!isRecord(designConfig)) return [DEFAULT_TEXT_COLOR];

  if (!getCustomerDesignerOptions(designConfig).printTextColors) {
    return typeof designConfig.textColor === "string" && HEX_COLOR_PATTERN.test(designConfig.textColor)
      ? [designConfig.textColor.toLowerCase()]
      : [DEFAULT_TEXT_COLOR];
  }

  const configuredColors = Array.isArray(designConfig.textColorOptions) ? designConfig.textColorOptions : [];
  const enabledColors = [...new Set(configuredColors
    .filter((color): color is string => typeof color === "string" && HEX_COLOR_PATTERN.test(color))
    .map((color) => color.toLowerCase()))];
  if (enabledColors.length) return enabledColors;

  return typeof designConfig.textColor === "string" && HEX_COLOR_PATTERN.test(designConfig.textColor)
    ? [designConfig.textColor.toLowerCase()]
    : [DEFAULT_TEXT_COLOR];
}

export function isEnabledTextColor(designConfig: unknown, color: string): boolean {
  return getEnabledTextColors(designConfig).includes(color.toLowerCase());
}

import { describe, expect, it } from "vitest";
import { getProductVariantColorValue } from "./productColors";

describe("product variant color values", () => {
  it("resolves admin color names to the matching swatch value", () => {
    expect(getProductVariantColorValue("Rojo")).toBe("#d94e54");
    expect(getProductVariantColorValue("Azul marino")).toBe("#263c5a");
  });

  it("supports product-specific colors when they are not in the admin palette", () => {
    expect(getProductVariantColorValue("Marfil", [{ name: "Marfil", value: "#f4f0e9" }])).toBe("#f4f0e9");
  });
});

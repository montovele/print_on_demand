import { describe, expect, it } from "vitest";
import { validateVariantUpdate } from "./variant-validation.js";

describe("validateVariantUpdate", () => {
  it("allows an empty list and new variants without IDs", () => {
    expect(validateVariantUpdate([], new Set(["existing"]))).toBeNull();
    expect(validateVariantUpdate([{ size: "M", color: "Negro" }], new Set())).toBeNull();
  });

  it("allows existing variants belonging to the product", () => {
    expect(validateVariantUpdate([
      { id: "variant-1", size: "M", color: "Negro" },
      { id: "variant-2", size: "L", color: "Negro" },
    ], new Set(["variant-1", "variant-2"]))).toBeNull();
  });

  it("rejects repeated size and color combinations", () => {
    expect(validateVariantUpdate([
      { size: "M", color: "Negro" },
      { size: "M", color: "Negro" },
    ], new Set())).toBe("DUPLICATE_PRODUCT_VARIANT");
  });

  it("rejects repeated IDs and variants from another product", () => {
    expect(validateVariantUpdate([
      { id: "variant-1", size: "M", color: "Negro" },
      { id: "variant-1", size: "L", color: "Negro" },
    ], new Set(["variant-1"]))).toBe("DUPLICATE_PRODUCT_VARIANT_ID");
    expect(validateVariantUpdate([
      { id: "foreign-variant", size: "M", color: "Negro" },
    ], new Set(["variant-1"]))).toBe("INVALID_PRODUCT_VARIANT");
  });

  it("compares combinations without delimiter collisions", () => {
    expect(validateVariantUpdate([
      { size: "A:B", color: "C" },
      { size: "A", color: "B:C" },
    ], new Set())).toBeNull();
  });
});

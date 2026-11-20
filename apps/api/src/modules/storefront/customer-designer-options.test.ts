import { describe, expect, it } from "vitest";
import { DEFAULT_CUSTOMER_DESIGNER_OPTIONS, getCustomerDesignerOptions, getDefaultProductColor } from "./customer-designer-options.js";

describe("customer designer options", () => {
  it("preserves existing customer controls when a product has no saved options", () => {
    expect(getCustomerDesignerOptions(null)).toEqual(DEFAULT_CUSTOMER_DESIGNER_OPTIONS);
  });

  it("uses configured values and keeps missing values enabled", () => {
    expect(getCustomerDesignerOptions({
      customerDesignerOptions: { text: false, productColors: false },
    })).toEqual({
      ...DEFAULT_CUSTOMER_DESIGNER_OPTIONS,
      productColors: false,
      text: false,
    });
  });

  it("reads a trimmed default product color when configured", () => {
    expect(getDefaultProductColor({ defaultProductColor: "  Negro " })).toBe("Negro");
    expect(getDefaultProductColor({ defaultProductColor: "" })).toBeUndefined();
  });
});

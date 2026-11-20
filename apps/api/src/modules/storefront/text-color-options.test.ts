import { describe, expect, it } from "vitest";
import { getEnabledTextColors, isEnabledTextColor } from "./text-color-options.js";

describe("storefront text color options", () => {
  it("returns unique, valid colors enabled for the product", () => {
    expect(getEnabledTextColors({
      textColorOptions: ["#D94E54", "#d94e54", "blue", "#263c5a"],
      textColor: "#252632",
    })).toEqual(["#d94e54", "#263c5a"]);
  });

  it("falls back to the saved preview color for products without configured options", () => {
    expect(getEnabledTextColors({ textColor: "#123456" })).toEqual(["#123456"]);
    expect(getEnabledTextColors(null)).toEqual(["#252632"]);
  });

  it("limits customers to the saved preview color when print color selection is disabled", () => {
    expect(getEnabledTextColors({
      textColor: "#123456",
      textColorOptions: ["#252632", "#d94e54"],
      customerDesignerOptions: { printTextColors: false },
    })).toEqual(["#123456"]);
  });

  it("rejects colors that were not enabled for checkout", () => {
    const config = { textColorOptions: ["#252632", "#d94e54"] };
    expect(isEnabledTextColor(config, "#D94E54")).toBe(true);
    expect(isEnabledTextColor(config, "#ffffff")).toBe(false);
  });
});

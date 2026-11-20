import { describe, expect, it } from "vitest";
import { calculateGrossMargin, calculateSuggestedPrice } from "./calculate-price.js";

describe("pricing calculations", () => {
  it("calculates a sale price from a target margin", () => {
    expect(calculateSuggestedPrice(200, 0.4)).toBe(333.33);
  });

  it("calculates gross margin as a fraction of sale price", () => {
    expect(calculateGrossMargin(333.33, 200)).toBe(0.4);
  });

  it("rejects a target margin of 100 percent or more", () => {
    expect(() => calculateSuggestedPrice(100, 1)).toThrow(RangeError);
  });
});

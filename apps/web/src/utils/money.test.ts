import { describe, expect, it } from "vitest";
import { formatCurrency } from "./money";

describe("formatCurrency", () => {
  it("formats MXN values for the application locale", () => {
    expect(formatCurrency(1250, "MXN")).toContain("1,250");
  });

  it("rejects non-finite amounts", () => {
    expect(() => formatCurrency(Number.NaN)).toThrow(RangeError);
  });
});

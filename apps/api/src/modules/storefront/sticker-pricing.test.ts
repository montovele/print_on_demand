import { describe, expect, it } from "vitest";
import { getDefaultStickerVariantPricing } from "./sticker-pricing.js";

describe("getDefaultStickerVariantPricing", () => {
  it("distributes presentation prices from 20 to 100 MXN and sets base cost to half", () => {
    const prices = Array.from({ length: 5 }, (_, index) => getDefaultStickerVariantPricing(index, 5));

    expect(prices.map(({ salePrice }) => salePrice)).toEqual([20, 40, 60, 80, 100]);
    expect(prices.map(({ providerCost }) => providerCost)).toEqual([10, 20, 30, 40, 50]);
  });

  it("keeps a single presentation at the minimum price", () => {
    expect(getDefaultStickerVariantPricing(0, 1)).toEqual({ salePrice: 20, providerCost: 10 });
  });

  it("rejects indexes outside the presentation list", () => {
    expect(() => getDefaultStickerVariantPricing(2, 2)).toThrow(RangeError);
  });
});

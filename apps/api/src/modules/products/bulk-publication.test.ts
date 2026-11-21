import { describe, expect, it } from "vitest";
import { getProductPublicationSkipReason, storefrontDesignerProductTypes } from "./bulk-publication.js";

describe("getProductPublicationSkipReason", () => {
  it("supports publication for the requested custom product types", () => {
    expect(storefrontDesignerProductTypes).toEqual(expect.arrayContaining([
      "tshirt",
      "mug",
      "tumbler",
      "socks",
    ]));
  });

  it("allows in-house products when every variant has a sale price", () => {
    expect(getProductPublicationSkipReason({
      fulfillmentMode: "in_house",
      providerCode: null,
      productType: "mug",
      variants: [{ salePrice: 20, currency: "MXN" }, { salePrice: 100, currency: "MXN" }],
    })).toBeNull();
  });

  it("requires variants and a positive sale price for each", () => {
    expect(getProductPublicationSkipReason({
      fulfillmentMode: "in_house",
      providerCode: null,
      productType: "mug",
      variants: [],
    }))
      .toBe("Agrega al menos una variante.");
    expect(getProductPublicationSkipReason({
      fulfillmentMode: "in_house",
      providerCode: null,
      productType: "mug",
      variants: [{ salePrice: 20, currency: "MXN" }, { salePrice: 0, currency: "MXN" }],
    })).toBe("Configura un precio mayor que cero en todas las variantes.");
  });

  it("skips external products but allows unsupported types for catalog publication", () => {
    expect(getProductPublicationSkipReason({
      fulfillmentMode: "printful",
      providerCode: "printful",
      productType: "tshirt",
      variants: [{ salePrice: 25, currency: "MXN" }],
    })).toBe("La tienda solo admite productos de fabricación propia.");
    expect(getProductPublicationSkipReason({
      fulfillmentMode: "in_house",
      providerCode: null,
      productType: "custom",
      variants: [{ salePrice: 25, currency: "MXN" }],
    })).toBeNull();
  });

  it("requires at least one MXN-priced variant", () => {
    expect(getProductPublicationSkipReason({
      fulfillmentMode: "in_house",
      providerCode: null,
      productType: "tshirt",
      variants: [{ salePrice: 25, currency: "USD" }],
    })).toBe("Configura al menos una variante con precio válido en MXN.");
  });

  it("allows Pegapega products with their imported custom product type", () => {
    expect(getProductPublicationSkipReason({
      fulfillmentMode: "in_house",
      providerCode: "pegapega",
      productType: "custom",
      variants: [{ salePrice: 25, currency: "MXN" }],
    })).toBeNull();
  });
});

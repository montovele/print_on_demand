import { describe, expect, it } from "vitest";
import { addOrIncrementCartItem, type StorefrontCartItem } from "./storefrontCart";

function item(overrides: Partial<StorefrontCartItem> = {}): StorefrontCartItem {
  return {
    id: "product-1:variant-1",
    productId: "product-1",
    variantId: "variant-1",
    name: "Sticker personalizado",
    variant: "25 piezas",
    price: 20,
    quantity: 1,
    artworkFingerprint: "same-art",
    options: { acabado: "mate" },
    ...overrides,
  };
}

describe("storefront cart", () => {
  it("increments quantity instead of duplicating an identical product configuration", () => {
    const cart = [item()];
    const result = addOrIncrementCartItem(cart, item({ options: { acabado: "mate" } }));

    expect(result.merged).toBe(true);
    expect(result.cart).toHaveLength(1);
    expect(result.cart[0]?.quantity).toBe(2);
  });

  it("keeps different artwork, variants, or print options on separate lines", () => {
    const cart = [item()];
    addOrIncrementCartItem(cart, item({ artworkFingerprint: "different-art" }));
    addOrIncrementCartItem(cart, item({ variantId: "variant-2" }));
    addOrIncrementCartItem(cart, item({ options: { acabado: "brillante" } }));

    expect(cart).toHaveLength(4);
  });

  it("rejects quantities above the order limit", () => {
    expect(() => addOrIncrementCartItem([item({ quantity: 30 })], item())).toThrow("hasta 30 unidades");
  });
});

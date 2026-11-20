import { describe, expect, it } from "vitest";
import { getCustomerProductTemplate } from "./customerProducts";

describe("customer product templates", () => {
  it("provides matching customer previews for the new printable products", () => {
    expect(getCustomerProductTemplate("pillow")?.kind).toBe("pillow");
    expect(getCustomerProductTemplate("puzzle")?.kind).toBe("puzzle");
    expect(getCustomerProductTemplate("keychain")?.kind).toBe("keychain");
    expect(getCustomerProductTemplate("photo-plaque")?.kind).toBe("plaque");
    expect(getCustomerProductTemplate("apron")?.kind).toBe("apron");
    expect(getCustomerProductTemplate("cap")?.kind).toBe("cap");
    expect(getCustomerProductTemplate("mousepad")?.kind).toBe("mousepad");
    expect(getCustomerProductTemplate("unsupported")).toBeUndefined();
  });
});

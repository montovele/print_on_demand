import { describe, expect, it } from "vitest";
import { isProductTemplateId, productTemplates } from "./templates.js";

describe("own-production product templates", () => {
  it("provides unique print-ready templates across product types", () => {
    const ids = productTemplates.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining([
      "tshirt",
      "socks",
      "mug",
      "tote",
      "pillow",
      "puzzle",
      "keychain",
      "photo-plaque",
      "apron",
      "cap",
      "mousepad",
      "poster",
      "label-sheet",
      "label-roll",
      "custom-item",
    ]));
    for (const template of productTemplates) {
      expect(template.sizes.length).toBeGreaterThan(0);
      expect(template.printMethods.length).toBeGreaterThan(0);
      expect(template.printArea.x).toBeGreaterThanOrEqual(0);
      expect(template.printArea.y).toBeGreaterThanOrEqual(0);
      expect(template.printArea.x + template.printArea.width).toBeLessThanOrEqual(100);
      expect(template.printArea.y + template.printArea.height).toBeLessThanOrEqual(100);
    }
  });

  it("recognizes supported templates without accepting arbitrary identifiers", () => {
    expect(isProductTemplateId("tshirt")).toBe(true);
    expect(isProductTemplateId("socks")).toBe(true);
    expect(isProductTemplateId("mug")).toBe(true);
    expect(isProductTemplateId("label-sheet")).toBe(true);
    expect(isProductTemplateId("label-roll")).toBe(true);
    expect(isProductTemplateId("puzzle")).toBe(true);
    expect(isProductTemplateId("keychain")).toBe(true);
    expect(isProductTemplateId("photo-plaque")).toBe(true);
    expect(isProductTemplateId("apron")).toBe(true);
    expect(isProductTemplateId("cap")).toBe(true);
    expect(isProductTemplateId("mousepad")).toBe(true);
    expect(isProductTemplateId("unknown")).toBe(false);
  });
});

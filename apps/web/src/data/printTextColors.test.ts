import { describe, expect, it } from "vitest";
import { defaultPrintTextColors, getPrintTextColorName, normalizePrintTextColors } from "./printTextColors";

describe("print text color options", () => {
  it("normalizes enabled hex colors and removes duplicates and invalid values", () => {
    expect(normalizePrintTextColors(["#D94E54", "#d94e54", "blue", null])).toEqual(["#d94e54"]);
  });

  it("provides safe defaults for missing or invalid saved options", () => {
    expect(normalizePrintTextColors(undefined)).toEqual(defaultPrintTextColors);
    expect(normalizePrintTextColors(["not-a-color"])).toEqual(defaultPrintTextColors);
  });

  it("labels configured preset colors and legacy custom colors", () => {
    expect(getPrintTextColorName("#263c5a")).toBe("Azul marino");
    expect(getPrintTextColorName("#123456")).toBe("Color personalizado");
  });
});

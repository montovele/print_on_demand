import { describe, expect, it } from "vitest";
import { validateArtworkFile } from "./artwork-validation.js";

describe("artwork image validation", () => {
  it("accepts a dimensioned PNG within print asset limits", () => {
    const png = Buffer.alloc(24);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
    png.write("IHDR", 12, "ascii");
    png.writeUInt32BE(2000, 16);
    png.writeUInt32BE(3000, 20);
    expect(validateArtworkFile(png, "image/png")).toEqual({ extension: "png", width: 2000, height: 3000 });
  });

  it("rejects mismatched media types and images with unsafe dimensions", () => {
    const png = Buffer.alloc(24);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
    png.write("IHDR", 12, "ascii");
    png.writeUInt32BE(20000, 16);
    png.writeUInt32BE(1000, 20);
    expect(validateArtworkFile(png, "image/jpeg")).toBeNull();
    expect(validateArtworkFile(png, "image/png")).toBeNull();
  });

  it("rejects empty and oversized files", () => {
    expect(validateArtworkFile(Buffer.alloc(0), "image/png")).toBeNull();
    expect(validateArtworkFile(Buffer.alloc(5 * 1024 * 1024 + 1), "image/png")).toBeNull();
  });
});

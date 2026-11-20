import { describe, expect, it } from "vitest";
import { getOrderArtworkAssetIds, getOrderArtworkSideUrls } from "./order-artwork.js";

describe("order artwork sides", () => {
  it("extracts valid artwork asset IDs and authenticated URLs per side", () => {
    const designConfig = {
      artworkSides: {
        front: "front-asset",
        back: "back-asset",
        other: "ignored",
      },
    };

    expect(getOrderArtworkAssetIds(designConfig)).toEqual({
      front: "front-asset",
      back: "back-asset",
    });
    expect(getOrderArtworkSideUrls(designConfig)).toEqual({
      front: "/designer/assets/front-asset",
      back: "/designer/assets/back-asset",
    });
  });

  it("ignores malformed or absent artwork data", () => {
    expect(getOrderArtworkAssetIds(null)).toEqual({});
    expect(getOrderArtworkAssetIds({ artworkSides: [] })).toEqual({});
    expect(getOrderArtworkSideUrls({ artworkSides: { front: 123 } })).toEqual({});
  });
});

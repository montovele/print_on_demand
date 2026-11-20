import type { Prisma } from "@prisma/client";

export function getOrderArtworkAssetIds(designConfig: Prisma.JsonValue | null) {
  if (!designConfig || typeof designConfig !== "object" || Array.isArray(designConfig)) return {};
  const rawSides = designConfig.artworkSides;
  if (!rawSides || typeof rawSides !== "object" || Array.isArray(rawSides)) return {};
  const front = typeof rawSides.front === "string" ? rawSides.front : undefined;
  const back = typeof rawSides.back === "string" ? rawSides.back : undefined;
  return {
    ...(front ? { front } : {}),
    ...(back ? { back } : {}),
  };
}

export function getOrderArtworkSideUrls(designConfig: Prisma.JsonValue | null) {
  const artworkIds = getOrderArtworkAssetIds(designConfig);
  return {
    ...(artworkIds.front ? { front: `/designer/assets/${artworkIds.front}` } : {}),
    ...(artworkIds.back ? { back: `/designer/assets/${artworkIds.back}` } : {}),
  };
}

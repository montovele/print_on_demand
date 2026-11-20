export const MAX_ARTWORK_BYTES = 5 * 1024 * 1024;
const maxImageDimension = 10000;
const maxImagePixels = 50_000_000;

export interface ValidatedArtwork {
  extension: "png" | "jpg" | "webp";
  width: number;
  height: number;
}

function jpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1]!;
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) return null;
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += segmentLength;
  }
  return null;
}

function webpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 25 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8 " && buffer.length >= 30 && buffer.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a]))) {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L" && buffer[20] === 0x2f && buffer.length >= 25) {
    const b1 = buffer[21]!;
    const b2 = buffer[22]!;
    const b3 = buffer[23]!;
    const b4 = buffer[24]!;
    return {
      width: 1 + ((b2 & 0x3f) << 8) + b1,
      height: 1 + ((b4 & 0x0f) << 10) + (b3 << 2) + ((b2 & 0xc0) >> 6),
    };
  }
  return null;
}

function hasSafeDimensions(dimensions: { width: number; height: number }): boolean {
  return dimensions.width > 0
    && dimensions.height > 0
    && dimensions.width <= maxImageDimension
    && dimensions.height <= maxImageDimension
    && dimensions.width * dimensions.height <= maxImagePixels;
}

export function validateArtworkFile(buffer: Buffer, contentType: string): ValidatedArtwork | null {
  if (buffer.length === 0 || buffer.length > MAX_ARTWORK_BYTES) return null;
  let validated: ValidatedArtwork | null = null;
  if (
    contentType === "image/png"
    && buffer.length >= 24
    && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && buffer.toString("ascii", 12, 16) === "IHDR"
  ) {
    const dimensions = { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    if (hasSafeDimensions(dimensions)) validated = { extension: "png", ...dimensions };
  }
  if (
    contentType === "image/jpeg"
    && buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff
  ) {
    const dimensions = jpegDimensions(buffer);
    if (dimensions && hasSafeDimensions(dimensions)) validated = { extension: "jpg", ...dimensions };
  }
  if (contentType === "image/webp") {
    const dimensions = webpDimensions(buffer);
    if (dimensions && hasSafeDimensions(dimensions)) validated = { extension: "webp", ...dimensions };
  }
  return validated;
}

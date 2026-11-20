import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express, { Router } from "express";
import { prisma } from "../../database.js";
import { asyncRoute, HttpError, pathParam, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { MAX_ARTWORK_BYTES, validateArtworkFile } from "./artwork-validation.js";
import { productTemplates } from "./templates.js";

const router = Router();
const artworkRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../uploads/artwork");

router.use(requireAuth, requireRole("owner", "admin", "editor", "viewer"));

router.get("/templates", (_req, res) => {
  res.json({ items: productTemplates });
});

router.put("/artwork", requireCsrf, requireRole("owner", "admin", "editor"), express.raw({
  type: ["image/png", "image/jpeg", "image/webp"],
  limit: MAX_ARTWORK_BYTES,
}), asyncRoute(async (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    throw new HttpError(415, "Formato no compatible. Sube una imagen PNG, JPG o WebP.", "UNSUPPORTED_ARTWORK_TYPE");
  }
  const contentType = req.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (!contentType) throw new HttpError(415, "Indica un tipo de imagen PNG, JPG o WebP.", "UNSUPPORTED_ARTWORK_TYPE");
  if (req.body.byteLength > MAX_ARTWORK_BYTES) {
    throw new HttpError(413, "La imagen debe pesar hasta 5 MB.", "ARTWORK_TOO_LARGE");
  }
  const image = validateArtworkFile(req.body, contentType);
  if (!image) throw new HttpError(415, "La imagen debe ser PNG, JPG o WebP válida, de hasta 10000 px por lado y 50 MP.", "INVALID_ARTWORK_FILE");

  const id = randomUUID();
  const storageKey = `${id}.${image.extension}`;
  await mkdir(artworkRoot, { recursive: true });
  const filePath = resolve(artworkRoot, storageKey);
  await writeFile(filePath, req.body, { flag: "wx" });
  try {
    await prisma.productArtworkAsset.create({
      data: {
        id,
        tenantId: res.locals.auth.tenantId,
        uploadedByUserId: res.locals.auth.userId,
        storageKey,
        mimeType: contentType,
        fileSize: req.body.byteLength,
      },
    });
  } catch (error) {
    await unlink(filePath);
    throw error;
  }
  res.status(201).json({
    id,
    url: `/designer/assets/${id}`,
    mimeType: contentType,
    fileSize: req.body.byteLength,
  });
}));

router.get("/assets/:id", asyncRoute(async (req, res) => {
  const asset = await prisma.productArtworkAsset.findFirst({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId },
  });
  if (!asset) throw new HttpError(404, "Archivo de diseño no encontrado.", "ARTWORK_NOT_FOUND");
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.type(asset.mimeType).send(await readFile(resolve(artworkRoot, asset.storageKey)));
}));

router.delete("/assets/:id", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const id = pathParam(req, "id");
  const asset = await prisma.productArtworkAsset.findFirst({
    where: { id, tenantId: res.locals.auth.tenantId },
    include: { product: { select: { id: true } } },
  });
  if (!asset) throw new HttpError(404, "Archivo de diseño no encontrado.", "ARTWORK_NOT_FOUND");
  if (asset.product) throw new HttpError(409, "No se puede eliminar una imagen que utiliza un producto.", "ARTWORK_IN_USE");
  await prisma.productArtworkAsset.delete({ where: { id: asset.id } });
  await unlink(resolve(artworkRoot, asset.storageKey));
  res.status(204).end();
}));

export default router;

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database.js";
import { verifyPrintfulToken } from "../../integrations/printful/client.js";
import { encryptSecret } from "../../lib/encryption.js";
import { asyncRoute, assertBody, HttpError, pathParam, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { getUpsConfigurationStatus } from "../storefront/ups.js";

const router = Router();
router.use(requireAuth, requireRole("owner", "admin", "editor", "viewer"));

router.get("/accounts", asyncRoute(async (_req, res) => {
  const accounts = await prisma.providerAccount.findMany({
    where: { tenantId: res.locals.auth.tenantId },
    select: { id: true, providerCode: true, displayName: true, connectionStatus: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json({ items: accounts });
}));

router.get("/ups/status", asyncRoute(async (_req, res) => {
  res.json(getUpsConfigurationStatus());
}));

router.post("/printful/connect", requireCsrf, requireRole("owner", "admin"), asyncRoute(async (req, res) => {
  const body = assertBody(z.object({ accessToken: z.string().trim().min(20).max(4096) }), req.body);
  const displayName = await verifyPrintfulToken(body.accessToken);
  const encryptedAccessToken = encryptSecret(body.accessToken);
  const account = await prisma.providerAccount.upsert({
    where: { tenantId_providerCode: { tenantId: res.locals.auth.tenantId, providerCode: "printful" } },
    update: { displayName, encryptedAccessToken, connectionStatus: "connected" },
    create: {
      tenantId: res.locals.auth.tenantId,
      providerCode: "printful",
      displayName,
      encryptedAccessToken,
      connectionStatus: "connected",
    },
    select: { id: true, providerCode: true, displayName: true, connectionStatus: true },
  });
  res.status(201).json(account);
}));

router.delete("/accounts/:id", requireCsrf, requireRole("owner", "admin"), asyncRoute(async (req, res) => {
  const deleted = await prisma.providerAccount.deleteMany({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId },
  });
  if (deleted.count === 0) throw new HttpError(404, "Conexión de proveedor no encontrada.", "PROVIDER_ACCOUNT_NOT_FOUND");
  res.status(204).end();
}));

export default router;

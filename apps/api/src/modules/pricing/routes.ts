import { Router } from "express";
import { z } from "zod";
import { asyncRoute, assertBody, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { calculateGrossMargin, calculateSuggestedPrice } from "./calculate-price.js";

const router = Router();
router.use(requireAuth, requireRole("owner", "admin", "editor", "viewer"));

router.post("/suggestion", requireCsrf, asyncRoute(async (req, res) => {
  const body = assertBody(z.object({
    totalCost: z.number().finite().min(0).max(999999999),
    desiredMargin: z.number().finite().min(0).max(0.99),
  }), req.body);
  const suggestedPrice = calculateSuggestedPrice(body.totalCost, body.desiredMargin);
  res.json({
    totalCost: body.totalCost,
    desiredMargin: body.desiredMargin,
    suggestedPrice,
    grossMargin: calculateGrossMargin(suggestedPrice, body.totalCost),
  });
}));

export default router;

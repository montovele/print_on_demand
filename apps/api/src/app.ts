import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { prisma } from "./database.js";
import { HttpError } from "./lib/http.js";
import authRoutes from "./modules/auth/routes.js";
import catalogRoutes from "./modules/catalog/routes.js";
import orderRoutes from "./modules/orders/routes.js";
import pricingRoutes from "./modules/pricing/routes.js";
import productionRoutes from "./modules/production/routes.js";
import productRoutes from "./modules/products/routes.js";
import providerRoutes from "./modules/providers/routes.js";
import designerRoutes from "./modules/designer/routes.js";
import supportRoutes from "./modules/support/routes.js";
import paymentRoutes from "./modules/payments/routes.js";
import storefrontRoutes from "./modules/storefront/routes.js";

const app = express();
const api = express.Router();

app.disable("x-powered-by");
app.use(helmet());
app.use((_req, res, next) => {
  res.locals.requestId = randomUUID();
  res.setHeader("X-Request-ID", res.locals.requestId);
  next();
});
app.use(cors({
  origin: config.WEB_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token"],
}));
app.use("/api/v1/payments/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

api.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
api.use("/auth", authLimiter, authRoutes);
api.use("/catalog", catalogRoutes);
api.use("/providers", providerRoutes);
api.use("/products", productRoutes);
api.use("/orders", orderRoutes);
api.use("/pricing", pricingRoutes);
api.use("/production", productionRoutes);
api.use("/designer", designerRoutes);
api.use("/support", supportRoutes);
api.use("/payments", paymentRoutes);
api.use("/storefront", storefrontRoutes);
app.use("/api/v1", api);

app.use((_req, _res, next) => {
  next(new HttpError(404, "La ruta solicitada no existe.", "ROUTE_NOT_FOUND"));
});

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({ error: { code: "DUPLICATE_RESOURCE", message: "El recurso ya existe." } });
    return;
  }
  if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.too.large") {
    res.status(413).json({ error: { code: "REQUEST_BODY_TOO_LARGE", message: "El archivo supera el límite permitido de 5 MB." } });
    return;
  }
  const errorType = error instanceof Error ? error.name : "UnknownError";
  console.error(JSON.stringify({ event: "api.unhandled_error", requestId: res.locals.requestId, errorType }));
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Ocurrió un error inesperado.",
      requestId: res.locals.requestId,
    },
  });
};
app.use(errorHandler);

export { app };

import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env") });

const optionalConfigText = (maxLength: number) => z.preprocess(
  (value) => typeof value === "string" && !value.trim() ? undefined : value,
  z.string().trim().min(1).max(maxLength).optional(),
);

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4099),
  WEB_ORIGIN: z.string().url().default("http://localhost:5177"),
  DATABASE_URL: z.string().min(1).optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().max(90).default(14),
  COOKIE_SECURE: z.string().default("false"),
  ENCRYPTION_KEY: z.string().optional(),
  PRINTFUL_API_BASE_URL: z.string().url().default("https://api.printful.com"),
  PRINTFUL_ACCESS_TOKEN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STOREFRONT_TENANT_ID: z.preprocess(
    (value) => typeof value === "string" && !value.trim() ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
  UPS_CLIENT_ID: z.string().optional(),
  UPS_CLIENT_SECRET: z.string().optional(),
  UPS_ACCOUNT_NUMBER: z.string().optional(),
  UPS_API_BASE_URL: z.string().url().default("https://onlinetools.ups.com"),
  UPS_SHIP_FROM_POSTAL_CODE: z.preprocess(
    (value) => typeof value === "string" && !value.trim() ? undefined : value,
    z.string().regex(/^\d{5}$/).optional(),
  ),
  UPS_SHIP_FROM_COUNTRY_CODE: z.string().length(2).default("MX"),
  UPS_SHIP_FROM_NAME: optionalConfigText(160),
  UPS_SHIP_FROM_PHONE: optionalConfigText(30),
  UPS_SHIP_FROM_ADDRESS_LINE1: optionalConfigText(191),
  UPS_SHIP_FROM_ADDRESS_LINE2: optionalConfigText(191),
  UPS_SHIP_FROM_CITY: optionalConfigText(120),
  UPS_SHIP_FROM_STATE: optionalConfigText(120),
  UPS_PACKAGE_LENGTH_CM: z.coerce.number().positive().max(999).default(30),
  UPS_PACKAGE_WIDTH_CM: z.coerce.number().positive().max(999).default(20),
  UPS_PACKAGE_HEIGHT_CM: z.coerce.number().positive().max(999).default(5),
  UPS_PACKAGE_WEIGHT_KG: z.coerce.number().positive().max(999).default(0.5),
});

const parsed = configSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}
if (!parsed.data.DATABASE_URL && parsed.data.NODE_ENV !== "test") {
  throw new Error("DATABASE_URL no está configurada. Crea el archivo .env desde .env.example y configura la conexión MySQL.");
}

export const config = {
  ...parsed.data,
  cookieSecure: parsed.data.COOKIE_SECURE === "true",
};

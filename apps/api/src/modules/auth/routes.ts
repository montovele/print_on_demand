import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { config } from "../../config.js";
import { prisma } from "../../database.js";
import { asyncRoute, assertBody, HttpError, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireCustomerAuth } from "../../middleware/auth.js";

const router = Router();
const cookieName = "pod_session";
const customerCookieName = "pod_customer_session";
const credentialsSchema = z.object({
  email: z.string().email().max(191),
  password: z.string().min(8).max(128),
});
const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(160),
  storeName: z.string().trim().min(2).max(160),
});
const customerRegisterSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(160) });
function cookieOptions() {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

async function createSession(userId: string, tenantId: string | null) {
  const rawToken = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.authSession.create({
    data: {
      userId,
      tenantId,
      tokenHash: createHash("sha256").update(rawToken).digest("hex"),
      csrfToken,
      expiresAt,
    },
  });
  return { rawToken, csrfToken, session };
}

router.post("/customer/register", asyncRoute(async (req, res) => {
  const body = assertBody(customerRegisterSchema, req.body);
  const email = body.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(body.password, 12);

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { email, name: body.name, passwordHash },
      });
      await transaction.customerAccount.create({
        data: { userId: user.id },
      });
      return user;
    });
    const authSession = await createSession(result.id, null);
    res.cookie(customerCookieName, authSession.rawToken, cookieOptions());
    res.status(201).json({
      user: { id: result.id, name: result.name, email: result.email },
      csrfToken: authSession.csrfToken,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "Ya existe una cuenta con ese correo.", "EMAIL_ALREADY_EXISTS");
    }
    throw error;
  }
}));

router.post("/customer/login", asyncRoute(async (req, res) => {
  const body = assertBody(credentialsSchema, req.body);
  const user = await prisma.user.findUnique({
    where: { email: body.email.trim().toLowerCase() },
    include: { customerAccount: true },
  });
  if (!user?.customerAccount || !(await bcrypt.compare(body.password, user.passwordHash))) {
    throw new HttpError(401, "Correo o contraseña incorrectos.", "INVALID_CUSTOMER_CREDENTIALS");
  }
  const authSession = await createSession(user.id, null);
  res.cookie(customerCookieName, authSession.rawToken, cookieOptions());
  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    csrfToken: authSession.csrfToken,
  });
}));

router.get("/customer/me", requireCustomerAuth, asyncRoute(async (_req, res) => {
  const auth = res.locals.auth;
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, customerAccount: { select: { id: true } } },
  });
  if (!user?.customerAccount) throw new HttpError(401, "La sesión ya no es válida.", "SESSION_INVALID");
  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    csrfToken: auth.csrfToken,
  });
}));

router.post("/customer/logout", requireCustomerAuth, requireCsrf, asyncRoute(async (_req, res) => {
  await prisma.authSession.delete({ where: { id: res.locals.auth.sessionId } });
  res.clearCookie(customerCookieName, { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
}));

router.post("/register", asyncRoute(async (req, res) => {
  const body = assertBody(registerSchema, req.body);
  const activeTenantCount = await prisma.tenant.count({ where: { status: "active" } });
  if (activeTenantCount > 0) {
    throw new HttpError(403, "El registro administrativo está cerrado. Inicia sesión con una cuenta del equipo.", "STAFF_REGISTRATION_DISABLED");
  }
  const email = body.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(body.password, 12);
  const normalized = body.storeName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const baseSlug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 130) || "store";
  const slug = `${baseSlug}-${randomBytes(3).toString("hex")}`;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { email, name: body.name, passwordHash },
      });
      const tenant = await transaction.tenant.create({
        data: {
          name: body.storeName,
          slug,
        },
      });
      await transaction.tenantMembership.create({
        data: { userId: user.id, tenantId: tenant.id, role: "owner" },
      });
      return { user, tenant };
    });
    const authSession = await createSession(result.user.id, result.tenant.id);
    res.cookie(cookieName, authSession.rawToken, cookieOptions());
    res.status(201).json({
      user: { id: result.user.id, name: result.user.name, email: result.user.email },
      tenant: { id: result.tenant.id, name: result.tenant.name, role: "owner" },
      csrfToken: authSession.csrfToken,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "Ya existe una cuenta con ese correo.", "EMAIL_ALREADY_EXISTS");
    }
    throw error;
  }
}));

router.post("/login", asyncRoute(async (req, res) => {
  const body = assertBody(credentialsSchema, req.body);
  const user = await prisma.user.findUnique({
    where: { email: body.email.trim().toLowerCase() },
    include: {
      memberships: {
        where: { tenant: { status: "active" } },
        orderBy: { createdAt: "asc" },
        include: { tenant: true },
      },
    },
  });

  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    throw new HttpError(401, "Correo o contraseña incorrectos.", "INVALID_CREDENTIALS");
  }
  const membership = user.memberships.find((item) => item.role !== "customer");
  if (!membership) throw new HttpError(403, "La cuenta no tiene acceso administrativo.", "NO_ADMIN_ACCESS");
  const authSession = await createSession(user.id, membership.tenantId);
  res.cookie(cookieName, authSession.rawToken, cookieOptions());
  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    tenant: { id: membership.tenant.id, name: membership.tenant.name, role: membership.role },
    csrfToken: authSession.csrfToken,
  });
}));

router.get("/me", requireAuth, asyncRoute(async (_req, res) => {
  const auth = res.locals.auth;
  const [user, tenantMembership] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.userId }, select: { id: true, name: true, email: true } }),
    prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: auth.userId, tenantId: auth.tenantId } },
      include: { tenant: { select: { id: true, name: true } } },
    }),
  ]);
  if (!user || !tenantMembership) throw new HttpError(401, "La sesión ya no es válida.", "SESSION_INVALID");
  res.json({
    user,
    tenant: { ...tenantMembership.tenant, role: tenantMembership.role },
    csrfToken: auth.csrfToken,
  });
}));

router.post("/logout", requireAuth, requireCsrf, asyncRoute(async (_req, res) => {
  await prisma.authSession.delete({ where: { id: res.locals.auth.sessionId } });
  res.clearCookie(cookieName, { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
}));

export default router;

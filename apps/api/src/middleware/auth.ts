import { createHash } from "node:crypto";
import type { MemberRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { prisma } from "../database.js";
import { HttpError } from "../lib/http.js";

function authenticate(allowCustomer: boolean, cookieName = "pod_session"): RequestHandler {
  return async (req, res, next) => {
    try {
      const rawToken = req.cookies?.[cookieName];
      if (typeof rawToken !== "string" || rawToken.length < 32) {
        throw new HttpError(401, "Inicia sesión para continuar.", "UNAUTHENTICATED");
      }

      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const session = await prisma.authSession.findUnique({
        where: { tokenHash },
        include: { tenant: { select: { status: true } } },
      });

      if (!session || session.expiresAt <= new Date()) {
        if (session) await prisma.authSession.delete({ where: { id: session.id } });
        throw new HttpError(401, "La sesión expiró. Inicia sesión nuevamente.", "SESSION_EXPIRED");
      }
      if (session.tenant && session.tenant.status !== "active") {
        throw new HttpError(403, "La cuenta comercial está suspendida.", "TENANT_SUSPENDED");
      }

      let role: MemberRole;
      if (allowCustomer) {
        const customerAccount = await prisma.customerAccount.findUnique({ where: { userId: session.userId } });
        if (!customerAccount) {
          throw new HttpError(403, "Esta ruta es solo para cuentas de clientes.", "CUSTOMER_ACCOUNT_REQUIRED");
        }
        role = "customer";
      } else {
        if (!session.tenantId) {
          throw new HttpError(403, "Esta sesión no tiene acceso administrativo.", "CUSTOMER_ACCESS_DISABLED");
        }
        const membership = await prisma.tenantMembership.findUnique({
          where: { userId_tenantId: { userId: session.userId, tenantId: session.tenantId } },
        });
        if (!membership) {
          throw new HttpError(403, "No tienes acceso a esta cuenta comercial.", "TENANT_ACCESS_DENIED");
        }
        if (membership.role === "customer") {
          throw new HttpError(403, "El acceso de usuarios finales no está disponible.", "CUSTOMER_ACCESS_DISABLED");
        }
        role = membership.role;
      }

      res.locals.auth = {
        userId: session.userId,
        tenantId: session.tenantId ?? "",
        sessionId: session.id,
        csrfToken: session.csrfToken,
        role,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requireAuth = authenticate(false);
export const requireCustomerAuth = authenticate(true, "pod_customer_session");

export function requireRole(...roles: MemberRole[]): RequestHandler {
  return (_req, res, next) => {
    if (!roles.includes(res.locals.auth.role)) {
      next(new HttpError(403, "No tienes permisos para realizar esta acción.", "FORBIDDEN"));
      return;
    }
    next();
  };
}

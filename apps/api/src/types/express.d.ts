import type { MemberRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Locals {
      requestId: string;
      auth: {
        userId: string;
        tenantId: string;
        sessionId: string;
        csrfToken: string;
        role: MemberRole;
      };
    }
  }
}

export {};

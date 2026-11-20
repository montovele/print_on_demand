import type { RequestHandler } from "express";
import type { Request } from "express";
import { timingSafeEqual } from "node:crypto";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function asyncRoute(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export const requireCsrf: RequestHandler = (req, _res, next) => {
  const expected = _res.locals.auth?.csrfToken;
  const supplied = req.get("x-csrf-token");
  if (!expected || !supplied) {
    next(new HttpError(403, "La solicitud requiere un token CSRF válido.", "CSRF_INVALID"));
    return;
  }
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    next(new HttpError(403, "La solicitud requiere un token CSRF válido.", "CSRF_INVALID"));
    return;
  }
  next();
};

export function assertBody<T>(schema: { parse: (value: unknown) => T }, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : "Solicitud inválida.", "VALIDATION_ERROR");
  }
}

export function pathParam(req: Request, key: string): string {
  const value = req.params[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "Parámetro de ruta inválido.", "INVALID_PATH_PARAMETER");
  }
  return value;
}

import { config } from "../../config.js";
import { HttpError } from "../../lib/http.js";

export async function printfulRequest<T>(path: string, accessToken: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${config.PRINTFUL_API_BASE_URL.replace(/\/+$/, "")}${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new HttpError(502, "No fue posible comunicarse con Printful. Intenta nuevamente.", "PROVIDER_UNAVAILABLE");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new HttpError(422, "Printful rechazó la credencial o sus permisos.", "PROVIDER_CREDENTIAL_REJECTED");
    }
    if (response.status === 429) {
      throw new HttpError(429, "Printful limitó temporalmente las solicitudes. Intenta más tarde.", "PROVIDER_RATE_LIMIT");
    }
    throw new HttpError(502, `Printful respondió con un error (${response.status}).`, "PROVIDER_REQUEST_FAILED");
  }
  return payload as T;
}

export async function verifyPrintfulToken(accessToken: string): Promise<string> {
  const result = await printfulRequest<{
    result?: Array<{ id?: number | string; name?: string }>;
  }>("/stores", accessToken);
  const store = Array.isArray(result.result) ? result.result[0] : undefined;
  if (!store) {
    throw new HttpError(422, "La credencial no está vinculada a una tienda Printful accesible.", "PROVIDER_STORE_NOT_FOUND");
  }
  return store.name?.trim() || `Printful ${String(store.id ?? "")}`.trim();
}

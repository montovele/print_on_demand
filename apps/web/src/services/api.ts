import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4099/api/v1",
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let csrfToken: string | null = null;
export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

api.interceptors.request.use((request) => {
  if (request.method && !["get", "head", "options"].includes(request.method.toLowerCase()) && csrfToken) {
    request.headers.set("X-CSRF-Token", csrfToken);
  }
  return request;
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "El servidor tardó demasiado en responder. Comprueba que el backend y MySQL estén disponibles e inténtalo de nuevo.";
    }
    return error.response?.data.error?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export default api;

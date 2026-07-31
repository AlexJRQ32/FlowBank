import { auth } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Solicitud invalida. Revisa los datos e intenta de nuevo.",
  401: "Tu sesion expiro. Inicia sesion nuevamente.",
  403: "No tienes permiso para realizar esta accion.",
  404: "El recurso solicitado no existe.",
  500: "Error interno del servidor. Intenta de nuevo mas tarde.",
};

async function parseError(response: Response): Promise<ApiError> {
  let serverMessage: string | null = null;
  try {
    const data = (await response.json()) as { message?: string };
    serverMessage = data.message ?? null;
  } catch {
    serverMessage = null;
  }

  const message = serverMessage ?? STATUS_MESSAGES[response.status] ?? `Error ${response.status}`;
  return new ApiError(message, response.status);
}

function getHeaders(includeJson = true): Record<string, string> {
  const token = auth.getToken();
  const headers: Record<string, string> = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { headers: getHeaders() }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE", headers: getHeaders() }),

  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, {
      method: "POST",
      headers: getHeaders(false),
      body: formData,
    }),
};

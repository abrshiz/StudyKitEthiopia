import { getUser } from "@/lib/session";

/**
 * HTTP client for your database API.
 * Set VITE_API_URL in .env (e.g. http://localhost:4000/api).
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  return typeof url === "string" ? url.trim().replace(/\/$/, "") : "";
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiError(0, "API_NOT_CONFIGURED");
  }

  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const user = getUser();
  if (user?.email) {
    headers.set("X-User-Email", user.email);
  }

  const response = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const json = (await response.json()) as { message?: string; error?: string };
      message = json.message ?? json.error ?? message;
    } catch {
      try {
        message = await response.text();
      } catch {
        /* keep statusText */
      }
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

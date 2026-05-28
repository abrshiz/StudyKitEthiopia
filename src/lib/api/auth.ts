import { apiFetch, getApiBaseUrl, isApiConfigured } from "./client";
import type { StoredDepartment, StoredSubscription, StoredUser } from "@/lib/session";

export type AuthUser = StoredUser & {
  department?: StoredDepartment;
  subscription?: StoredSubscription;
};

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

export async function loginWithApi(payload: LoginPayload): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerWithApi(payload: RegisterPayload): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutFromApi(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export async function saveDepartmentToApi(departmentId: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/department", {
    method: "PATCH",
    body: JSON.stringify({ departmentId }),
  });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}

export async function checkMicrosoftStatus(): Promise<{ configured: boolean }> {
  return apiFetch<{ configured: boolean }>("/auth/microsoft/status");
}

/** Full-page redirect to the Microsoft authorize URL on the server. */
export function microsoftSignInUrl(): string {
  const base = getApiBaseUrl();
  return `${base}/auth/microsoft`;
}

export function canUseLocalSessionOnly(): boolean {
  return !isApiConfigured();
}

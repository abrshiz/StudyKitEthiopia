import { apiFetch, isApiConfigured } from "./client";
import type { StoredDepartment, StoredUser } from "@/lib/session";

export type AuthUser = StoredUser & {
  department?: StoredDepartment;
};

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

/** When API is live, credentials are verified server-side. No JWT stored in the client. */
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

export async function saveDepartmentToApi(departmentId: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/department", {
    method: "PATCH",
    body: JSON.stringify({ departmentId }),
  });
}

/** Refresh role & approval from MongoDB (fixes stale sessionStorage). */
export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}

export function canUseLocalSessionOnly(): boolean {
  return !isApiConfigured();
}

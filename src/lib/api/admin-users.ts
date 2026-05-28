import { apiFetch } from "./client";

export type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "professor" | "admin";
  roleLabel: string;
  university: string;
  requestedAt: string;
};

export async function fetchPendingUsers(): Promise<PendingUser[]> {
  return apiFetch<PendingUser[]>("/admin/pending-users");
}

export async function approveUserApi(userId: string): Promise<void> {
  await apiFetch(`/admin/users/${userId}/approve`, { method: "PATCH" });
}

export async function rejectUserApi(userId: string): Promise<void> {
  await apiFetch(`/admin/users/${userId}/reject`, { method: "PATCH" });
}

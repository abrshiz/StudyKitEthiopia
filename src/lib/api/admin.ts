import { apiFetch } from "./client";
import type { AdminAnalytics, AdminDashboard } from "@/lib/types";

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  return apiFetch<AdminDashboard>("/admin/dashboard");
}

export async function fetchAdminAnalytics(days = 30): Promise<AdminAnalytics> {
  return apiFetch<AdminAnalytics>(`/admin/analytics?days=${days}`);
}

export type BroadcastInput = {
  subject: string;
  body: string;
  audience: { role?: "student" | "professor" | "admin" | "all"; departmentId?: string };
  channels: { email: boolean; inApp: boolean };
};

export async function broadcastNotification(input: BroadcastInput): Promise<{
  recipients: number;
  inAppSent: number;
  emailSent: number;
  emailFailed: number;
}> {
  return apiFetch("/admin/broadcast", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function promoteUserToProfessor(userId: string, departmentId: string): Promise<{
  id: string;
  email: string;
  role: string;
  professorDepartmentId: string;
}> {
  return apiFetch(`/admin/users/${userId}/promote-professor`, {
    method: "PATCH",
    body: JSON.stringify({ departmentId }),
  });
}

import { apiFetch } from "./client";
import type { AdminDashboard } from "@/lib/types";

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  return apiFetch<AdminDashboard>("/admin/dashboard");
}

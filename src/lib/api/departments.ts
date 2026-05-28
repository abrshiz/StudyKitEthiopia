import { apiFetch } from "./client";
import type { Department } from "@/lib/types";

export async function fetchDepartments(params: {
  q?: string;
  college?: string;
}): Promise<Department[]> {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.college && params.college !== "All") search.set("college", params.college);
  const qs = search.toString();
  return apiFetch<Department[]>(`/departments${qs ? `?${qs}` : ""}`);
}

export async function fetchDepartment(id: string): Promise<Department> {
  return apiFetch<Department>(`/departments/${id}`);
}

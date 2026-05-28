import { apiFetch } from "./client";
import type { Course } from "@/lib/types";

export async function fetchCourses(params?: {
  departmentId?: string;
  q?: string;
  active?: boolean;
}): Promise<Course[]> {
  const search = new URLSearchParams();
  if (params?.departmentId) search.set("departmentId", params.departmentId);
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (typeof params?.active === "boolean") search.set("active", String(params.active));
  const qs = search.toString();
  return apiFetch<Course[]>(`/courses${qs ? `?${qs}` : ""}`);
}

export async function createCourse(input: {
  departmentId: string;
  code: string;
  title: string;
  year?: number;
  semester?: string;
  credits?: number;
  active?: boolean;
}): Promise<Course> {
  return apiFetch<Course>("/courses", { method: "POST", body: JSON.stringify(input) });
}

export async function updateCourse(
  id: string,
  input: Partial<{
    code: string;
    title: string;
    year: number;
    semester: string;
    credits: number;
    active: boolean;
  }>,
): Promise<Course> {
  return apiFetch<Course>(`/courses/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteCourse(id: string): Promise<void> {
  await apiFetch(`/courses/${id}`, { method: "DELETE" });
}

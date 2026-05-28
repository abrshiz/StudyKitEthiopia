import { apiFetch } from "./client";
import type { StudyMaterial } from "@/lib/types";

export async function fetchMaterials(params?: {
  q?: string;
  year?: string;
  departmentId?: string;
}): Promise<StudyMaterial[]> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.year && params.year !== "all") search.set("year", params.year);
  if (params?.departmentId) search.set("departmentId", params.departmentId);
  const qs = search.toString();
  return apiFetch<StudyMaterial[]>(`/materials${qs ? `?${qs}` : ""}`);
}

export async function fetchMaterial(id: string): Promise<StudyMaterial> {
  return apiFetch<StudyMaterial>(`/materials/${id}`);
}

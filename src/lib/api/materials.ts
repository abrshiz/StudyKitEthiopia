import { apiFetch, getApiBaseUrl } from "./client";
import type { StudyMaterial } from "@/lib/types";

export async function fetchMaterials(params?: {
  q?: string;
  year?: string;
  departmentId?: string;
  uploadedById?: string;
}): Promise<StudyMaterial[]> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.year && params.year !== "all") search.set("year", params.year);
  if (params?.departmentId) search.set("departmentId", params.departmentId);
  if (params?.uploadedById) search.set("uploadedById", params.uploadedById);
  const qs = search.toString();
  return apiFetch<StudyMaterial[]>(`/materials${qs ? `?${qs}` : ""}`);
}

export async function fetchMaterial(id: string): Promise<StudyMaterial> {
  return apiFetch<StudyMaterial>(`/materials/${id}`);
}

export type UploadMaterialInput = {
  title: string;
  course: string;
  courseCode: string;
  semester: string;
  departmentId: string;
  file: File;
};

export async function uploadMaterial(
  input: UploadMaterialInput,
): Promise<{ material: StudyMaterial; indexedChunks: number }> {
  const form = new FormData();
  form.append("title", input.title);
  form.append("course", input.course);
  form.append("courseCode", input.courseCode);
  form.append("semester", input.semester);
  form.append("departmentId", input.departmentId);
  form.append("file", input.file);
  return apiFetch<{ material: StudyMaterial; indexedChunks: number }>("/materials", {
    method: "POST",
    body: form,
  });
}

export async function deleteMaterial(id: string): Promise<void> {
  await apiFetch<void>(`/materials/${id}`, { method: "DELETE" });
}

/**
 * Triggers the browser to download the watermarked PDF via the secured
 * `/download/:id` endpoint. The server adds the per-user watermark and
 * returns a real binary stream — never the raw stored file.
 */
export async function downloadMaterial(materialId: string, filenameHint?: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/download/${materialId}`, { credentials: "include" });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const json = await res.json();
      msg = json.message ?? msg;
    } catch {
      /* keep statusText */
    }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    (filenameHint ? filenameHint.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() : "material") + ".pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

import { apiFetch, getApiBaseUrl } from "./client";

export type StudyKitRecord = {
  id: string;
  title: string;
  description: string;
  sourceType: "pdf" | "text" | "youtube" | "topic";
  language: string;
  isPublic: boolean;
  sharedDepartmentId: string | null;
  originalKitId: string | null;
  flashcardCount: number;
  quizQuestionCount: number;
  hasSummary: boolean;
  hasGuide: boolean;
  forkCount: number;
  sourceMeta: Record<string, unknown>;
  ownerName?: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchStudyKits(opts?: { public?: boolean; q?: string }) {
  const search = new URLSearchParams();
  if (opts?.public) search.set("public", "true");
  if (opts?.q?.trim()) search.set("q", opts.q.trim());
  const qs = search.toString();
  return apiFetch<StudyKitRecord[]>(`/study-kits${qs ? `?${qs}` : ""}`);
}

export async function fetchStudyKit(id: string) {
  return apiFetch<StudyKitRecord>(`/study-kits/${id}`);
}

export async function createStudyKitJson(body: {
  sourceType: "text" | "youtube" | "topic";
  title: string;
  text?: string;
  url?: string;
  topic?: string;
  description?: string;
  language?: string;
  isPublic?: boolean;
}) {
  return apiFetch<StudyKitRecord>("/study-kits", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createStudyKitPdf(form: FormData) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/study-kits`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Upload failed");
  }
  return res.json() as Promise<StudyKitRecord>;
}

export async function updateStudyKit(
  id: string,
  patch: { title?: string; description?: string; isPublic?: boolean },
) {
  return apiFetch<StudyKitRecord>(`/study-kits/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteStudyKit(id: string) {
  await apiFetch<void>(`/study-kits/${id}`, { method: "DELETE" });
}

export async function forkStudyKit(id: string) {
  return apiFetch<StudyKitRecord>(`/study-kits/${id}/fork`, { method: "POST" });
}

export async function generateFlashcards(kitId: string, count = 20) {
  return apiFetch<{ created: number; ids: string[] }>(`/study-kits/${kitId}/flashcards/generate`, {
    method: "POST",
    body: JSON.stringify({ count }),
  });
}

export async function generateQuiz(kitId: string, count = 10, difficulty = "medium") {
  return apiFetch<{ created: number; ids: string[] }>(`/study-kits/${kitId}/quizzes/generate`, {
    method: "POST",
    body: JSON.stringify({ count, difficulty }),
  });
}

export async function generateTest(kitId: string, count = 20) {
  return apiFetch<{ created: number; ids: string[] }>(`/study-kits/${kitId}/test/generate`, {
    method: "POST",
    body: JSON.stringify({ count }),
  });
}

export async function generateSummary(kitId: string) {
  return apiFetch<{ content: string; id: string }>(`/study-kits/${kitId}/summary/generate`, {
    method: "POST",
  });
}

export async function generateGuide(kitId: string) {
  return apiFetch<{ content: string; id: string }>(`/study-kits/${kitId}/guide/generate`, {
    method: "POST",
  });
}

export async function fetchSummary(kitId: string) {
  return apiFetch<{ id: string; content: string; language: string }>(`/study-kits/${kitId}/summary`);
}

export async function fetchGuide(kitId: string) {
  return apiFetch<{ id: string; content: string; language: string }>(`/study-kits/${kitId}/guide`);
}

export async function downloadGuidePdf(kitId: string, title: string) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/study-kits/${kitId}/guide/export`, { credentials: "include" });
  if (!res.ok) throw new Error("Could not export PDF");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}-guide.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

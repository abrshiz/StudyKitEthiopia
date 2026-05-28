import { apiFetch } from "./client";

export type FlashcardRecord = {
  id: string;
  front: string;
  back: string;
  dueAt?: string;
  easeFactor?: number;
  intervalDays?: number;
  reps?: number;
  lapses?: number;
};

export async function fetchFlashcards(kitId: string) {
  return apiFetch<FlashcardRecord[]>(`/study-kits/${kitId}/flashcards`);
}

export async function fetchDueFlashcards(kitId: string) {
  return apiFetch<{ count: number; cards: Array<{ id: string; front: string; back: string }> }>(
    `/study-kits/${kitId}/flashcards/due`,
  );
}

export async function reviewFlashcard(kitId: string, cardId: string, grade: number) {
  return apiFetch<{ id: string; dueAt: string; intervalDays: number; reps: number }>(
    `/study-kits/${kitId}/flashcards/${cardId}/review`,
    { method: "POST", body: JSON.stringify({ grade }) },
  );
}

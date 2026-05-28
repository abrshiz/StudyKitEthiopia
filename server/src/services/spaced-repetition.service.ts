import type { FlashcardDocument } from "../models/Flashcard.js";

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SM-2 spaced repetition update. Mutates the card fields in-place and returns
 * the same object for convenience.
 */
export function applyReview(
  card: Pick<
    FlashcardDocument,
    "easeFactor" | "intervalDays" | "reps" | "lapses" | "dueAt" | "lastReviewedAt"
  >,
  grade: ReviewGrade,
) {
  if (grade < 3) {
    card.reps = 0;
    card.intervalDays = 1;
    card.lapses = (card.lapses ?? 0) + 1;
  } else {
    if (card.reps === 0) card.intervalDays = 1;
    else if (card.reps === 1) card.intervalDays = 6;
    else card.intervalDays = Math.round(card.intervalDays * card.easeFactor);
    card.reps = (card.reps ?? 0) + 1;
  }

  card.easeFactor = Math.max(
    1.3,
    card.easeFactor +
      (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)),
  );

  card.lastReviewedAt = new Date();
  card.dueAt = new Date(Date.now() + card.intervalDays * 86_400_000);
  return card;
}

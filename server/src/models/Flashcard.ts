import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/**
 * Flashcard backed by an SM-2 review schedule.
 *
 *   easeFactor — multiplier applied to the interval, default 2.5, clamped to >=1.3
 *   intervalDays — distance in days to the next review (after a successful grade)
 *   reps — consecutive successful reviews (resets to 0 on a fail)
 *   lapses — count of times the card has been failed
 *   dueAt — next review date
 */
const flashcardSchema = new Schema(
  {
    studyKitId: {
      type: Schema.Types.ObjectId,
      ref: "StudyKit",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
    dueAt: { type: Date, default: () => new Date(), index: true },
    easeFactor: { type: Number, default: 2.5, min: 1.3 },
    intervalDays: { type: Number, default: 0, min: 0 },
    reps: { type: Number, default: 0, min: 0 },
    lapses: { type: Number, default: 0, min: 0 },
    lastReviewedAt: { type: Date, default: null },
    /** Optional cheap hint to keep the deck stable on regeneration. */
    sourceChunkId: { type: Schema.Types.ObjectId, ref: "AiContext", default: null },
  },
  { timestamps: true },
);

flashcardSchema.index({ studyKitId: 1, dueAt: 1 });
flashcardSchema.index({ userId: 1, dueAt: 1 });

export type FlashcardDocument = InferSchemaType<typeof flashcardSchema> & {
  _id: Types.ObjectId;
};

export const Flashcard = model("Flashcard", flashcardSchema);

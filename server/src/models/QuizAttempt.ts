import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const QUIZ_ATTEMPT_MODES = ["smart-study", "practice-test"] as const;
export type QuizAttemptMode = (typeof QUIZ_ATTEMPT_MODES)[number];

const perQuestionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "QuizQuestion",
      required: true,
    },
    response: { type: String, default: "" },
    correct: { type: Boolean, required: true },
    durationMs: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studyKitId: {
      type: Schema.Types.ObjectId,
      ref: "StudyKit",
      required: true,
      index: true,
    },
    mode: { type: String, enum: QUIZ_ATTEMPT_MODES, required: true },
    perQuestion: { type: [perQuestionSchema], default: [] },
    score: { type: Number, required: true, min: 0, max: 100 },
    correctCount: { type: Number, default: 0, min: 0 },
    questionCount: { type: Number, default: 0, min: 0 },
    durationSec: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ userId: 1, completedAt: -1 });

export type QuizAttemptDocument = InferSchemaType<typeof quizAttemptSchema> & {
  _id: Types.ObjectId;
};

export const QuizAttempt = model("QuizAttempt", quizAttemptSchema);

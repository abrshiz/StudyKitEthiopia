import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const QUIZ_QUESTION_TYPES = ["mc", "short", "tf"] as const;
export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export const QUIZ_QUESTION_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type QuizQuestionDifficulty = (typeof QUIZ_QUESTION_DIFFICULTIES)[number];

const quizQuestionSchema = new Schema(
  {
    studyKitId: {
      type: Schema.Types.ObjectId,
      ref: "StudyKit",
      required: true,
      index: true,
    },
    type: { type: String, enum: QUIZ_QUESTION_TYPES, required: true },
    prompt: { type: String, required: true, trim: true },
    /** Only used for `mc` and `tf` (tf collapses to ["True","False"]). */
    choices: { type: [String], default: [] },
    answer: { type: String, required: true, trim: true },
    explanation: { type: String, default: "", trim: true },
    difficulty: {
      type: String,
      enum: QUIZ_QUESTION_DIFFICULTIES,
      default: "medium",
    },
    timesSeen: { type: Number, default: 0, min: 0 },
    timesCorrect: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

quizQuestionSchema.index({ studyKitId: 1, difficulty: 1 });

export type QuizQuestionDocument = InferSchemaType<typeof quizQuestionSchema> & {
  _id: Types.ObjectId;
};

export const QuizQuestion = model("QuizQuestion", quizQuestionSchema);

import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const STUDY_KIT_SOURCE_TYPES = ["pdf", "text", "youtube", "topic"] as const;
export type StudyKitSourceType = (typeof STUDY_KIT_SOURCE_TYPES)[number];

const sourceMetaSchema = new Schema(
  {
    fileName: { type: String, default: null },
    storagePath: { type: String, default: null },
    sizeBytes: { type: Number, default: null },
    youtubeUrl: { type: String, default: null },
    youtubeVideoId: { type: String, default: null },
    youtubeLanguage: { type: String, default: null },
    topicPrompt: { type: String, default: null },
    rawTextPreview: { type: String, default: null },
    pageCount: { type: Number, default: null },
  },
  { _id: false },
);

const studyKitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    sourceType: {
      type: String,
      enum: STUDY_KIT_SOURCE_TYPES,
      required: true,
    },
    sourceMeta: { type: sourceMetaSchema, default: () => ({}) },
    language: { type: String, default: "en" },
    isPublic: { type: Boolean, default: false, index: true },
    /** Optional department tag — used when surfacing kits in the shared library. */
    sharedDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    /** When this kit was forked from another public kit, points at the source. */
    originalKitId: {
      type: Schema.Types.ObjectId,
      ref: "StudyKit",
      default: null,
      index: true,
    },
    flashcardCount: { type: Number, default: 0, min: 0 },
    quizQuestionCount: { type: Number, default: 0, min: 0 },
    hasSummary: { type: Boolean, default: false },
    hasGuide: { type: Boolean, default: false },
    forkCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

studyKitSchema.index({ userId: 1, updatedAt: -1 });
studyKitSchema.index({ isPublic: 1, updatedAt: -1 });
studyKitSchema.index({ title: "text", description: "text" });

export type StudyKitDocument = InferSchemaType<typeof studyKitSchema> & {
  _id: Types.ObjectId;
};

export const StudyKit = model("StudyKit", studyKitSchema);

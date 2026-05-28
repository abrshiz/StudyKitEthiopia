import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const aiContextSchema = new Schema(
  {
    /**
     * RAG chunks can be linked to a shared-library Material OR to a private
     * StudyKit (or both, when a kit is forked from a material). At least
     * one of `materialId` / `studyKitId` should be set.
     */
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      default: null,
      index: true,
    },
    studyKitId: {
      type: Schema.Types.ObjectId,
      ref: "StudyKit",
      default: null,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    /** Short course code (e.g. "CSE 201") for narrow filtering before $text search. */
    courseCode: { type: String, default: "", trim: true, index: true },
    chunkText: { type: String, required: true },
    chunkIndex: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

aiContextSchema.index({ chunkText: "text" });
aiContextSchema.index({ departmentId: 1, courseCode: 1 });
aiContextSchema.index({ studyKitId: 1, chunkIndex: 1 });

export type AiContextDocument = InferSchemaType<typeof aiContextSchema> & {
  _id: Types.ObjectId;
};

export const AiContext = model("AiContext", aiContextSchema);

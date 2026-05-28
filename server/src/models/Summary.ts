import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const summarySchema = new Schema(
  {
    studyKitId: {
      type: Schema.Types.ObjectId,
      ref: "StudyKit",
      required: true,
      unique: true,
    },
    content: { type: String, required: true },
    language: { type: String, default: "en" },
  },
  { timestamps: true },
);

export type SummaryDocument = InferSchemaType<typeof summarySchema> & {
  _id: Types.ObjectId;
};

export const Summary = model("Summary", summarySchema);

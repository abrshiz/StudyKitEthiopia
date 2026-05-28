import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const studyGuideSchema = new Schema(
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

export type StudyGuideDocument = InferSchemaType<typeof studyGuideSchema> & {
  _id: Types.ObjectId;
};

export const StudyGuide = model("StudyGuide", studyGuideSchema);

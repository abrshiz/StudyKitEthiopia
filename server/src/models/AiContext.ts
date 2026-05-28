import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const aiContextSchema = new Schema(
  {
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
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

export type AiContextDocument = InferSchemaType<typeof aiContextSchema> & {
  _id: Types.ObjectId;
};

export const AiContext = model("AiContext", aiContextSchema);

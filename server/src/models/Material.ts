import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const materialSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["PDF", "PPT", "DOC"], required: true },
    course: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    sizeLabel: { type: String, required: true },
    fileUrl: { type: String, default: "" },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    uploadedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    downloadCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

materialSchema.index({ title: "text", course: "text" });
materialSchema.index({ departmentId: 1, createdAt: -1 });

export type MaterialDocument = InferSchemaType<typeof materialSchema> & { _id: Types.ObjectId };

export const Material = model("Material", materialSchema);

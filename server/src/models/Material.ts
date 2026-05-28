import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const FOUR_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 4;

const materialSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["PDF", "PPT", "DOC"], required: true },
    course: { type: String, required: true, trim: true },
    /** Short course code shown in URLs / used by AI context filter, e.g. "CSE 201". */
    courseCode: { type: String, default: "", trim: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    semester: { type: String, required: true, trim: true },
    sizeLabel: { type: String, required: true },
    /**
     * Opaque pointer to storage; for local disk it is `local:<relative>`. Never
     * exposed to clients — downloads go through /api/download/:id.
     */
    fileUrl: { type: String, default: "" },
    /** Server-relative path under server/uploads. */
    storagePath: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    uploadedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    downloadCount: { type: Number, default: 0, min: 0 },
    /** Materials expire 4 months after upload. */
    expiryDate: {
      type: Date,
      default: () => new Date(Date.now() + FOUR_MONTHS_MS),
      index: true,
    },
  },
  { timestamps: true },
);

materialSchema.index({ title: "text", course: "text" });
materialSchema.index({ departmentId: 1, createdAt: -1 });

export type MaterialDocument = InferSchemaType<typeof materialSchema> & { _id: Types.ObjectId };

export const Material = model("Material", materialSchema);

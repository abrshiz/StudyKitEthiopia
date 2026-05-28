import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const courseSchema = new Schema(
  {
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    code: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    year: { type: Number, min: 1, max: 7, default: 1 },
    semester: { type: String, trim: true, default: "Semester I" },
    credits: { type: Number, min: 0, max: 30, default: 3 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

courseSchema.index({ departmentId: 1, code: 1 }, { unique: true });
courseSchema.index({ title: "text", code: "text" });

export type CourseDocument = InferSchemaType<typeof courseSchema> & { _id: Types.ObjectId };

export const Course = model("Course", courseSchema);

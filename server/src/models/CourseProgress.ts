import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const courseProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: String, required: true, trim: true },
    percent: { type: Number, default: 0, min: 0, max: 100 },
    hoursLabel: { type: String, default: "0h" },
  },
  { timestamps: true },
);

courseProgressSchema.index({ userId: 1, course: 1 }, { unique: true });

export type CourseProgressDocument = InferSchemaType<typeof courseProgressSchema> & {
  _id: Types.ObjectId;
};

export const CourseProgress = model("CourseProgress", courseProgressSchema);

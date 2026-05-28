import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    college: { type: String, required: true, trim: true, index: true },
    studentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

departmentSchema.index({ name: "text", college: "text" });

export type DepartmentDocument = InferSchemaType<typeof departmentSchema> & {
  _id: Types.ObjectId;
};

export const Department = model("Department", departmentSchema);

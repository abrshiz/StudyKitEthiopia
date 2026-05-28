import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const planSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    period: { type: String, required: true },
    popular: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type PlanDocument = InferSchemaType<typeof planSchema> & { _id: Types.ObjectId };

export const Plan = model("Plan", planSchema);

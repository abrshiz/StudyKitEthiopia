import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const badgeSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

export type BadgeDocument = InferSchemaType<typeof badgeSchema> & { _id: Types.ObjectId };

export const Badge = model("Badge", badgeSchema);

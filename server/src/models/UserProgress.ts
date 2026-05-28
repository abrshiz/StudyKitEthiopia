import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const userProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentStreakDays: { type: Number, default: 0 },
    longestStreakDays: { type: Number, default: 0 },
    weeklyActivity: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] },
    weeklyMinutes: { type: Number, default: 0 },
    materialsRead: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type UserProgressDocument = InferSchemaType<typeof userProgressSchema> & {
  _id: Types.ObjectId;
};

export const UserProgress = model("UserProgress", userProgressSchema);

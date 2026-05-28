import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/** Junction: which user earned which badge (normalized). */
const userBadgeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badge", required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export type UserBadgeDocument = InferSchemaType<typeof userBadgeSchema> & { _id: Types.ObjectId };

export const UserBadge = model("UserBadge", userBadgeSchema);

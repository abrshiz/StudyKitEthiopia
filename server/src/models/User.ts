import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "professor", "admin"], default: "student" },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: { type: Date, default: null },
    approvedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    phone: { type: String, trim: true },
    university: { type: String, trim: true },
    year: { type: String, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ departmentId: 1 });
userSchema.index({ approvalStatus: 1, createdAt: -1 });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const User = model("User", userSchema);

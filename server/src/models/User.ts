import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const subscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ["free", "student", "premium"],
      default: "free",
    },
    expiryDate: { type: Date, default: null },
    dailyDownloadsLeft: { type: Number, default: 5, min: 0 },
    dailyDownloadsResetAt: { type: Date, default: () => new Date(0) },
    streakDays: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date, default: null },
    totalDownloads: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    /**
     * Optional because Microsoft OAuth users may not have a local password.
     * For credentials login this is enforced in the service layer.
     */
    passwordHash: { type: String, default: null, select: false },
    /**
     * Microsoft (Azure AD v2.0) subject id (`oid` or `sub`). Sparse so we can
     * also have credentials-only users without colliding on null.
     */
    microsoftId: { type: String, default: null },
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
    /** Professors are scoped to one department for uploads / analytics / tickets. */
    professorDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    /** Denormalized badge slugs for fast UI reads (history lives in UserBadge). */
    badges: { type: [String], default: [] },
    subscription: { type: subscriptionSchema, default: () => ({}) },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ microsoftId: 1 }, { unique: true, sparse: true });
userSchema.index({ departmentId: 1 });
userSchema.index({ approvalStatus: 1, createdAt: -1 });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const User = model("User", userSchema);

import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const subscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ["free", "student", "premium"],
      default: "free",
    },
    expiryDate: { type: Date, default: null },
    /** Monthly kit-creation quota — replaces the old daily download bucket. */
    kitsCreatedThisMonth: { type: Number, default: 0, min: 0 },
    monthlyResetAt: { type: Date, default: () => new Date(0) },
    streakDays: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date, default: null },
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
    /**
     * `student` is the default for every signup. Any user can flip themselves
     * to `professor` later to publish content into the shared library. There
     * is no admin role.
     */
    role: { type: String, enum: ["student", "professor"], default: "student" },
    phone: { type: String, trim: true },
    university: { type: String, trim: true },
    year: { type: String, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null },
    /** Denormalized badge slugs for fast UI reads (history lives in UserBadge). */
    badges: { type: [String], default: [] },
    subscription: { type: subscriptionSchema, default: () => ({}) },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ microsoftId: 1 }, { unique: true, sparse: true });
userSchema.index({ departmentId: 1 });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const User = model("User", userSchema);

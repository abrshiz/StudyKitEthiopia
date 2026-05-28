import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    userEmail: { type: String, default: "" },
    action: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & { _id: Types.ObjectId };

export const AuditLog = model("AuditLog", auditLogSchema);

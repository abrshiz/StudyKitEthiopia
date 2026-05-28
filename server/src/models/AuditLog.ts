import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    userEmail: { type: String, default: "" },
    /**
     * Broad action vocabulary so analytics queries stay simple. Free-form so we
     * never block future actions — known values:
     *  view | download | ai_query | approve | reject | broadcast | payment | login | upload | ticket
     */
    action: { type: String, required: true, index: true },
    detail: { type: String, required: true },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", default: null, index: true },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & { _id: Types.ObjectId };

export const AuditLog = model("AuditLog", auditLogSchema);

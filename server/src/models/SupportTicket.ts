import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const supportTicketSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Open", "In progress", "Resolved"],
      default: "Open",
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", default: null },
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    adminResponse: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type SupportTicketDocument = InferSchemaType<typeof supportTicketSchema> & {
  _id: Types.ObjectId;
};

export const SupportTicket = model("SupportTicket", supportTicketSchema);

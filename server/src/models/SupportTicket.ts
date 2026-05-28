import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const supportTicketSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["Open", "In progress", "Resolved"], default: "Open" },
  },
  { timestamps: true },
);

export type SupportTicketDocument = InferSchemaType<typeof supportTicketSchema> & {
  _id: Types.ObjectId;
};

export const SupportTicket = model("SupportTicket", supportTicketSchema);

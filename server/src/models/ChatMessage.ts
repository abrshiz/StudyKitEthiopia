import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const chatMessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", default: null },
    role: { type: String, enum: ["user", "ai"], required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

chatMessageSchema.index({ userId: 1, createdAt: 1 });

export type ChatMessageDocument = InferSchemaType<typeof chatMessageSchema> & {
  _id: Types.ObjectId;
};

export const ChatMessage = model("ChatMessage", chatMessageSchema);

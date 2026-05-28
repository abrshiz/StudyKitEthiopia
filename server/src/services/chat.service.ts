import { ChatMessage } from "../models/index.js";
import { mapChatMessage } from "../mappers/index.js";
import type { RequestUser } from "../middleware/user-context.js";

export async function getChatHistory(user: RequestUser) {
  const docs = await ChatMessage.find({ userId: user._id }).sort({ createdAt: 1 }).limit(200);
  return docs.map(mapChatMessage);
}

export async function sendMessage(
  user: RequestUser,
  input: { message: string; materialId?: string },
) {
  await ChatMessage.create({
    userId: user._id,
    materialId: input.materialId ?? null,
    role: "user",
    text: input.message.trim(),
  });

  // Placeholder until AI provider is wired — stored as a normal message
  const reply = await ChatMessage.create({
    userId: user._id,
    materialId: input.materialId ?? null,
    role: "ai",
    text: "AI provider not configured yet. Your message was saved.",
  });

  return mapChatMessage(reply);
}

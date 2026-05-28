import { apiFetch } from "./client";
import type { ChatMessage } from "@/lib/types";

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>("/chat");
}

export async function sendChatMessage(body: {
  message: string;
  materialId?: string;
}): Promise<ChatMessage> {
  return apiFetch<ChatMessage>("/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

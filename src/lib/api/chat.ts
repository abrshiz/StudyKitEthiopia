import { apiFetch, getApiBaseUrl } from "./client";
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

export type AskBody = {
  question: string;
  department?: string;
  courseCode?: string;
  materialId?: string;
};

export type AskEvent =
  | { type: "context"; chunksUsed: number }
  | { type: "token"; text: string }
  | { type: "error"; message: string }
  | { type: "done"; id?: string };

/**
 * Streams Gemini answer tokens over SSE. Caller passes an `onEvent` callback
 * and awaits the final promise to know when the stream ends.
 */
export async function askAiStream(
  body: AskBody,
  onEvent: (event: AskEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API_NOT_CONFIGURED");

  const res = await fetch(`${base}/chat/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ ...body, stream: true }),
    credentials: "include",
    signal,
  });
  if (!res.ok || !res.body) {
    const message = res.statusText || "AI request failed";
    onEvent({ type: "error", message });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const raw of events) {
      const event = parseSseEvent(raw);
      if (event) onEvent(event);
    }
  }
  if (buffer.trim()) {
    const event = parseSseEvent(buffer);
    if (event) onEvent(event);
  }
}

function parseSseEvent(raw: string): AskEvent | null {
  const lines = raw.split("\n");
  let event = "message";
  let data = "";
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    if (event === "token") return { type: "token", text: parsed.text ?? "" };
    if (event === "context") return { type: "context", chunksUsed: parsed.chunksUsed ?? 0 };
    if (event === "error") return { type: "error", message: parsed.message ?? "stream error" };
    if (event === "done") return { type: "done", id: parsed.id };
  } catch {
    /* skip malformed */
  }
  return null;
}

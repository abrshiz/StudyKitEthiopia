import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export function isGeminiConfigured(): boolean {
  return Boolean(env.gemini.apiKey);
}

export function buildTutorPrompt(context: string[], question: string): string {
  const joined = context
    .map((c, i) => `--- chunk ${i + 1} ---\n${c.trim()}`)
    .join("\n\n");
  return [
    "You are an AI tutor for Ethiopian university students.",
    "Answer ONLY from the following context. If the answer is not in the context, say 'I can only answer from your course materials.'",
    "",
    "Context:",
    joined || "(no relevant material chunks were indexed yet)",
    "",
    `Question: ${question.trim()}`,
  ].join("\n");
}

/** Convenience: drain the stream into a single string (for non-streaming clients / tests). */
export async function geminiAnswer(prompt: string, modelName?: string): Promise<string> {
  let out = "";
  for await (const piece of streamGeminiAnswer(prompt, modelName)) out += piece;
  return out;
}

function extractJsonPayload(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.indexOf("[");
  const startObj = raw.indexOf("{");
  if (start >= 0 && (startObj < 0 || start < startObj)) {
    const end = raw.lastIndexOf("]");
    if (end > start) return raw.slice(start, end + 1);
  }
  if (startObj >= 0) {
    const end = raw.lastIndexOf("}");
    if (end > startObj) return raw.slice(startObj, end + 1);
  }
  return raw.trim();
}

/**
 * Ask Gemini for strict JSON (or plain text when `asText: true`). Retries once
 * on parse failure.
 */
export async function geminiJson<T>(
  prompt: string,
  opts?: { model?: string; asText?: boolean },
): Promise<T> {
  const modelName = opts?.model ?? env.gemini.model;
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await geminiAnswer(
      attempt === 0
        ? prompt
        : `${prompt}\n\nYour previous reply was not valid JSON. Output ONLY valid JSON with no commentary.`,
      modelName,
    );
    if (opts?.asText) return raw as T;
    try {
      return JSON.parse(extractJsonPayload(raw)) as T;
    } catch (e) {
      lastErr = e as Error;
    }
  }

  throw new HttpError(502, `Gemini returned invalid JSON: ${lastErr?.message ?? "parse error"}`);
}

export async function* streamGeminiAnswer(
  prompt: string,
  modelName?: string,
): AsyncGenerator<string, void, unknown> {
  if (!isGeminiConfigured()) {
    throw new HttpError(503, "Gemini API key is not configured (GEMINI_API_KEY)");
  }

  const client = new GoogleGenerativeAI(env.gemini.apiKey);
  const model = client.getGenerativeModel({ model: modelName ?? env.gemini.model });

  let stream;
  try {
    stream = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
  } catch (err) {
    throw new HttpError(502, `Gemini call failed: ${(err as Error).message}`);
  }

  for await (const chunk of stream.stream) {
    const text = chunk?.text();
    if (text) yield text;
  }
}

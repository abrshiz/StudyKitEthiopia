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

export async function* streamGeminiAnswer(
  prompt: string,
): AsyncGenerator<string, void, unknown> {
  if (!isGeminiConfigured()) {
    throw new HttpError(503, "Gemini API key is not configured (GEMINI_API_KEY)");
  }

  const client = new GoogleGenerativeAI(env.gemini.apiKey);
  const model = client.getGenerativeModel({ model: env.gemini.model });

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

/** Convenience: drain the stream into a single string (for non-streaming clients / tests). */
export async function geminiAnswer(prompt: string): Promise<string> {
  let out = "";
  for await (const piece of streamGeminiAnswer(prompt)) out += piece;
  return out;
}

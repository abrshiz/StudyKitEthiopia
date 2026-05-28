import { geminiJson } from "./gemini.service.js";
import { chunkText } from "./ai-context.service.js";
import { resolveActivePlan, PLAN_GEMINI_MODEL } from "./subscription.service.js";
import { User } from "../models/index.js";
import { HttpError } from "../utils/http.js";

/**
 * For kits created from a topic description (no upload), synthesize study
 * context via Gemini and return chunks ready for AiContext indexing.
 */
export async function synthesizeTopicChunks(
  userId: string,
  topic: string,
  language = "en",
): Promise<string[]> {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const plan = resolveActivePlan(user);
  const model = PLAN_GEMINI_MODEL[plan];

  const prompt = [
    `You are a university study coach for Ethiopian students.`,
    `Produce dense study notes about the following topic in ${language === "am" ? "Amharic" : "English"}.`,
    `Cover definitions, key concepts, formulas, common exam traps, and 2-3 worked examples.`,
    `Output plain text only — no markdown headings, no JSON. Aim for 1200-2000 words.`,
    ``,
    `TOPIC: ${topic.trim()}`,
  ].join("\n");

  const text = await geminiJson<string>(prompt, { model, asText: true });
  const chunks = chunkText(text, 500);
  if (!chunks.length) {
    throw new HttpError(422, "Could not generate study content for this topic. Try a more specific title.");
  }
  return chunks;
}

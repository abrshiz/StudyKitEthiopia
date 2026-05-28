import { Summary, StudyKit, User } from "../models/index.js";
import { getStudyKitChunkTexts } from "./ai-context.service.js";
import { geminiAnswer } from "./gemini.service.js";
import { PLAN_GEMINI_MODEL, resolveActivePlan } from "./subscription.service.js";
import { HttpError } from "../utils/http.js";

export async function generateSummary(
  userId: string,
  studyKitId: string,
): Promise<{ content: string; id: string }> {
  const kit = await StudyKit.findById(studyKitId);
  if (!kit) throw new HttpError(404, "Study kit not found");
  if (String(kit.userId) !== userId) throw new HttpError(403, "Not your study kit");

  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const plan = resolveActivePlan(user);
  const chunks = await getStudyKitChunkTexts(studyKitId, 14);
  if (!chunks.length) throw new HttpError(422, "No indexed content yet.");

  const lang = kit.language === "am" ? "Amharic" : "English";
  const prompt = [
    `Summarize the following study content for an Ethiopian university student in ${lang}.`,
    `Use markdown with ## headings, bullet lists, and **bold** key terms.`,
    `Keep it under 600 words. Output markdown only.`,
    ``,
    chunks.join("\n\n"),
  ].join("\n");

  const content = await geminiAnswer(prompt, PLAN_GEMINI_MODEL[plan]);
  const doc = await Summary.findOneAndUpdate(
    { studyKitId: kit._id },
    { studyKitId: kit._id, content, language: kit.language },
    { upsert: true, new: true },
  );

  kit.hasSummary = true;
  await kit.save();

  return { content: doc!.content, id: String(doc!._id) };
}

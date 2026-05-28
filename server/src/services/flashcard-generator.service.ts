import { Flashcard, StudyKit, User } from "../models/index.js";
import { getStudyKitChunkTexts } from "./ai-context.service.js";
import { geminiJson } from "./gemini.service.js";
import {
  PLAN_FLASHCARD_LIMITS,
  PLAN_GEMINI_MODEL,
  resolveActivePlan,
} from "./subscription.service.js";
import { HttpError } from "../utils/http.js";

type GeneratedCard = { front: string; back: string };

export async function generateFlashcards(
  userId: string,
  studyKitId: string,
  count = 20,
): Promise<{ created: number; ids: string[] }> {
  const kit = await StudyKit.findById(studyKitId);
  if (!kit) throw new HttpError(404, "Study kit not found");
  if (String(kit.userId) !== userId) throw new HttpError(403, "Not your study kit");

  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const plan = resolveActivePlan(user);
  const max = PLAN_FLASHCARD_LIMITS[plan];
  const n = Math.min(Math.max(1, count), max);

  const chunks = await getStudyKitChunkTexts(studyKitId, 12);
  if (!chunks.length) {
    throw new HttpError(422, "No indexed content yet. Re-upload your source or try again.");
  }

  const lang = kit.language === "am" ? "Amharic" : "English";
  const prompt = [
    `You are a study coach. From the CONTENT below, produce exactly ${n} flashcards in ${lang}.`,
    `Each card: {"front": string <=15 words, "back": string <=60 words}.`,
    `Front is a question or term; back is the precise answer.`,
    `Avoid trivia, focus on testable understanding. Output ONLY a JSON array.`,
    ``,
    `CONTENT:`,
    chunks.join("\n\n"),
  ].join("\n");

  const cards = await geminiJson<GeneratedCard[]>(prompt, {
    model: PLAN_GEMINI_MODEL[plan],
  });

  if (!Array.isArray(cards) || !cards.length) {
    throw new HttpError(502, "Gemini did not return flashcards. Try again.");
  }

  const docs = cards.slice(0, n).map((c) => ({
    studyKitId: kit._id,
    userId,
    front: String(c.front ?? "").trim(),
    back: String(c.back ?? "").trim(),
    dueAt: new Date(),
  }));

  const inserted = await Flashcard.insertMany(docs.filter((d) => d.front && d.back));
  kit.flashcardCount = await Flashcard.countDocuments({ studyKitId: kit._id });
  await kit.save();

  return {
    created: inserted.length,
    ids: inserted.map((d) => String(d._id)),
  };
}

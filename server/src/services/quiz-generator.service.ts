import { QuizQuestion, StudyKit, User } from "../models/index.js";
import { getStudyKitChunkTexts } from "./ai-context.service.js";
import { geminiJson } from "./gemini.service.js";
import {
  PLAN_GEMINI_MODEL,
  PLAN_QUIZ_LIMITS,
  resolveActivePlan,
} from "./subscription.service.js";
import { HttpError } from "../utils/http.js";

type GeneratedQuestion = {
  type: "mc" | "short" | "tf";
  prompt: string;
  choices?: string[];
  answer: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
};

export async function generateQuizQuestions(
  userId: string,
  studyKitId: string,
  count = 10,
  difficulty: "easy" | "medium" | "hard" = "medium",
): Promise<{ created: number; ids: string[] }> {
  const kit = await StudyKit.findById(studyKitId);
  if (!kit) throw new HttpError(404, "Study kit not found");
  if (String(kit.userId) !== userId) throw new HttpError(403, "Not your study kit");

  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const plan = resolveActivePlan(user);
  const max = PLAN_QUIZ_LIMITS[plan];
  const n = Math.min(Math.max(1, count), max);

  const chunks = await getStudyKitChunkTexts(studyKitId, 12);
  if (!chunks.length) {
    throw new HttpError(422, "No indexed content yet.");
  }

  const lang = kit.language === "am" ? "Amharic" : "English";
  const prompt = [
    `You are a study coach. From the CONTENT below, produce exactly ${n} quiz questions in ${lang}.`,
    `Mix types: mc (4 choices), tf (choices ["True","False"]), and short (empty choices).`,
    `Each item: {"type":"mc"|"tf"|"short","prompt":str,"choices":string[],"answer":str,"explanation":str,"difficulty":"easy"|"medium"|"hard"}.`,
    `Target difficulty: ${difficulty}. Output ONLY a JSON array.`,
    ``,
    `CONTENT:`,
    chunks.join("\n\n"),
  ].join("\n");

  const items = await geminiJson<GeneratedQuestion[]>(prompt, {
    model: PLAN_GEMINI_MODEL[plan],
  });

  if (!Array.isArray(items) || !items.length) {
    throw new HttpError(502, "Gemini did not return quiz questions. Try again.");
  }

  const docs = items.slice(0, n).map((q) => ({
    studyKitId: kit._id,
    type: q.type ?? "mc",
    prompt: String(q.prompt ?? "").trim(),
    choices: Array.isArray(q.choices) ? q.choices.map(String) : [],
    answer: String(q.answer ?? "").trim(),
    explanation: String(q.explanation ?? "").trim(),
    difficulty: q.difficulty ?? difficulty,
  }));

  const inserted = await QuizQuestion.insertMany(docs.filter((d) => d.prompt && d.answer));
  kit.quizQuestionCount = await QuizQuestion.countDocuments({ studyKitId: kit._id });
  await kit.save();

  return { created: inserted.length, ids: inserted.map((d) => String(d._id)) };
}

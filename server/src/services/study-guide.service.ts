import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { StudyGuide, StudyKit, User } from "../models/index.js";
import { getStudyKitChunkTexts } from "./ai-context.service.js";
import { geminiAnswer } from "./gemini.service.js";
import { PLAN_GEMINI_MODEL, resolveActivePlan } from "./subscription.service.js";
import { HttpError } from "../utils/http.js";

export async function generateStudyGuide(
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
    `Create a comprehensive study guide in ${lang} from the CONTENT below.`,
    `Use markdown with these sections:`,
    `## Overview`,
    `## Key Concepts`,
    `## Detailed Topics`,
    `## Practice Questions`,
    `## Takeaways`,
    `Aim for 900-1400 words. Output markdown only.`,
    ``,
    chunks.join("\n\n"),
  ].join("\n");

  const content = await geminiAnswer(prompt, PLAN_GEMINI_MODEL[plan]);
  const doc = await StudyGuide.findOneAndUpdate(
    { studyKitId: kit._id },
    { studyKitId: kit._id, content, language: kit.language },
    { upsert: true, new: true },
  );

  kit.hasGuide = true;
  await kit.save();

  return { content: doc!.content, id: String(doc!._id) };
}

/** Render markdown-ish study guide text to a simple PDF. */
export async function exportStudyGuidePdf(
  userId: string,
  studyKitId: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const kit = await StudyKit.findById(studyKitId);
  if (!kit) throw new HttpError(404, "Study kit not found");
  if (String(kit.userId) !== userId) throw new HttpError(403, "Not your study kit");

  const guide = await StudyGuide.findOne({ studyKitId: kit._id });
  if (!guide?.content) throw new HttpError(404, "Generate a study guide first");

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const margin = 50;
  const lineHeight = 14;
  const maxWidth = 512;

  let page = pdf.addPage([612, 792]);
  let y = 742;

  const lines = wrapText(guide.content, maxWidth, font, fontSize);
  for (const line of lines) {
    if (y < margin + lineHeight) {
      page = pdf.addPage([612, 792]);
      y = 742;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight;
  }

  const bytes = await pdf.save();
  const safeTitle = kit.title.replace(/[^\w\s-]/g, "").trim() || "study-guide";
  return { buffer: Buffer.from(bytes), filename: `${safeTitle}-guide.pdf` };
}

function wrapText(
  text: string,
  maxWidth: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontSize: number,
): string[] {
  const out: string[] = [];
  const paragraphs = text.split(/\n/);
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push("");
      continue;
    }
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
        if (line) out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

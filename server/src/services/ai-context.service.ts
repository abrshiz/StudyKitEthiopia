import { AiContext, type AiContextDocument } from "../models/index.js";
import type { Types } from "mongoose";

/** Split raw text into ~500-char chunks at word boundaries. */
export function chunkText(text: string, chunkSize = 500): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < clean.length) {
    let end = Math.min(cursor + chunkSize, clean.length);
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end);
      if (lastSpace > cursor + chunkSize * 0.6) end = lastSpace;
    }
    chunks.push(clean.slice(cursor, end).trim());
    cursor = end;
  }
  return chunks.filter((c) => c.length > 0);
}

/** Parse a PDF buffer into chunks. Uses pdf-parse lazily so it can be tree-shaken. */
export async function extractPdfChunks(buffer: Buffer, chunkSize = 500): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("pdf-parse");
  const parser = mod.default ?? mod;
  const result = await parser(buffer);
  return chunkText(result.text ?? "", chunkSize);
}

/** Replace all chunks for a material in one transactional shot. */
export async function reindexMaterialChunks(
  materialId: Types.ObjectId | string,
  departmentId: Types.ObjectId | string,
  courseCode: string,
  chunks: string[],
): Promise<number> {
  await AiContext.deleteMany({ materialId });
  if (!chunks.length) return 0;
  const docs = chunks.map((chunkText, idx) => ({
    materialId,
    departmentId,
    courseCode,
    chunkText,
    chunkIndex: idx,
  }));
  await AiContext.insertMany(docs, { ordered: false });
  return docs.length;
}

export type RelevantChunk = {
  id: string;
  materialId: string;
  chunkText: string;
  courseCode: string;
  score: number;
};

/**
 * Find chunks most relevant to a question. Uses Mongo's $text index when
 * possible, falls back to a case-insensitive regex pass.
 */
/** Replace all chunks for a study kit. */
export async function reindexStudyKitChunks(
  studyKitId: Types.ObjectId | string,
  chunks: string[],
  departmentId?: Types.ObjectId | string | null,
): Promise<number> {
  await AiContext.deleteMany({ studyKitId });
  if (!chunks.length) return 0;
  const docs = chunks.map((chunkText, idx) => ({
    studyKitId,
    departmentId: departmentId ?? null,
    courseCode: "",
    chunkText,
    chunkIndex: idx,
  }));
  await AiContext.insertMany(docs, { ordered: false });
  return docs.length;
}

export async function getStudyKitChunkTexts(
  studyKitId: string,
  limit = 12,
): Promise<string[]> {
  const docs = await AiContext.find({ studyKitId })
    .sort({ chunkIndex: 1 })
    .limit(limit)
    .lean();
  return docs.map((d) => d.chunkText);
}

export async function findRelevantChunks(
  query: string,
  filter: { departmentId?: string; courseCode?: string; studyKitId?: string },
  limit = 6,
): Promise<RelevantChunk[]> {
  if (!query.trim() && !filter.studyKitId) return [];

  const base: Record<string, unknown> = {};
  if (filter.departmentId) base.departmentId = filter.departmentId;
  if (filter.courseCode) base.courseCode = filter.courseCode;
  if (filter.studyKitId) base.studyKitId = filter.studyKitId;

  const textCursor = AiContext.find(
    { ...base, $text: { $search: query } },
    { score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .lean<AiContextDocument & { score?: number }>();

  let docs = await (textCursor as unknown as Promise<Array<AiContextDocument & { score?: number }>>);

  if (docs.length === 0 && filter.studyKitId && !query.trim()) {
    const fallback = await AiContext.find({ studyKitId: filter.studyKitId })
      .sort({ chunkIndex: 1 })
      .limit(limit)
      .lean<Array<AiContextDocument & { score?: number }>>();
    docs = fallback;
  }

  if (docs.length === 0) {
    const tokens = query
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2)
      .slice(0, 6);
    if (tokens.length > 0) {
      const orClauses = tokens.map((t) => ({ chunkText: new RegExp(escapeRegex(t), "i") }));
      docs = await AiContext.find({ ...base, $or: orClauses })
        .limit(limit)
        .lean<Array<AiContextDocument & { score?: number }>>();
    }
  }

  return docs.map((doc) => ({
    id: String(doc._id),
    materialId: String(doc.materialId),
    chunkText: doc.chunkText,
    courseCode: doc.courseCode ?? "",
    score: typeof doc.score === "number" ? doc.score : 0,
  }));
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

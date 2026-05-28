import { AuditLog, ChatMessage, Material } from "../models/index.js";
import { mapChatMessage } from "../mappers/index.js";
import type { RequestUser } from "../middleware/auth.middleware.js";
import { findRelevantChunks } from "./ai-context.service.js";
import { buildTutorPrompt, geminiAnswer, isGeminiConfigured, streamGeminiAnswer } from "./gemini.service.js";
import { HttpError } from "../utils/http.js";
import { touchStreak } from "./subscription.service.js";
import type { Response } from "express";

export async function getChatHistory(user: RequestUser) {
  const docs = await ChatMessage.find({ userId: user._id }).sort({ createdAt: 1 }).limit(200);
  return docs.map(mapChatMessage);
}

async function resolveContext(input: {
  department?: string;
  courseCode?: string;
  materialId?: string;
}): Promise<{ departmentId?: string; courseCode?: string }> {
  if (input.materialId) {
    const mat = await Material.findById(input.materialId).lean();
    if (mat) {
      return {
        departmentId: String(mat.departmentId),
        courseCode: mat.courseCode ?? input.courseCode ?? "",
      };
    }
  }
  return {
    departmentId: input.department,
    courseCode: input.courseCode,
  };
}

export type AskInput = {
  question: string;
  department?: string;
  courseCode?: string;
  materialId?: string;
};

/** Non-streaming variant — used by tests and the legacy `POST /chat`. */
export async function ask(user: RequestUser, input: AskInput, ip: string) {
  if (!input.question.trim()) throw new HttpError(400, "Question required");

  await ChatMessage.create({
    userId: user._id,
    materialId: input.materialId ?? null,
    role: "user",
    text: input.question.trim(),
  });

  const ctx = await resolveContext(input);
  const chunks = await findRelevantChunks(input.question, ctx, 6);
  const prompt = buildTutorPrompt(chunks.map((c) => c.chunkText), input.question);

  let answer = "AI provider not configured. Please add GEMINI_API_KEY.";
  if (isGeminiConfigured()) {
    answer = await geminiAnswer(prompt);
  }

  const reply = await ChatMessage.create({
    userId: user._id,
    materialId: input.materialId ?? null,
    role: "ai",
    text: answer,
  });

  await AuditLog.create({
    userId: user._id,
    userEmail: user.email,
    action: "ai_query",
    detail: input.question.slice(0, 200),
    materialId: input.materialId ?? null,
    ip,
  });
  await touchStreak(user._id);

  return {
    message: mapChatMessage(reply),
    chunksUsed: chunks.length,
  };
}

/**
 * Streams the answer as `text/event-stream`. Each chunk is one SSE `data:` line;
 * the final event is `event: done`.
 */
export async function askStream(
  user: RequestUser,
  input: AskInput,
  ip: string,
  res: Response,
) {
  if (!input.question.trim()) throw new HttpError(400, "Question required");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const write = (payload: object, event?: string) => {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  await ChatMessage.create({
    userId: user._id,
    materialId: input.materialId ?? null,
    role: "user",
    text: input.question.trim(),
  });

  const ctx = await resolveContext(input);
  const chunks = await findRelevantChunks(input.question, ctx, 6);
  const prompt = buildTutorPrompt(chunks.map((c) => c.chunkText), input.question);

  write({ chunksUsed: chunks.length }, "context");

  let collected = "";
  try {
    if (!isGeminiConfigured()) {
      const fallback = "AI provider not configured. Add GEMINI_API_KEY to your server .env and restart.";
      collected = fallback;
      write({ text: fallback }, "token");
    } else {
      for await (const piece of streamGeminiAnswer(prompt)) {
        collected += piece;
        write({ text: piece }, "token");
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    write({ message: msg }, "error");
  }

  const reply = await ChatMessage.create({
    userId: user._id,
    materialId: input.materialId ?? null,
    role: "ai",
    text: collected || "(no response)",
  });
  await AuditLog.create({
    userId: user._id,
    userEmail: user.email,
    action: "ai_query",
    detail: input.question.slice(0, 200),
    materialId: input.materialId ?? null,
    ip,
  });
  await touchStreak(user._id);

  write({ id: String(reply._id) }, "done");
  res.end();
}

/** Backwards-compat: the existing POST /chat handler used to call this. */
export async function sendMessage(
  user: RequestUser,
  input: { message: string; materialId?: string },
) {
  const result = await ask(
    user,
    { question: input.message, materialId: input.materialId },
    "",
  );
  return result.message;
}

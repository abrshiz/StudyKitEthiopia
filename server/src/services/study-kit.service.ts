import { Types } from "mongoose";
import {
  AiContext,
  Flashcard,
  QuizAttempt,
  QuizQuestion,
  StudyGuide,
  StudyKit,
  Summary,
  User,
  type StudyKitSourceType,
} from "../models/index.js";
import {
  chunkText,
  extractPdfChunks,
  reindexStudyKitChunks,
} from "./ai-context.service.js";
import {
  assertKitQuota,
  PLAN_PDF_PAGE_LIMITS,
  resolveActivePlan,
} from "./subscription.service.js";
import { synthesizeTopicChunks } from "./topic-source.service.js";
import { fetchYoutubeTranscript, extractYoutubeVideoId } from "./youtube-transcript.service.js";
import {
  ensureMaterialDir,
  humanFileSize,
  writeMaterialFile,
} from "./upload.service.js";
import { HttpError } from "../utils/http.js";

export type StudyKitDto = {
  id: string;
  title: string;
  description: string;
  sourceType: StudyKitSourceType;
  language: string;
  isPublic: boolean;
  sharedDepartmentId: string | null;
  originalKitId: string | null;
  flashcardCount: number;
  quizQuestionCount: number;
  hasSummary: boolean;
  hasGuide: boolean;
  forkCount: number;
  sourceMeta: Record<string, unknown>;
  ownerName?: string;
  createdAt: string;
  updatedAt: string;
};

function mapKit(
  doc: {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    sourceType: StudyKitSourceType;
    language?: string;
    isPublic?: boolean;
    sharedDepartmentId?: Types.ObjectId | null;
    originalKitId?: Types.ObjectId | null;
    flashcardCount?: number;
    quizQuestionCount?: number;
    hasSummary?: boolean;
    hasGuide?: boolean;
    forkCount?: number;
    sourceMeta?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
  },
  ownerName?: string,
): StudyKitDto {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description ?? "",
    sourceType: doc.sourceType,
    language: doc.language ?? "en",
    isPublic: Boolean(doc.isPublic),
    sharedDepartmentId: doc.sharedDepartmentId ? String(doc.sharedDepartmentId) : null,
    originalKitId: doc.originalKitId ? String(doc.originalKitId) : null,
    flashcardCount: doc.flashcardCount ?? 0,
    quizQuestionCount: doc.quizQuestionCount ?? 0,
    hasSummary: Boolean(doc.hasSummary),
    hasGuide: Boolean(doc.hasGuide),
    forkCount: doc.forkCount ?? 0,
    sourceMeta: (doc.sourceMeta as Record<string, unknown>) ?? {},
    ownerName,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function createStudyKitFromPdf(
  userId: string,
  input: {
    title: string;
    description?: string;
    language?: string;
    isPublic?: boolean;
    sharedDepartmentId?: string;
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  },
): Promise<StudyKitDto> {
  await assertKitQuota(userId);

  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const plan = resolveActivePlan(user);
  const pageLimit = PLAN_PDF_PAGE_LIMITS[plan];

  const kit = await StudyKit.create({
    userId,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    sourceType: "pdf",
    language: input.language ?? "en",
    isPublic: Boolean(input.isPublic),
    sharedDepartmentId: input.sharedDepartmentId ?? user.departmentId,
    sourceMeta: { fileName: input.fileName },
  });

  const { storagePath } = writeMaterialFile(String(kit._id), input.buffer, ".pdf");
  kit.sourceMeta.storagePath = storagePath;
  kit.sourceMeta.sizeBytes = input.buffer.length;
  kit.sourceMeta.fileName = input.fileName;

  let chunks: string[] = [];
  try {
    chunks = await extractPdfChunks(input.buffer);
  } catch {
    chunks = chunkText(input.description ?? input.title, 500);
  }

  // Rough page estimate: ~3000 chars per page
  const estPages = Math.ceil(chunks.join("").length / 3000);
  if (estPages > pageLimit) {
    await StudyKit.findByIdAndDelete(kit._id);
    throw new HttpError(
      413,
      `PDF is too long (~${estPages} pages). Your ${plan} plan allows up to ${pageLimit} pages.`,
    );
  }

  kit.sourceMeta.pageCount = estPages;
  await reindexStudyKitChunks(kit._id, chunks, user.departmentId);
  await kit.save();

  return mapKit(kit.toObject());
}

export async function createStudyKitFromText(
  userId: string,
  input: {
    title: string;
    text: string;
    description?: string;
    language?: string;
    isPublic?: boolean;
    sharedDepartmentId?: string;
  },
): Promise<StudyKitDto> {
  await assertKitQuota(userId);

  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const clean = input.text.trim();
  if (clean.length < 80) throw new HttpError(400, "Paste at least 80 characters of notes");

  const kit = await StudyKit.create({
    userId,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    sourceType: "text",
    language: input.language ?? "en",
    isPublic: Boolean(input.isPublic),
    sharedDepartmentId: input.sharedDepartmentId ?? user.departmentId,
    sourceMeta: { rawTextPreview: clean.slice(0, 500) },
  });

  const chunks = chunkText(clean, 500);
  await reindexStudyKitChunks(kit._id, chunks, user.departmentId);
  await kit.save();

  return mapKit(kit.toObject());
}

export async function createStudyKitFromYoutube(
  userId: string,
  input: {
    title: string;
    url: string;
    description?: string;
    language?: string;
    isPublic?: boolean;
    sharedDepartmentId?: string;
  },
): Promise<StudyKitDto> {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const plan = resolveActivePlan(user);
  if (plan === "free") {
    throw new HttpError(403, "YouTube import requires the Student or Premium plan");
  }

  await assertKitQuota(userId);

  const { videoId, transcript, language } = await fetchYoutubeTranscript(input.url);

  const kit = await StudyKit.create({
    userId,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    sourceType: "youtube",
    language: input.language ?? language,
    isPublic: Boolean(input.isPublic),
    sharedDepartmentId: input.sharedDepartmentId ?? user.departmentId,
    sourceMeta: {
      youtubeUrl: input.url,
      youtubeVideoId: videoId,
      youtubeLanguage: language,
      rawTextPreview: transcript.slice(0, 500),
    },
  });

  const chunks = chunkText(transcript, 500);
  await reindexStudyKitChunks(kit._id, chunks, user.departmentId);
  await kit.save();

  return mapKit(kit.toObject());
}

export async function createStudyKitFromTopic(
  userId: string,
  input: {
    title: string;
    topic: string;
    description?: string;
    language?: string;
    isPublic?: boolean;
    sharedDepartmentId?: string;
  },
): Promise<StudyKitDto> {
  await assertKitQuota(userId);

  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const topic = input.topic.trim();
  if (topic.length < 10) throw new HttpError(400, "Describe your test topic in at least 10 characters");

  const kit = await StudyKit.create({
    userId,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    sourceType: "topic",
    language: input.language ?? "en",
    isPublic: Boolean(input.isPublic),
    sharedDepartmentId: input.sharedDepartmentId ?? user.departmentId,
    sourceMeta: { topicPrompt: topic },
  });

  const chunks = await synthesizeTopicChunks(userId, topic, kit.language);
  await reindexStudyKitChunks(kit._id, chunks, user.departmentId);
  await kit.save();

  return mapKit(kit.toObject());
}

export async function listStudyKits(
  userId: string,
  opts: { publicOnly?: boolean; q?: string } = {},
): Promise<StudyKitDto[]> {
  const filter: Record<string, unknown> = opts.publicOnly
    ? { isPublic: true }
    : { userId };

  if (opts.q?.trim()) {
    filter.$text = { $search: opts.q.trim() };
  }

  const kits = await StudyKit.find(filter).sort({ updatedAt: -1 }).limit(100).lean();

  const ownerIds = [...new Set(kits.map((k) => String(k.userId)))];
  const owners = await User.find({ _id: { $in: ownerIds } }).select("name").lean();
  const nameById = new Map(owners.map((o) => [String(o._id), o.name]));

  return kits.map((k) => mapKit(k as never, nameById.get(String(k.userId))));
}

export async function getStudyKit(userId: string, kitId: string): Promise<StudyKitDto> {
  const kit = await StudyKit.findById(kitId).lean();
  if (!kit) throw new HttpError(404, "Study kit not found");

  const isOwner = String(kit.userId) === userId;
  if (!isOwner && !kit.isPublic) throw new HttpError(403, "This kit is private");

  let ownerName: string | undefined;
  if (!isOwner) {
    const owner = await User.findById(kit.userId).select("name").lean();
    ownerName = owner?.name;
  }

  return mapKit(kit as never, ownerName);
}

export async function updateStudyKit(
  userId: string,
  kitId: string,
  patch: { title?: string; isPublic?: boolean; description?: string },
): Promise<StudyKitDto> {
  const kit = await StudyKit.findById(kitId);
  if (!kit) throw new HttpError(404, "Study kit not found");
  if (String(kit.userId) !== userId) throw new HttpError(403, "Not your study kit");

  if (patch.title) kit.title = patch.title.trim();
  if (patch.description !== undefined) kit.description = patch.description.trim();
  if (patch.isPublic !== undefined) kit.isPublic = patch.isPublic;

  await kit.save();
  return mapKit(kit.toObject());
}

export async function deleteStudyKit(userId: string, kitId: string): Promise<void> {
  const kit = await StudyKit.findById(kitId);
  if (!kit) throw new HttpError(404, "Study kit not found");
  if (String(kit.userId) !== userId) throw new HttpError(403, "Not your study kit");

  await Promise.all([
    AiContext.deleteMany({ studyKitId: kit._id }),
    Flashcard.deleteMany({ studyKitId: kit._id }),
    QuizQuestion.deleteMany({ studyKitId: kit._id }),
    QuizAttempt.deleteMany({ studyKitId: kit._id }),
    Summary.deleteMany({ studyKitId: kit._id }),
    StudyGuide.deleteMany({ studyKitId: kit._id }),
    StudyKit.deleteOne({ _id: kit._id }),
  ]);
}

export async function forkStudyKit(userId: string, kitId: string): Promise<StudyKitDto> {
  const source = await StudyKit.findById(kitId).lean();
  if (!source) throw new HttpError(404, "Study kit not found");
  if (!source.isPublic) throw new HttpError(403, "Only public kits can be forked");
  if (String(source.userId) === userId) throw new HttpError(400, "You already own this kit");

  await assertKitQuota(userId);

  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const fork = await StudyKit.create({
    userId,
    title: `${source.title} (fork)`,
    description: source.description ?? "",
    sourceType: source.sourceType,
    language: source.language,
    isPublic: false,
    sharedDepartmentId: user.departmentId,
    originalKitId: source._id,
    flashcardCount: source.flashcardCount,
    quizQuestionCount: source.quizQuestionCount,
    hasSummary: source.hasSummary,
    hasGuide: source.hasGuide,
    sourceMeta: { ...source.sourceMeta },
  });

  const chunks = await AiContext.find({ studyKitId: source._id }).sort({ chunkIndex: 1 }).lean();
  if (chunks.length) {
    await AiContext.insertMany(
      chunks.map((c) => ({
        studyKitId: fork._id,
        departmentId: user.departmentId,
        courseCode: "",
        chunkText: c.chunkText,
        chunkIndex: c.chunkIndex,
      })),
    );
  }

  const cards = await Flashcard.find({ studyKitId: source._id }).lean();
  if (cards.length) {
    await Flashcard.insertMany(
      cards.map((c) => ({
        studyKitId: fork._id,
        userId,
        front: c.front,
        back: c.back,
        dueAt: new Date(),
        easeFactor: 2.5,
        intervalDays: 0,
        reps: 0,
        lapses: 0,
      })),
    );
  }

  const questions = await QuizQuestion.find({ studyKitId: source._id }).lean();
  if (questions.length) {
    await QuizQuestion.insertMany(
      questions.map((q) => ({
        studyKitId: fork._id,
        type: q.type,
        prompt: q.prompt,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      })),
    );
  }

  const summary = await Summary.findOne({ studyKitId: source._id }).lean();
  if (summary) {
    await Summary.create({
      studyKitId: fork._id,
      content: summary.content,
      language: summary.language,
    });
  }

  const guide = await StudyGuide.findOne({ studyKitId: source._id }).lean();
  if (guide) {
    await StudyGuide.create({
      studyKitId: fork._id,
      content: guide.content,
      language: guide.language,
    });
  }

  await StudyKit.updateOne({ _id: source._id }, { $inc: { forkCount: 1 } });

  return mapKit(fork.toObject());
}

export function planAllowsYoutube(plan: ReturnType<typeof resolveActivePlan>): boolean {
  return plan !== "free";
}

export function planAllowsPracticeTest(plan: ReturnType<typeof resolveActivePlan>): boolean {
  return plan !== "free";
}

// ensureMaterialDir used for kit pdf dirs — same layout as materials
export { ensureMaterialDir, humanFileSize, extractYoutubeVideoId };

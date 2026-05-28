import { Router } from "express";
import multer from "multer";
import { requireApprovedUser } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/http.js";
import {
  createStudyKitFromPdf,
  createStudyKitFromText,
  createStudyKitFromTopic,
  createStudyKitFromYoutube,
  deleteStudyKit,
  forkStudyKit,
  getStudyKit,
  listStudyKits,
  planAllowsPracticeTest,
  updateStudyKit,
} from "../services/study-kit.service.js";
import { generateFlashcards } from "../services/flashcard-generator.service.js";
import { generateQuizQuestions } from "../services/quiz-generator.service.js";
import { generateSummary } from "../services/summary.service.js";
import { exportStudyGuidePdf, generateStudyGuide } from "../services/study-guide.service.js";
import {
  Flashcard,
  QuizAttempt,
  QuizQuestion,
  Summary,
  StudyGuide,
  User,
} from "../models/index.js";
import { applyReview, type ReviewGrade } from "../services/spaced-repetition.service.js";
import { touchStreak, resolveActivePlan } from "../services/subscription.service.js";
import { HttpError } from "../utils/http.js";

export const studyKitsRouter = Router();

function kitId(req: { params: { id?: string | string[] } }): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0]! : String(id ?? "");
}

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new HttpError(400, "Only PDF files are supported"));
  },
});

function maybePdfUpload(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
) {
  if (req.is("multipart/form-data")) {
    return pdfUpload.single("file")(req, res, next);
  }
  next();
}

studyKitsRouter.post(
  "/",
  maybePdfUpload,
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const sourceType = String(req.body.sourceType ?? (req.file ? "pdf" : "text"));

    if (sourceType === "pdf") {
      if (!req.file) throw new HttpError(400, "PDF file is required");
      const kit = await createStudyKitFromPdf(user._id, {
        title: String(req.body.title ?? "Untitled kit"),
        description: req.body.description,
        language: req.body.language,
        isPublic: req.body.isPublic === "true" || req.body.isPublic === true,
        sharedDepartmentId: req.body.sharedDepartmentId,
        buffer: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      });
      await touchStreak(user._id);
      res.status(201).json(kit);
      return;
    }

    const body = req.body as Record<string, string | boolean>;
    const base = {
      title: String(body.title ?? "Untitled kit"),
      description: body.description as string | undefined,
      language: body.language as string | undefined,
      isPublic: body.isPublic === true || body.isPublic === "true",
      sharedDepartmentId: body.sharedDepartmentId as string | undefined,
    };

    let kit;
    if (sourceType === "text") {
      kit = await createStudyKitFromText(user._id, { ...base, text: String(body.text ?? "") });
    } else if (sourceType === "youtube") {
      kit = await createStudyKitFromYoutube(user._id, {
        ...base,
        url: String(body.url ?? ""),
      });
    } else if (sourceType === "topic") {
      kit = await createStudyKitFromTopic(user._id, {
        ...base,
        topic: String(body.topic ?? body.text ?? ""),
      });
    } else {
      throw new HttpError(400, "sourceType must be pdf, text, youtube, or topic");
    }

    await touchStreak(user._id);
    res.status(201).json(kit);
  }),
);

studyKitsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const publicOnly = req.query.public === "true";
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const kits = await listStudyKits(user._id, { publicOnly, q });
    res.json(kits);
  }),
);

studyKitsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const kit = await getStudyKit(user._id, kitId(req));
    res.json(kit);
  }),
);

studyKitsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const kit = await updateStudyKit(user._id, kitId(req), {
      title: req.body.title,
      description: req.body.description,
      isPublic: req.body.isPublic,
    });
    res.json(kit);
  }),
);

studyKitsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    await deleteStudyKit(user._id, kitId(req));
    res.status(204).end();
  }),
);

studyKitsRouter.post(
  "/:id/fork",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const kit = await forkStudyKit(user._id, kitId(req));
    await touchStreak(user._id);
    res.status(201).json(kit);
  }),
);

// --- Flashcards ---
studyKitsRouter.post(
  "/:id/flashcards/generate",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const count = Number(req.body.count ?? 20);
    const result = await generateFlashcards(user._id, kitId(req), count);
    await touchStreak(user._id);
    res.json(result);
  }),
);

studyKitsRouter.get(
  "/:id/flashcards",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    await getStudyKit(user._id, kitId(req));
    const cards = await Flashcard.find({ studyKitId: kitId(req), userId: user._id })
      .sort({ dueAt: 1 })
      .lean();
    res.json(
      cards.map((c) => ({
        id: String(c._id),
        front: c.front,
        back: c.back,
        dueAt: c.dueAt,
        easeFactor: c.easeFactor,
        intervalDays: c.intervalDays,
        reps: c.reps,
        lapses: c.lapses,
      })),
    );
  }),
);

studyKitsRouter.get(
  "/:id/flashcards/due",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    await getStudyKit(user._id, kitId(req));
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);
    const cards = await Flashcard.find({
      studyKitId: kitId(req),
      userId: user._id,
      dueAt: { $lte: endOfDay },
    })
      .sort({ dueAt: 1 })
      .limit(50)
      .lean();
    res.json({ count: cards.length, cards: cards.map((c) => ({ id: String(c._id), front: c.front, back: c.back })) });
  }),
);

studyKitsRouter.post(
  "/:id/flashcards/:cardId/review",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const grade = Number(req.body.grade) as ReviewGrade;
    if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
      throw new HttpError(400, "grade must be 0..5");
    }

    const card = await Flashcard.findOne({
      _id: req.params.cardId,
      studyKitId: kitId(req),
      userId: user._id,
    });
    if (!card) throw new HttpError(404, "Flashcard not found");

    applyReview(card, grade);
    await card.save();
    await touchStreak(user._id);

    res.json({
      id: String(card._id),
      dueAt: card.dueAt,
      intervalDays: card.intervalDays,
      reps: card.reps,
    });
  }),
);

// --- Quizzes ---
studyKitsRouter.post(
  "/:id/quizzes/generate",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const count = Number(req.body.count ?? 10);
    const difficulty = (req.body.difficulty ?? "medium") as "easy" | "medium" | "hard";
    const result = await generateQuizQuestions(user._id, kitId(req), count, difficulty);
    await touchStreak(user._id);
    res.json(result);
  }),
);

studyKitsRouter.get(
  "/:id/quizzes",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    await getStudyKit(user._id, kitId(req));
    const qs = await QuizQuestion.find({ studyKitId: kitId(req) }).lean();
    res.json(
      qs.map((q) => ({
        id: String(q._id),
        type: q.type,
        prompt: q.prompt,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        timesSeen: q.timesSeen,
        timesCorrect: q.timesCorrect,
      })),
    );
  }),
);

studyKitsRouter.post(
  "/:id/quizzes/attempt",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    await getStudyKit(user._id, kitId(req));

    const mode = (req.body.mode ?? "smart-study") as "smart-study" | "practice-test";
    const perQuestion = Array.isArray(req.body.perQuestion) ? req.body.perQuestion : [];
    const durationSec = Number(req.body.durationSec ?? 0);

    let correct = 0;
    for (const row of perQuestion) {
      const q = await QuizQuestion.findById(row.questionId);
      if (!q || String(q.studyKitId) !== kitId(req)) continue;
      const ok = normalizeAnswer(row.response) === normalizeAnswer(q.answer);
      if (ok) correct += 1;
      q.timesSeen = (q.timesSeen ?? 0) + 1;
      if (ok) q.timesCorrect = (q.timesCorrect ?? 0) + 1;
      await q.save();
    }

    const questionCount = perQuestion.length || 1;
    const score = Math.round((correct / questionCount) * 100);

    const attempt = await QuizAttempt.create({
      userId: user._id,
      studyKitId: kitId(req),
      mode,
      perQuestion: perQuestion.map((r: { questionId: string; response: string; correct?: boolean; durationMs?: number }) => ({
        questionId: r.questionId,
        response: String(r.response ?? ""),
        correct: Boolean(r.correct),
        durationMs: Number(r.durationMs ?? 0),
      })),
      score,
      correctCount: correct,
      questionCount,
      durationSec,
    });

    await touchStreak(user._id);
    res.status(201).json({
      id: String(attempt._id),
      score,
      correctCount: correct,
      questionCount,
    });
  }),
);

studyKitsRouter.get(
  "/:id/quizzes/attempts",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const attempts = await QuizAttempt.find({
      userId: user._id,
      studyKitId: kitId(req),
    })
      .sort({ completedAt: -1 })
      .limit(30)
      .lean();
    res.json(
      attempts.map((a) => ({
        id: String(a._id),
        mode: a.mode,
        score: a.score,
        correctCount: a.correctCount,
        questionCount: a.questionCount,
        durationSec: a.durationSec,
        completedAt: a.completedAt,
      })),
    );
  }),
);

studyKitsRouter.get(
  "/:id/quizzes/next",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    await getStudyKit(user._id, kitId(req));
    const qs = await QuizQuestion.find({ studyKitId: kitId(req) }).lean();
    if (!qs.length) throw new HttpError(404, "Generate quiz questions first");

    const scored = qs.map((q) => ({
      q,
      weight: (q.timesSeen ?? 0) - (q.timesCorrect ?? 0) + 1,
    }));
    scored.sort((a, b) => b.weight - a.weight);
    const pick = scored[0]!.q;

    res.json({
      id: String(pick._id),
      type: pick.type,
      prompt: pick.prompt,
      choices: pick.choices,
      difficulty: pick.difficulty,
    });
  }),
);

// --- Practice test (longer fixed set) ---
studyKitsRouter.post(
  "/:id/test/generate",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const u = await User.findById(user._id);
    const plan = resolveActivePlan(u!);
    if (!planAllowsPracticeTest(plan)) {
      throw new HttpError(403, "Practice tests require the Student or Premium plan");
    }
    const count = Number(req.body.count ?? 20);
    const result = await generateQuizQuestions(user._id, kitId(req), count, "hard");
    res.json(result);
  }),
);

// --- Summary ---
studyKitsRouter.post(
  "/:id/summary/generate",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const result = await generateSummary(user._id, kitId(req));
    await touchStreak(user._id);
    res.json(result);
  }),
);

studyKitsRouter.get(
  "/:id/summary",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    await getStudyKit(user._id, kitId(req));
    const doc = await Summary.findOne({ studyKitId: kitId(req) }).lean();
    if (!doc) throw new HttpError(404, "No summary yet — generate one first");
    res.json({ id: String(doc._id), content: doc.content, language: doc.language });
  }),
);

// --- Study guide ---
studyKitsRouter.post(
  "/:id/guide/generate",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const result = await generateStudyGuide(user._id, kitId(req));
    await touchStreak(user._id);
    res.json(result);
  }),
);

studyKitsRouter.get(
  "/:id/guide",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    await getStudyKit(user._id, kitId(req));
    const doc = await StudyGuide.findOne({ studyKitId: kitId(req) }).lean();
    if (!doc) throw new HttpError(404, "No study guide yet — generate one first");
    res.json({ id: String(doc._id), content: doc.content, language: doc.language });
  }),
);

studyKitsRouter.get(
  "/:id/guide/export",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const { buffer, filename } = await exportStudyGuidePdf(user._id, kitId(req));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }),
);

function normalizeAnswer(s: string): string {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

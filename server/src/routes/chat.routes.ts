import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireApprovedUser } from "../middleware/auth.middleware.js";
import { ask, askStream, getChatHistory, sendMessage } from "../services/chat.service.js";

export const chatRouter = Router();

chatRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await getChatHistory(requireApprovedUser(req)));
  }),
);

const messageSchema = z.object({
  message: z.string().min(1),
  materialId: z.string().optional(),
});

chatRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = messageSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    const user = requireApprovedUser(req);
    res.status(201).json(await sendMessage(user, body.data));
  }),
);

const askSchema = z.object({
  question: z.string().min(1),
  department: z.string().optional(),
  courseCode: z.string().optional(),
  materialId: z.string().optional(),
  stream: z.boolean().optional(),
});

chatRouter.post(
  "/ask",
  asyncHandler(async (req, res) => {
    const body = askSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    const user = requireApprovedUser(req);
    const wantsStream = body.data.stream || req.headers.accept?.includes("text/event-stream");

    if (wantsStream) {
      await askStream(user, body.data, req.ip ?? "", res);
      return;
    }

    const result = await ask(user, body.data, req.ip ?? "");
    res.json(result);
  }),
);

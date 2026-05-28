import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireUser } from "../middleware/user-context.js";
import { getChatHistory, sendMessage } from "../services/chat.service.js";

export const chatRouter = Router();

chatRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await getChatHistory(requireUser(req)));
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
    res.status(201).json(await sendMessage(requireUser(req), body.data));
  }),
);

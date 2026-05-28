import { Router } from "express";
import { requireApprovedUser } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/http.js";
import { fetchYoutubeTranscript } from "../services/youtube-transcript.service.js";
import { User } from "../models/index.js";
import { resolveActivePlan } from "../services/subscription.service.js";
import { planAllowsYoutube } from "../services/study-kit.service.js";
import { HttpError } from "../utils/http.js";

export const youtubeRouter = Router();

youtubeRouter.post(
  "/transcript",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const u = await User.findById(user._id);
    const plan = resolveActivePlan(u!);
    if (!planAllowsYoutube(plan)) {
      throw new HttpError(403, "YouTube import requires the Student or Premium plan");
    }

    const url = String(req.body.url ?? "");
    const result = await fetchYoutubeTranscript(url);
    res.json({
      videoId: result.videoId,
      language: result.language,
      transcript: result.transcript.slice(0, 8000),
      length: result.transcript.length,
    });
  }),
);

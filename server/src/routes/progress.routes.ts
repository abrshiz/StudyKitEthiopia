import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { requireApprovedUser } from "../middleware/user-context.js";
import { getProgressForUser } from "../services/progress.service.js";

export const progressRouter = Router();

progressRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    res.json(await getProgressForUser(user));
  }),
);

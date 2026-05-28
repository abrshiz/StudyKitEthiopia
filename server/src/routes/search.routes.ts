import { Router } from "express";
import { asyncHandler, HttpError } from "../utils/http.js";
import { globalSearch } from "../services/search.service.js";

export const searchRouter = Router();

searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    if (!q.trim()) throw new HttpError(400, "Query required");
    res.json(await globalSearch(q));
  }),
);

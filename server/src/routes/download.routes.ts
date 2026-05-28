import { Router } from "express";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireApprovedUser } from "../middleware/auth.middleware.js";
import { buildDownload } from "../services/download.service.js";

export const downloadRouter = Router();

downloadRouter.get(
  "/:materialId",
  asyncHandler(async (req, res) => {
    const id = String(req.params.materialId ?? "");
    if (!id) throw new HttpError(400, "Material id required");
    const user = requireApprovedUser(req);

    const result = await buildDownload(id, user, req.ip ?? "");

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(result.filename)}"`,
    );
    res.setHeader("X-Downloads-Left", String(result.downloadsLeft));
    res.setHeader("Cache-Control", "no-store");
    res.end(result.buffer);
  }),
);

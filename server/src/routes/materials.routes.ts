import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../utils/http.js";
import {
  createMaterial,
  deleteMaterial,
  getMaterial,
  listMaterials,
} from "../services/material.service.js";
import { materialUpload } from "../services/upload.service.js";
import { requireRole, requireUser } from "../middleware/auth.middleware.js";
import { AuditLog } from "../models/index.js";

export const materialsRouter = Router();

materialsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const year = typeof req.query.year === "string" ? req.query.year : undefined;
    const departmentId =
      typeof req.query.departmentId === "string" ? req.query.departmentId : undefined;
    const uploadedById =
      typeof req.query.uploadedById === "string" ? req.query.uploadedById : undefined;
    res.json(await listMaterials({ q, year, departmentId, uploadedById }));
  }),
);

materialsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "");
    if (!id) throw new HttpError(400, "Material id required");
    res.json(await getMaterial(id));
  }),
);

const createSchema = z.object({
  title: z.string().min(2),
  course: z.string().min(1),
  courseCode: z.string().default(""),
  semester: z.string().min(1),
  departmentId: z.string().min(1),
});

/**
 * Material upload — open to any authenticated user with the `professor`
 * role (users self-promote via `POST /auth/become-professor`).
 *
 * This stays around as the "shared library" producer; private study kits
 * are created via the StudyKit endpoints (see phase 2).
 */
materialsRouter.post(
  "/",
  requireRole("professor"),
  materialUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Missing file");

    const parsed = createSchema.safeParse({
      title: req.body?.title,
      course: req.body?.course,
      courseCode: req.body?.courseCode ?? "",
      semester: req.body?.semester,
      departmentId: req.body?.departmentId,
    });
    if (!parsed.success) throw new HttpError(400, parsed.error.message);

    const user = requireUser(req);

    const result = await createMaterial({
      ...parsed.data,
      uploadedById: user._id,
      file: {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        size: req.file.size,
      },
    });

    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      action: "upload",
      detail: `Uploaded "${result.material.title}" (${result.indexedChunks} chunks indexed)`,
      materialId: result.material.id,
      ip: req.ip ?? "",
    });

    res.status(201).json(result);
  }),
);

materialsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "");
    if (!id) throw new HttpError(400, "Material id required");

    const user = requireUser(req);
    const existing = await getMaterial(id);

    // Only the uploader can delete their material (no admin role any more).
    if (existing.uploadedById && existing.uploadedById !== user._id) {
      throw new HttpError(403, "You can only delete materials you uploaded");
    }

    await deleteMaterial(id);
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      action: "delete_material",
      detail: `Deleted material "${existing.title}"`,
      materialId: id,
      ip: req.ip ?? "",
    });
    res.status(204).end();
  }),
);

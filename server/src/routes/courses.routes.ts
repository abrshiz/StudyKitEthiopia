import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireRole, requireUser } from "../middleware/user-context.js";
import {
  createCourse,
  deleteCourse,
  listCourses,
  updateCourse,
} from "../services/course.service.js";

export const coursesRouter = Router();

coursesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    requireUser(req);
    const departmentId =
      typeof req.query.departmentId === "string" ? req.query.departmentId : undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const active = typeof req.query.active === "string" ? req.query.active === "true" : undefined;
    res.json(await listCourses({ departmentId, q, active }));
  }),
);

const createSchema = z.object({
  departmentId: z.string().min(1),
  code: z.string().min(3).max(32),
  title: z.string().min(3).max(200),
  year: z.number().int().min(1).max(7).optional(),
  semester: z.string().min(3).max(32).optional(),
  credits: z.number().min(0).max(30).optional(),
  active: z.boolean().optional(),
});

const requireProfessor = requireRole("professor");

coursesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    requireProfessor(req);
    const body = createSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    res.status(201).json(await createCourse(body.data));
  }),
);

const updateSchema = createSchema
  .omit({ departmentId: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

coursesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    requireProfessor(req);
    const id = String(req.params.id ?? "");
    if (!id) throw new HttpError(400, "Course id required");
    const body = updateSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    res.json(await updateCourse(id, body.data));
  }),
);

coursesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    requireProfessor(req);
    const id = String(req.params.id ?? "");
    if (!id) throw new HttpError(400, "Course id required");
    res.json(await deleteCourse(id));
  }),
);

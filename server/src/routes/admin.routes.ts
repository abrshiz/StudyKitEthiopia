import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireAdmin } from "../middleware/auth.middleware.js";
import {
  approveUser,
  broadcastNotification,
  getAdminAnalytics,
  getAdminDashboard,
  listPendingUsers,
  promoteToProfessor,
  rejectUser,
} from "../services/admin.service.js";

export const adminRouter = Router();

adminRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    res.json(await getAdminDashboard());
  }),
);

adminRouter.get(
  "/pending-users",
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    res.json(await listPendingUsers());
  }),
);

adminRouter.patch(
  "/users/:id/approve",
  asyncHandler(async (req, res) => {
    const admin = requireAdmin(req);
    res.json(await approveUser(admin, String(req.params.id)));
  }),
);

adminRouter.patch(
  "/users/:id/reject",
  asyncHandler(async (req, res) => {
    const admin = requireAdmin(req);
    res.json(await rejectUser(admin, String(req.params.id)));
  }),
);

const promoteSchema = z.object({ departmentId: z.string().min(1) });

adminRouter.patch(
  "/users/:id/promote-professor",
  asyncHandler(async (req, res) => {
    const admin = requireAdmin(req);
    const body = promoteSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    res.json(await promoteToProfessor(admin, String(req.params.id), body.data.departmentId));
  }),
);

adminRouter.get(
  "/analytics",
  asyncHandler(async (req, res) => {
    const admin = requireAdmin(req);
    const days = Number(req.query.days ?? 30);
    res.json(await getAdminAnalytics(admin, { days }));
  }),
);

const broadcastSchema = z.object({
  subject: z.string().min(2),
  body: z.string().min(2),
  audience: z
    .object({
      role: z.enum(["student", "professor", "admin", "all"]).optional(),
      departmentId: z.string().optional(),
    })
    .default({}),
  channels: z
    .object({
      email: z.boolean().default(false),
      inApp: z.boolean().default(true),
    })
    .default({ email: false, inApp: true }),
});

adminRouter.post(
  "/broadcast",
  asyncHandler(async (req, res) => {
    const admin = requireAdmin(req);
    const body = broadcastSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    res.json(await broadcastNotification(admin, body.data));
  }),
);

import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { requireAdmin } from "../middleware/user-context.js";
import {
  approveUser,
  getAdminDashboard,
  listPendingUsers,
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
    const admin = requireAdmin(req);
    void admin;
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

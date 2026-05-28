import { Router } from "express";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { getAdminAnalytics } from "../services/admin.service.js";

export const professorRouter = Router();

professorRouter.get(
  "/analytics",
  asyncHandler(async (req, res) => {
    const user = requireRole("professor", "admin")(req);
    const departmentId =
      user.role === "professor" ? user.professorDepartmentId : undefined;
    if (user.role === "professor" && !departmentId) {
      throw new HttpError(403, "Professor not assigned to a department");
    }
    const days = Number(req.query.days ?? 30);
    res.json(
      await getAdminAnalytics(user, {
        days,
        departmentId: departmentId ?? undefined,
      }),
    );
  }),
);

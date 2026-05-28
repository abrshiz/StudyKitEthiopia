import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { listDepartments } from "../services/department.service.js";

export const departmentsRouter = Router();

departmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const college = typeof req.query.college === "string" ? req.query.college : undefined;
    res.json(await listDepartments({ q, college }));
  }),
);

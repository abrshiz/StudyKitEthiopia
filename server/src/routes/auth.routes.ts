import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireApprovedUser, requireUser } from "../middleware/user-context.js";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  setUserDepartment,
} from "../services/auth.service.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    res.status(201).json(await registerUser(body.data));
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    res.json(await loginUser(body.data.email, body.data.password));
  }),
);

const departmentSchema = z.object({
  departmentId: z.string().min(1),
});

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const session = requireUser(req);
    res.json(await getCurrentUser(session.email));
  }),
);

authRouter.patch(
  "/department",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const body = departmentSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    res.json(await setUserDepartment(user.email, body.data.departmentId));
  }),
);

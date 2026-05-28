import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireApprovedUser, requireUser } from "../middleware/auth.middleware.js";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  setUserDepartment,
  upsertOAuthUser,
} from "../services/auth.service.js";
import {
  clearSessionCookie,
  setSessionCookie,
  signSessionToken,
} from "../services/jwt.service.js";
import {
  buildAuthorizeUrl,
  exchangeCodeForProfile,
  isMicrosoftConfigured,
} from "../services/microsoft-oauth.service.js";
import { AuditLog } from "../models/index.js";

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
    const user = await registerUser(body.data);
    res.status(201).json(user);
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    const user = await loginUser(body.data.email, body.data.password);
    const token = signSessionToken({
      sub: user._id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
    });
    setSessionCookie(res, token);
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      action: "login",
      detail: "Credentials login",
      ip: req.ip ?? "",
    });
    res.json(user);
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearSessionCookie(res);
    res.status(204).end();
  }),
);

const departmentSchema = z.object({
  departmentId: z.string().min(1),
});

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const session = requireUser(req);
    res.json(await getCurrentUser(session._id));
  }),
);

authRouter.patch(
  "/department",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const body = departmentSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    res.json(await setUserDepartment(user._id, body.data.departmentId));
  }),
);

/* ---------------------------------------------------------------------------
 * Microsoft OAuth
 * ------------------------------------------------------------------------- */

const OAUTH_STATE_COOKIE = "sk_ms_state";

authRouter.get(
  "/microsoft",
  asyncHandler(async (_req, res) => {
    if (!isMicrosoftConfigured()) {
      throw new HttpError(503, "Microsoft sign-in is not configured");
    }
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.cookieSecure,
      maxAge: 5 * 60 * 1000,
      path: "/",
    });
    res.redirect(buildAuthorizeUrl(state));
  }),
);

authRouter.get(
  "/microsoft/callback",
  asyncHandler(async (req, res) => {
    const state = String(req.query.state ?? "");
    const cookieState = (req as typeof req & { cookies?: Record<string, string> }).cookies?.[
      OAUTH_STATE_COOKIE
    ];
    if (!state || !cookieState || state !== cookieState) {
      throw new HttpError(400, "Invalid OAuth state");
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });

    const code = String(req.query.code ?? "");
    if (!code) {
      const error = String(req.query.error_description ?? req.query.error ?? "missing code");
      return res.redirect(
        `${env.publicAppUrl}/login?microsoft=error&reason=${encodeURIComponent(error)}`,
      );
    }

    const profile = await exchangeCodeForProfile(code);
    const user = await upsertOAuthUser(profile);
    const token = signSessionToken({
      sub: user._id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
    });
    setSessionCookie(res, token);
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      action: "login",
      detail: "Microsoft OAuth login",
      ip: req.ip ?? "",
    });

    const target =
      user.approvalStatus === "pending" ? "/pending-approval" : "/dashboard";
    res.redirect(`${env.publicAppUrl}${target}?microsoft=success`);
  }),
);

authRouter.get("/microsoft/status", (_req, res) => {
  res.json({ configured: isMicrosoftConfigured() });
});

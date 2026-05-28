import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { User } from "../models/index.js";
import { HttpError } from "../utils/http.js";
import { verifySessionToken } from "../services/jwt.service.js";

export type AppRole = "student" | "professor";

export type RequestUser = {
  _id: string;
  email: string;
  name: string;
  role: AppRole;
  departmentId: string | null;
};

export type RequestWithUser = Request & { currentUser?: RequestUser };

/**
 * Reads JWT from the cookie or `Authorization: Bearer …` header and hydrates
 * `req.currentUser` from the database. Never throws — guard middleware below
 * does the gating so public endpoints stay public.
 */
export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readToken(req);
    if (!token) return next();

    const payload = verifySessionToken(token);
    const user = await User.findById(payload.sub).lean();
    if (!user) return next();

    (req as RequestWithUser).currentUser = {
      _id: String(user._id),
      email: user.email,
      name: user.name,
      role: (user.role === "professor" ? "professor" : "student") as AppRole,
      departmentId: user.departmentId ? String(user.departmentId) : null,
    };
    next();
  } catch {
    next();
  }
}

function readToken(req: Request): string | null {
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.[
    env.cookieName
  ];
  if (cookieToken) return cookieToken;
  const header = req.header("authorization") ?? req.header("Authorization");
  if (header && header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return null;
}

export function requireUser(req: Request): RequestUser {
  const user = (req as RequestWithUser).currentUser;
  if (!user) throw new HttpError(401, "Sign in required");
  return user;
}

/**
 * Approval gating was removed in the Thea pivot — every authenticated user is
 * "approved" by definition. The alias stays so existing call sites keep
 * working without churn.
 */
export const requireApprovedUser = requireUser;

export function requireRole(...roles: AppRole[]) {
  return (req: Request): RequestUser => {
    const user = requireUser(req);
    if (!roles.includes(user.role)) {
      throw new HttpError(403, `Requires role: ${roles.join(", ")}`);
    }
    return user;
  };
}

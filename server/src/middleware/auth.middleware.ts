import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { User } from "../models/index.js";
import { HttpError } from "../utils/http.js";
import { verifySessionToken } from "../services/jwt.service.js";

export type AppRole = "student" | "professor" | "admin";

export type RequestUser = {
  _id: string;
  email: string;
  name: string;
  role: AppRole;
  approvalStatus: "pending" | "approved" | "rejected";
  departmentId: string | null;
  professorDepartmentId: string | null;
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
      role: user.role as AppRole,
      approvalStatus: (user.approvalStatus ?? "pending") as RequestUser["approvalStatus"],
      departmentId: user.departmentId ? String(user.departmentId) : null,
      professorDepartmentId: user.professorDepartmentId
        ? String(user.professorDepartmentId)
        : null,
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

export function requireApprovedUser(req: Request): RequestUser {
  const user = requireUser(req);
  if (user.approvalStatus === "pending") {
    throw new HttpError(403, "Account pending admin approval");
  }
  if (user.approvalStatus === "rejected") {
    throw new HttpError(403, "Account not approved");
  }
  return user;
}

export function requireAdmin(req: Request): RequestUser {
  const user = requireUser(req);
  if (user.role !== "admin") throw new HttpError(403, "Admin access required");
  return user;
}

export function requireRole(...roles: AppRole[]) {
  return (req: Request): RequestUser => {
    const user = requireApprovedUser(req);
    if (!roles.includes(user.role)) {
      throw new HttpError(403, `Requires role: ${roles.join(", ")}`);
    }
    return user;
  };
}

/**
 * Returns the current user if they are an admin (any department) or a
 * professor scoped to the given department. Throws otherwise.
 */
export function requireProfessorOfDepartment(
  req: Request,
  departmentId: string | null | undefined,
): RequestUser {
  const user = requireApprovedUser(req);
  if (user.role === "admin") return user;
  if (user.role !== "professor") {
    throw new HttpError(403, "Professor or admin access required");
  }
  if (!user.professorDepartmentId) {
    throw new HttpError(403, "Professor is not assigned to a department");
  }
  if (!departmentId) {
    throw new HttpError(400, "Department is required");
  }
  if (user.professorDepartmentId !== String(departmentId)) {
    throw new HttpError(403, "Professor can only act on their assigned department");
  }
  return user;
}

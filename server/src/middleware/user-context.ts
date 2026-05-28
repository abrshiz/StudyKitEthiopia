import type { Request, Response, NextFunction } from "express";
import { User } from "../models/index.js";
import { HttpError } from "../utils/http.js";

export type RequestUser = {
  _id: string;
  email: string;
  name: string;
  role: "student" | "professor" | "admin";
  approvalStatus: "pending" | "approved" | "rejected";
};

declare global {
  namespace Express {
    interface Request {
      currentUser?: RequestUser;
    }
  }
}

/** Identifies user by email header (matches frontend session — no JWT). */
export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  const email = req.header("X-User-Email")?.trim().toLowerCase();
  if (!email) return next();

  const user = await User.findOne({ email }).lean();
  if (!user) return next();

  req.currentUser = {
    _id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role as RequestUser["role"],
    approvalStatus: (user.approvalStatus ?? "approved") as RequestUser["approvalStatus"],
  };
  next();
}

export function requireUser(req: Request) {
  if (!req.currentUser) throw new HttpError(401, "Sign in required");
  return req.currentUser;
}

export function requireApprovedUser(req: Request) {
  const user = requireUser(req);
  if (user.approvalStatus === "pending") {
    throw new HttpError(403, "Account pending admin approval");
  }
  if (user.approvalStatus === "rejected") {
    throw new HttpError(403, "Account not approved");
  }
  return user;
}

export function requireAdmin(req: Request) {
  const user = requireUser(req);
  if (user.role !== "admin") throw new HttpError(403, "Admin access required");
  return user;
}

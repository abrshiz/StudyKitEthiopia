import jwt from "jsonwebtoken";
import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export type SessionPayload = {
  sub: string;
  email: string;
  role: "student" | "professor" | "admin";
  approvalStatus: "pending" | "approved" | "rejected";
};

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtTtlSeconds,
    algorithm: "HS256",
  });
}

export function verifySessionToken(token: string): SessionPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    if (typeof decoded !== "object" || !decoded || !("sub" in decoded)) {
      throw new HttpError(401, "Invalid session");
    }
    return decoded as SessionPayload;
  } catch {
    throw new HttpError(401, "Session expired or invalid");
  }
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: env.cookieSecure ? "none" : "lax",
    secure: env.cookieSecure,
    maxAge: env.jwtTtlSeconds * 1000,
    path: "/",
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
  };
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(env.cookieName, token, cookieOptions());
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(env.cookieName, {
    ...cookieOptions(),
    maxAge: 0,
  });
}

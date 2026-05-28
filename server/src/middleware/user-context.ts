/**
 * Backwards-compatible re-export. The real implementation lives in
 * `auth.middleware.ts` and is JWT-based (cookie or `Authorization: Bearer …`).
 */
export {
  loadUser,
  requireUser,
  requireApprovedUser,
  requireRole,
  type AppRole,
  type RequestUser,
  type RequestWithUser,
} from "./auth.middleware.js";

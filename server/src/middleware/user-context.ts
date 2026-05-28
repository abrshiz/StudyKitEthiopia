/**
 * Backwards-compatible re-export. The real implementation now lives in
 * `auth.middleware.ts` and is JWT-based (cookie or `Authorization: Bearer …`).
 */
export {
  loadUser,
  requireUser,
  requireApprovedUser,
  requireAdmin,
  requireRole,
  requireProfessorOfDepartment,
  type AppRole,
  type RequestUser,
  type RequestWithUser,
} from "./auth.middleware.js";

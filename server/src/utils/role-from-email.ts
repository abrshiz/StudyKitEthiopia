import type { UserDocument } from "../models/User.js";

export type AppRole = UserDocument["role"];

/**
 * Every signup is a `student` by default. The previous heuristic that
 * promoted certain email patterns to `professor` / `admin` is gone — users
 * now explicitly opt-in to the professor role via `POST /auth/become-professor`
 * (admin role no longer exists).
 *
 * The function survives so legacy call sites keep compiling, but it is now
 * a constant.
 */
export function detectRoleFromEmail(_email: string): AppRole {
  return "student";
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "professor":
      return "Lecturer / Professor";
    default:
      return "Student";
  }
}

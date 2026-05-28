import type { StoredUser } from "@/lib/session";

/**
 * Post-login destination. With approval-gating removed and `student` being
 * the default role, the only remaining branch is the department-picker for
 * users who haven't chosen one yet.
 */
export function getPostLoginPath(
  _user: StoredUser,
  hasDepartment: boolean,
): "/departments" | "/dashboard" {
  if (!hasDepartment) return "/departments";
  return "/dashboard";
}

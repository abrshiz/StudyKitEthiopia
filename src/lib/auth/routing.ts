import type { StoredUser } from "@/lib/session";
import { resolveUserRole } from "./role-from-email";

export function getPostLoginPath(
  user: StoredUser,
  hasDepartment: boolean,
): "/pending-approval" | "/departments" | "/dashboard" {
  if (user.approvalStatus === "pending") return "/pending-approval";
  if (resolveUserRole(user) === "student" && !hasDepartment) return "/departments";
  return "/dashboard";
}

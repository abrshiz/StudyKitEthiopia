import type { StoredUser } from "@/lib/session";

/**
 * Every signup is a `student` by default. The admin role no longer exists
 * and professor is something the user explicitly opts into — there is no
 * heuristic that promotes accounts based on the email any more.
 */
export function detectRoleFromEmail(_email: string): StoredUser["role"] {
  return "student";
}

export function roleLabel(role: StoredUser["role"]): string {
  return role === "professor" ? "Lecturer / Professor" : "Student";
}

export function describeRoleFromEmail(email: string): string {
  return roleLabel(detectRoleFromEmail(email));
}

/** Prefer stored role from API; fall back to "student". */
export function resolveUserRole(user: {
  email: string;
  role?: StoredUser["role"];
}): StoredUser["role"] {
  return user.role === "professor" ? "professor" : "student";
}

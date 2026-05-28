import type { StoredUser } from "@/lib/session";

/** Mirrors server logic — role is inferred from university email, never chosen manually. */
export function detectRoleFromEmail(email: string): StoredUser["role"] {
  const normalized = email.trim().toLowerCase();
  const [local = "", domain = ""] = normalized.split("@");

  if (!local || !domain) return "student";

  if (
    /^(admin|registrar|sysadmin|studykit|it-support|itsupport)([._-]|$)/.test(local) ||
    local === "admin" ||
    domain.startsWith("admin.") ||
    domain.includes(".admin.")
  ) {
    return "admin";
  }

  if (
    /^(prof|professor|lecturer|faculty|teacher|staff|dr|instructor)([._-]|$)/.test(local) ||
    domain.startsWith("staff.") ||
    domain.startsWith("faculty.") ||
    domain.includes(".staff.") ||
    domain.includes(".faculty.")
  ) {
    return "professor";
  }

  return "student";
}

export function roleLabel(role: StoredUser["role"]): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "professor":
      return "Lecturer / Professor";
    default:
      return "Student";
  }
}

export function describeRoleFromEmail(email: string): string {
  return roleLabel(detectRoleFromEmail(email));
}

/** Prefer stored role from API; fall back to email pattern. */
export function resolveUserRole(user: {
  email: string;
  role?: StoredUser["role"];
}): StoredUser["role"] {
  return user.role ?? detectRoleFromEmail(user.email);
}

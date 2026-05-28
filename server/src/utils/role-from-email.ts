import type { UserDocument } from "../models/User.js";

export type AppRole = UserDocument["role"];

/** Infer role from Ethiopian university email patterns (no manual selection). */
export function detectRoleFromEmail(email: string): AppRole {
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

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "professor":
      return "Lecturer / Professor";
    default:
      return "Student";
  }
}

import { redirect } from "@tanstack/react-router";
import { getSelectedDepartment, getUser, type StoredUser } from "@/lib/session";
import { resolveUserRole } from "./role-from-email";
import { getPostLoginPath } from "./routing";

function isBrowser() {
  return typeof window !== "undefined";
}

export function requireGuest() {
  if (!isBrowser()) return;
  const user = getUser();
  if (!user) return;
  const dept = getSelectedDepartment();
  throw redirect({ to: getPostLoginPath(user, Boolean(dept)) });
}

/** Returns null during SSR — run auth checks in beforeLoad only on the client. */
export function requireUser(): StoredUser | null {
  if (!isBrowser()) return null;
  const user = getUser();
  if (!user) {
    throw redirect({ to: "/login" });
  }
  return user;
}

export function requireApprovedUser(): StoredUser | null {
  if (!isBrowser()) return null;
  const user = requireUser();
  if (!user) return null;
  if (user.approvalStatus === "pending") {
    throw redirect({ to: "/pending-approval" });
  }
  if (user.approvalStatus === "rejected") {
    throw redirect({ to: "/login" });
  }
  return user;
}

export function requireStudentDepartment() {
  const user = requireApprovedUser();
  if (!user) return null;
  if (resolveUserRole(user) !== "student") return null;

  const department = getSelectedDepartment();
  if (!department) {
    throw redirect({ to: "/departments" });
  }
  return department;
}

/** @deprecated Use requireStudentDepartment for student-only routes */
export function requireDepartment() {
  return requireStudentDepartment();
}

export function requireAdmin() {
  const user = requireApprovedUser();
  if (!user) return null;
  if (resolveUserRole(user) !== "admin") {
    throw redirect({ to: "/dashboard" });
  }
  return user;
}

export function requireProfessor() {
  const user = requireApprovedUser();
  if (!user) return null;
  if (resolveUserRole(user) !== "professor") {
    throw redirect({ to: "/dashboard" });
  }
  return user;
}

export function requireStudent() {
  const user = requireApprovedUser();
  if (!user) return null;
  if (resolveUserRole(user) !== "student") {
    throw redirect({ to: "/dashboard" });
  }
  return user;
}

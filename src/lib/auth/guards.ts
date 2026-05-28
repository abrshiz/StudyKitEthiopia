import { redirect } from "@tanstack/react-router";
import { getSelectedDepartment, getUser, type StoredUser } from "@/lib/session";
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

/**
 * Backwards-compatible alias — approval gating is gone, every signed-in user
 * is "approved" by definition.
 */
export const requireApprovedUser = requireUser;

export function requireStudentDepartment() {
  const user = requireUser();
  if (!user) return null;

  const department = getSelectedDepartment();
  if (!department) {
    throw redirect({ to: "/departments" });
  }
  return department;
}

/** @deprecated kept so legacy call sites compile */
export const requireDepartment = requireStudentDepartment;

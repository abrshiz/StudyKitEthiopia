import { detectRoleFromEmail, roleLabel } from "@/lib/auth/role-from-email";

const DEPARTMENT_KEY = "studykit:department";
const USER_KEY = "studykit:user";
const DOWNLOADS_KEY = "studykit:downloads-today";

export type StoredDepartment = {
  id: string;
  name: string;
  college: string;
};

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type StoredUser = {
  name: string;
  email: string;
  role: "student" | "professor" | "admin";
  roleLabel?: string;
  approvalStatus: ApprovalStatus;
  year?: string;
  university?: string;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function getSelectedDepartment(): StoredDepartment | null {
  return readJson<StoredDepartment>(DEPARTMENT_KEY);
}

export function setSelectedDepartment(dept: StoredDepartment): void {
  writeJson(DEPARTMENT_KEY, dept);
}

export function clearSelectedDepartment(): void {
  sessionStorage.removeItem(DEPARTMENT_KEY);
}

/** Normalize legacy session objects (missing role / approvalStatus). */
export function normalizeStoredUser(
  raw: Partial<StoredUser> & Pick<StoredUser, "name" | "email">,
): StoredUser {
  const role = raw.role ?? detectRoleFromEmail(raw.email);
  return {
    name: raw.name,
    email: raw.email,
    role,
    roleLabel: raw.roleLabel ?? roleLabel(role),
    approvalStatus: raw.approvalStatus ?? "approved",
    year: raw.year,
    university: raw.university,
  };
}

export function getUser(): StoredUser | null {
  const raw = readJson<StoredUser>(USER_KEY);
  if (!raw?.email || !raw?.name) return null;
  return normalizeStoredUser(raw);
}

export function setUser(user: StoredUser): void {
  writeJson(USER_KEY, normalizeStoredUser(user));
}

export function clearUser(): void {
  sessionStorage.removeItem(USER_KEY);
}

export function clearSession(): void {
  clearSelectedDepartment();
  clearUser();
}

export function getDownloadsUsedToday(): number {
  if (typeof window === "undefined") return 0;
  const raw = sessionStorage.getItem(DOWNLOADS_KEY);
  return raw ? Number.parseInt(raw, 10) || 0 : 0;
}

export function incrementDownloads(): number {
  const next = getDownloadsUsedToday() + 1;
  sessionStorage.setItem(DOWNLOADS_KEY, String(next));
  return next;
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

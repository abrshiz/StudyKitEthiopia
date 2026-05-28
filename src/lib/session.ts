import { roleLabel } from "@/lib/auth/role-from-email";

const DEPARTMENT_KEY = "studykit:department";
const USER_KEY = "studykit:user";

export type StoredDepartment = {
  id: string;
  name: string;
  college: string;
};

export type StoredSubscription = {
  plan: "free" | "student" | "premium";
  expiryDate: string | null;
  kitsCreatedThisMonth: number;
  monthlyResetAt: string | null;
  streakDays: number;
  lastActiveDate: string | null;
};

export type StoredUser = {
  id?: string;
  name: string;
  email: string;
  role: "student" | "professor";
  roleLabel?: string;
  year?: string;
  university?: string;
  badges?: string[];
  subscription?: StoredSubscription;
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

/** Normalize legacy session objects to the current shape. */
export function normalizeStoredUser(
  raw: Partial<StoredUser> & Pick<StoredUser, "name" | "email">,
): StoredUser {
  const role: StoredUser["role"] = raw.role === "professor" ? "professor" : "student";
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role,
    roleLabel: raw.roleLabel ?? roleLabel(role),
    year: raw.year,
    university: raw.university,
    badges: raw.badges ?? [],
    subscription: raw.subscription,
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

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

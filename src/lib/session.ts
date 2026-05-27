const DEPARTMENT_KEY = "studykit:department";

export type StoredDepartment = {
  id: string;
  name: string;
  college: string;
};

export function getSelectedDepartment(): StoredDepartment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEPARTMENT_KEY);
    return raw ? (JSON.parse(raw) as StoredDepartment) : null;
  } catch {
    return null;
  }
}

export function setSelectedDepartment(dept: StoredDepartment): void {
  sessionStorage.setItem(DEPARTMENT_KEY, JSON.stringify(dept));
}

export function clearSelectedDepartment(): void {
  sessionStorage.removeItem(DEPARTMENT_KEY);
}

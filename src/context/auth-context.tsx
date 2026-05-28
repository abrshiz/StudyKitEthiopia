import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchCurrentUser, logoutFromApi, saveDepartmentToApi } from "@/lib/api/auth";
import { isApiConfigured } from "@/lib/api/client";
import {
  clearSession,
  getSelectedDepartment,
  getUser,
  normalizeStoredUser,
  setSelectedDepartment,
  setUser,
  type StoredDepartment,
  type StoredUser,
} from "@/lib/session";

type AuthContextValue = {
  user: StoredUser | null;
  department: StoredDepartment | null;
  isAuthenticated: boolean;
  hasDepartment: boolean;
  signIn: (user: StoredUser, department?: StoredDepartment | null) => void;
  signOut: () => void;
  setDepartment: (dept: StoredDepartment) => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [department, setDepartmentState] = useState<StoredDepartment | null>(null);

  const refresh = useCallback(() => {
    setUserState(getUser());
    setDepartmentState(getSelectedDepartment());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isApiConfigured()) return;

    void fetchCurrentUser()
      .then((fresh) => {
        const normalized = normalizeStoredUser({
          ...fresh,
          role: fresh.role,
        });
        setUser(normalized);
        setUserState(normalized);
        const dept = fresh.department ?? getSelectedDepartment();
        if (dept) {
          setSelectedDepartment(dept);
          setDepartmentState(dept);
        }
      })
      .catch(() => {
        /* not signed in (or API down) — nothing to do */
      });
  }, []);

  const signIn = useCallback((next: StoredUser, dept?: StoredDepartment | null) => {
    const user = normalizeStoredUser(next);
    setUser(user);
    setUserState(user);
    if (dept) {
      setSelectedDepartment(dept);
      setDepartmentState(dept);
    }
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUserState(null);
    setDepartmentState(null);
    if (isApiConfigured()) {
      void logoutFromApi().catch(() => {
        /* cookie may already be gone */
      });
    }
  }, []);

  const setDepartment = useCallback((dept: StoredDepartment) => {
    setSelectedDepartment(dept);
    setDepartmentState(dept);
    if (isApiConfigured()) {
      void saveDepartmentToApi(dept.id).catch(() => {
        /* session still works locally */
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        department,
        isAuthenticated: Boolean(user),
        hasDepartment: Boolean(department),
        signIn,
        signOut,
        setDepartment,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

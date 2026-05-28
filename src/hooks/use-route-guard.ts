import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getPostLoginPath } from "@/lib/auth/routing";
import { resolveUserRole } from "@/lib/auth/role-from-email";
import { getSelectedDepartment, getUser } from "@/lib/session";

export type RouteGuardOptions = {
  /** Only for login/register — send signed-in users away */
  guestOnly?: boolean;
  /** Must be signed in */
  requireAuth?: boolean;
  /** Must be approved (not pending/rejected) */
  requireApproved?: boolean;
  /** If set, only these roles may view the page */
  allowedRoles?: Array<"student" | "professor" | "admin">;
  /** Students must have picked a department */
  requireStudentDepartment?: boolean;
};

/**
 * Client-only route protection (sessionStorage). Avoids beforeLoad + SSR crashes.
 */
export function useRouteGuard(options: RouteGuardOptions): boolean {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getUser();

    if (options.guestOnly) {
      if (user) {
        navigate({
          to: getPostLoginPath(user, Boolean(getSelectedDepartment())),
          replace: true,
        });
        return;
      }
      setReady(true);
      return;
    }

    if (options.requireAuth || options.requireApproved || options.allowedRoles) {
      if (!user) {
        navigate({ to: "/login", replace: true });
        return;
      }
    }

    if (options.requireApproved && user) {
      if (user.approvalStatus === "pending") {
        navigate({ to: "/pending-approval", replace: true });
        return;
      }
      if (user.approvalStatus === "rejected") {
        navigate({ to: "/login", replace: true });
        return;
      }
    }

    if (user && options.allowedRoles?.length) {
      const role = resolveUserRole(user);
      if (!options.allowedRoles.includes(role)) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
    }

    if (options.requireStudentDepartment && user) {
      if (resolveUserRole(user) === "student" && !getSelectedDepartment()) {
        navigate({ to: "/departments", replace: true });
        return;
      }
    }

    setReady(true);
  }, [
    navigate,
    options.guestOnly,
    options.requireAuth,
    options.requireApproved,
    options.requireStudentDepartment,
    options.allowedRoles?.join(","),
  ]);

  return ready;
}

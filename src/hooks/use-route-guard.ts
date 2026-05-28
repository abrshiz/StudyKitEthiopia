import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getPostLoginPath } from "@/lib/auth/routing";
import { getSelectedDepartment, getUser } from "@/lib/session";

export type RouteGuardOptions = {
  /** Only for login/register — send signed-in users away */
  guestOnly?: boolean;
  /** Must be signed in */
  requireAuth?: boolean;
  /** @deprecated approval gating was removed; alias of requireAuth */
  requireApproved?: boolean;
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

    if (options.requireAuth || options.requireApproved) {
      if (!user) {
        navigate({ to: "/login", replace: true });
        return;
      }
    }

    if (options.requireStudentDepartment && user && !getSelectedDepartment()) {
      navigate({ to: "/departments", replace: true });
      return;
    }

    setReady(true);
  }, [
    navigate,
    options.guestOnly,
    options.requireAuth,
    options.requireApproved,
    options.requireStudentDepartment,
  ]);

  return ready;
}

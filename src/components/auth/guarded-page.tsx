import { ApiLoading } from "@/components/shared/api-state";
import { useRouteGuard, type RouteGuardOptions } from "@/hooks/use-route-guard";

export function GuardedPage({
  guard,
  children,
}: {
  guard: RouteGuardOptions;
  children: React.ReactNode;
}) {
  const ready = useRouteGuard(guard);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <ApiLoading label="Loading" />
      </div>
    );
  }

  return children;
}

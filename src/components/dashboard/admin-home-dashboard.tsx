import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import {
  ApiErrorState,
  ApiLoading,
  ApiNotConfigured,
  ApiEmpty,
  DataBoundary,
} from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { resolveUserRole } from "@/lib/auth/role-from-email";
import { useAdminDashboard } from "@/hooks/use-admin";
import { useApproveUser, usePendingUsers, useRejectUser } from "@/hooks/use-pending-users";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import { Shield, UserCheck, UserX, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function AdminHomeDashboard() {
  const { user } = useAuth();
  const isAdmin = user ? resolveUserRole(user) === "admin" : false;
  const pending = usePendingUsers(isAdmin && isApiConfigured());
  const dashboard = useAdminDashboard(isAdmin && isApiConfigured());
  const approve = useApproveUser();
  const reject = useRejectUser();

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
        <h3 className="font-semibold">Admin access required</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Signed in as <strong>{user?.roleLabel ?? user?.role}</strong>. Use an admin university
          email (e.g. <code className="text-xs bg-muted px-1 rounded">admin@aau.edu.et</code>) or
          sign out and sign in again.
        </p>
        <Link to="/login" className="inline-block mt-4">
          <Button variant="outline">Switch account</Button>
        </Link>
      </Card>
    );
  }

  async function handleApprove(id: string, name: string) {
    try {
      await approve.mutateAsync(id);
      toast.success(`${name} approved`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not approve user";
      toast.error(msg);
    }
  }

  async function handleReject(id: string, name: string) {
    try {
      await reject.mutateAsync(id);
      toast.success(`${name} rejected`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not reject user";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin overview"
        description="Approve registrations, monitor platform health, and manage content."
      >
        <Badge className="gap-1">
          <Shield className="h-3 w-3" />
          Administrator
        </Badge>
      </PageHeader>

      {!isApiConfigured() ? (
        <ApiNotConfigured resource="Admin dashboard" />
      ) : (
        <>
          <Card className="p-5 border-primary/25 bg-primary/5">
            <h2 className="font-semibold flex items-center gap-2">
              Pending approvals
              {(pending.data?.length ?? 0) > 0 && (
                <Badge variant="destructive">{pending.data!.length}</Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              New .edu.et registrations wait here until you approve them.
            </p>

            <DataBoundary
              resource="Pending users"
              isLoading={pending.isLoading || pending.isFetching}
              isError={pending.isError}
              error={pending.error}
              isEmpty={(pending.data?.length ?? 0) === 0}
              emptyTitle="No pending registrations"
              emptyDescription="When someone registers, they appear here for approval."
              onRetry={() => pending.refetch()}
            >
              <div className="mt-4 space-y-2">
                {(pending.data ?? []).map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{u.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.email} · {u.roleLabel} · {u.requestedAt}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1"
                        disabled={approve.isPending}
                        onClick={() => handleApprove(u.id, u.name)}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        disabled={reject.isPending}
                        onClick={() => handleReject(u.id, u.name)}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DataBoundary>
          </Card>

          <div>
            <h2 className="font-semibold mb-3">Platform stats</h2>
            {dashboard.isLoading && <ApiLoading label="Platform stats" />}
            {dashboard.isError && (
              <ApiErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
            )}
            {dashboard.data && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {dashboard.data.kpis.map((kpi) => (
                  <Card key={kpi.label} className="p-4">
                    <div className="text-xs text-muted-foreground">{kpi.label}</div>
                    <div className="mt-2 text-2xl font-semibold">{kpi.value}</div>
                    <div className="text-xs text-primary mt-0.5">{kpi.delta}</div>
                  </Card>
                ))}
              </div>
            )}
            {!dashboard.isLoading && !dashboard.isError && !dashboard.data && (
              <ApiEmpty
                title="No stats yet"
                description="KPIs load from GET /admin/dashboard when your API is running."
              />
            )}
          </div>

          <Link to="/admin">
            <Button variant="outline" className="gap-2">
              Full admin panel <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}

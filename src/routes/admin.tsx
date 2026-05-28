import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GuardedPage } from "@/components/auth/guarded-page";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import { useAdminDashboard } from "@/hooks/use-admin";
import { useApproveUser, usePendingUsers, useRejectUser } from "@/hooks/use-pending-users";
import { Upload, MessageSquare, Megaphone, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — StudyKit ET" }] }),
  component: Admin,
});

function Admin() {
  return (
    <GuardedPage
      guard={{ requireAuth: true, requireApproved: true, allowedRoles: ["admin"] }}
    >
      <AdminPanel />
    </GuardedPage>
  );
}

function AdminPanel() {
  const { data, isLoading, isError, error, refetch } = useAdminDashboard(isApiConfigured());
  const pending = usePendingUsers(isApiConfigured());
  const approve = useApproveUser();
  const reject = useRejectUser();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Admin panel" description="Data from GET /admin/dashboard" />

        <DataBoundary
          resource="Admin dashboard"
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!data}
          emptyTitle="No admin data"
          emptyDescription="Your API should return KPIs, uploads, tickets, and audit log."
          onRetry={() => refetch()}
        >
          {data && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {data.kpis.map((kpi) => (
                  <Card key={kpi.label} className="p-4">
                    <div className="text-xs text-muted-foreground">{kpi.label}</div>
                    <div className="mt-2 text-2xl font-semibold">{kpi.value}</div>
                    <div className="text-xs text-primary mt-0.5">{kpi.delta}</div>
                  </Card>
                ))}
              </div>

              <Tabs defaultValue="approvals">
                <TabsList>
                  <TabsTrigger value="approvals">
                    Approvals
                    {(pending.data?.length ?? 0) > 0 ? ` (${pending.data!.length})` : ""}
                  </TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="support">Support</TabsTrigger>
                  <TabsTrigger value="notify">Notify</TabsTrigger>
                  <TabsTrigger value="audit">Audit</TabsTrigger>
                </TabsList>

                <TabsContent value="approvals" className="mt-5 space-y-2">
                  {pending.isLoading && (
                    <p className="text-sm text-muted-foreground">Loading pending registrations…</p>
                  )}
                  {(pending.data?.length ?? 0) === 0 && !pending.isLoading && (
                    <Card className="p-6 text-center text-sm text-muted-foreground">
                      No accounts waiting for approval.
                    </Card>
                  )}
                  {pending.data?.map((u) => (
                    <Card key={u.id} className="p-4 flex flex-wrap justify-between gap-3">
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {u.email} · {u.roleLabel} · {u.requestedAt}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            approve.mutate(u.id, {
                              onSuccess: () => toast.success(`${u.name} approved`),
                            });
                          }}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => {
                            reject.mutate(u.id, {
                              onSuccess: () => toast.success(`${u.name} rejected`),
                              onError: (err) =>
                                toast.error(
                                  err instanceof ApiError ? err.message : "Reject failed",
                                ),
                            });
                          }}
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="content" className="mt-5 grid lg:grid-cols-3 gap-4">
                  <Card className="p-6 border-dashed">
                    <Upload className="h-8 w-8 text-primary" />
                    <h3 className="font-semibold mt-3">Upload</h3>
                    <Input type="file" className="mt-4" multiple />
                    <Button className="w-full mt-3" onClick={() => toast.info("POST /admin/uploads")}>
                      Upload
                    </Button>
                  </Card>
                  <Card className="lg:col-span-2 divide-y">
                    {data.recentUploads.map((x) => (
                      <div key={x.title} className="p-4">
                        <div className="font-medium text-sm">{x.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {x.department} · {x.uploader}
                        </div>
                      </div>
                    ))}
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="mt-5">
                  <Card className="p-6 space-y-3">
                    {data.topMaterials.map((m) => (
                      <div key={m.title}>
                        <div className="flex justify-between text-sm">
                          <span>{m.title}</span>
                          <span>{m.downloads}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full mt-1">
                          <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
                        </div>
                      </div>
                    ))}
                  </Card>
                </TabsContent>

                <TabsContent value="support" className="mt-5">
                  <Card className="divide-y">
                    {data.tickets.map((t) => (
                      <div key={t.id} className="p-4 flex justify-between items-center">
                        <div className="flex gap-3">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{t.subject}</div>
                            <div className="text-xs text-muted-foreground">
                              {t.id} · {t.user}
                            </div>
                          </div>
                        </div>
                        <Badge>{t.status}</Badge>
                      </div>
                    ))}
                  </Card>
                </TabsContent>

                <TabsContent value="notify" className="mt-5">
                  <Card className="p-6 max-w-2xl">
                    <Megaphone className="h-6 w-6 text-primary" />
                    <Input className="mt-4" placeholder="Notification title" />
                    <textarea className="w-full min-h-[100px] mt-2 rounded-md border p-3 text-sm" placeholder="Body" />
                    <Button className="mt-3" onClick={() => toast.info("POST /admin/notify")}>
                      Send
                    </Button>
                  </Card>
                </TabsContent>

                <TabsContent value="audit" className="mt-5">
                  <Card className="font-mono text-xs divide-y overflow-x-auto">
                    {data.auditLog.map((row, i) => (
                      <div key={i} className="grid grid-cols-[140px_1fr_100px_1fr] gap-2 p-3 min-w-[600px]">
                        <span className="text-muted-foreground">{row[0]}</span>
                        <span>{row[1]}</span>
                        <Badge variant="outline">{row[2]}</Badge>
                        <span className="text-muted-foreground truncate">{row[3]}</span>
                      </div>
                    ))}
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DataBoundary>
      </div>
    </AppShell>
  );
}

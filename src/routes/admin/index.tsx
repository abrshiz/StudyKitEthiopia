import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import { useAdminDashboard } from "@/hooks/use-admin";
import { useApproveUser, usePendingUsers, useRejectUser } from "@/hooks/use-pending-users";
import { useDepartments } from "@/hooks/use-departments";
import { useApiQuery } from "@/hooks/use-api-query";
import { createCourse, deleteCourse, fetchCourses } from "@/lib/api/courses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  MessageSquare,
  Megaphone,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Course } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — StudyKit ET" }] }),
  component: AdminIndex,
});

function AdminIndex() {
  const { data, isLoading, isError, error, refetch } = useAdminDashboard(isApiConfigured());
  const pending = usePendingUsers(isApiConfigured());
  const approve = useApproveUser();
  const reject = useRejectUser();
  const qc = useQueryClient();

  const [deptId, setDeptId] = useState<string>("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseYear, setCourseYear] = useState<number>(1);
  const [courseSemester, setCourseSemester] = useState("Semester I");

  const departments = useDepartments("", "All");
  const courses = useApiQuery<Course[]>(
    ["courses", deptId],
    () => fetchCourses({ departmentId: deptId, active: true }),
    { enabled: Boolean(deptId) },
  );

  const create = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course created");
      setCourseCode("");
      setCourseTitle("");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Create failed"),
  });

  const remove = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin overview"
        description="Approvals, courses, KPIs. Use the sub-pages for uploads, analytics, tickets, and broadcasts."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ShortcutCard to="/admin/upload" icon={<Upload className="h-4 w-4" />} label="Upload material" />
        <ShortcutCard to="/admin/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Analytics" />
        <ShortcutCard to="/admin/tickets" icon={<MessageSquare className="h-4 w-4" />} label="Tickets" />
        <ShortcutCard to="/admin/notifications" icon={<Megaphone className="h-4 w-4" />} label="Broadcast" />
      </div>

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
                <TabsTrigger value="courses">Departments & courses</TabsTrigger>
                <TabsTrigger value="recent">Recent uploads</TabsTrigger>
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

              <TabsContent value="courses" className="mt-5 space-y-4">
                <Card className="p-6">
                  <h3 className="font-semibold">Create course</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add courses under a department. Students will see materials organized by their department.
                  </p>

                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Department</label>
                      <Select value={deptId} onValueChange={setDeptId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select department…" />
                        </SelectTrigger>
                        <SelectContent>
                          {(departments.data ?? []).map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} · {d.college}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Year</label>
                        <Input
                          className="mt-1"
                          type="number"
                          min={1}
                          max={7}
                          value={courseYear}
                          onChange={(e) => setCourseYear(Number(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Semester</label>
                        <Input
                          className="mt-1"
                          value={courseSemester}
                          onChange={(e) => setCourseSemester(e.target.value)}
                          placeholder="Semester I"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Course code</label>
                      <Input
                        className="mt-1"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        placeholder="CSE 201"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Course title</label>
                      <Input
                        className="mt-1"
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        placeholder="Data Structures"
                      />
                    </div>
                  </div>

                  <Button
                    className="mt-4 gap-2"
                    disabled={
                      !deptId || !courseCode.trim() || !courseTitle.trim() || create.isPending
                    }
                    onClick={() =>
                      create.mutate({
                        departmentId: deptId,
                        code: courseCode,
                        title: courseTitle,
                        year: courseYear,
                        semester: courseSemester,
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> Add course
                  </Button>
                </Card>

                <DataBoundary
                  resource="Courses"
                  isLoading={courses.isLoading}
                  isError={courses.isError}
                  error={courses.error}
                  isEmpty={Boolean(deptId) && (courses.data?.length ?? 0) === 0}
                  emptyTitle="No courses"
                  emptyDescription="Create the first course for this department."
                  onRetry={() => courses.refetch()}
                >
                  <Card className="divide-y">
                    {(courses.data ?? []).map((c) => (
                      <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {c.code} · {c.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Year {c.year} · {c.semester} · {c.credits} credits
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => remove.mutate(c.id)}
                          disabled={remove.isPending}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    ))}
                  </Card>
                </DataBoundary>
              </TabsContent>

              <TabsContent value="recent" className="mt-5">
                <Card className="divide-y">
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

              <TabsContent value="audit" className="mt-5">
                <Card className="font-mono text-xs divide-y overflow-x-auto">
                  {data.auditLog.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[140px_1fr_100px_1fr] gap-2 p-3 min-w-[600px]"
                    >
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
  );
}

function ShortcutCard({
  to,
  icon,
  label,
}: {
  to: "/admin/upload" | "/admin/analytics" | "/admin/tickets" | "/admin/notifications";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className="p-4 hover:border-primary/50 transition flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{label}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Card>
    </Link>
  );
}

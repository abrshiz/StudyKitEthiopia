import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchMaterials } from "@/lib/api/materials";
import { fetchDepartments } from "@/lib/api/departments";
import type { Department, StudyMaterial } from "@/lib/types";
import { ArrowRight, BarChart3, Library, MessageSquare, Upload } from "lucide-react";

export const Route = createFileRoute("/professor/")({
  head: () => ({ meta: [{ title: "Professor overview — StudyKit ET" }] }),
  component: ProfessorOverview,
});

function ProfessorOverview() {
  const { user } = useAuth();
  const deptId = user?.professorDepartmentId;

  const department = useQuery<Department | null>({
    queryKey: ["department", deptId],
    enabled: Boolean(deptId),
    queryFn: async () => {
      const all = await fetchDepartments({});
      return all.find((d) => d.id === deptId) ?? null;
    },
  });

  const materials = useQuery<StudyMaterial[]>({
    queryKey: ["professor-materials", deptId],
    enabled: Boolean(deptId),
    queryFn: () => fetchMaterials({ departmentId: deptId }),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Welcome, ${user?.name?.split(" ")[0] ?? "Professor"}`}
        description={
          department.data
            ? `Department: ${department.data.name} · ${department.data.college}`
            : "You are not yet scoped to a department. Ask an admin to assign one."
        }
      >
        {department.data && <Badge variant="secondary">{department.data.name}</Badge>}
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-3">
        <Shortcut to="/professor/upload" icon={<Upload className="h-4 w-4" />} label="Upload material" />
        <Shortcut to="/professor/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Department analytics" />
        <Shortcut to="/professor/tickets" icon={<MessageSquare className="h-4 w-4" />} label="Department tickets" />
      </div>

      <DataBoundary
        resource="Your department's materials"
        isLoading={materials.isLoading}
        isError={materials.isError}
        error={materials.error}
        isEmpty={(materials.data?.length ?? 0) === 0}
        emptyTitle="No materials yet"
        emptyDescription="Upload lecture notes — students in your department will see them in the library."
        onRetry={() => materials.refetch()}
      >
        <Card className="divide-y">
          {materials.data?.slice(0, 10).map((m) => (
            <div key={m.id} className="p-4 flex justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate flex items-center gap-2">
                  <Library className="h-3.5 w-3.5 text-muted-foreground" />
                  {m.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {m.course} · {m.downloads ?? 0} downloads
                  {m.expired && (
                    <Badge variant="destructive" className="ml-2 text-[10px]">
                      expired
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant="outline">{m.type}</Badge>
            </div>
          ))}
        </Card>
      </DataBoundary>
    </div>
  );
}

function Shortcut({
  to,
  icon,
  label,
}: {
  to: "/professor/upload" | "/professor/analytics" | "/professor/tickets";
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
        <Button variant="ghost" size="icon" tabIndex={-1}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Card>
    </Link>
  );
}

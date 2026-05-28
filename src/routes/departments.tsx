import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { collegeFilters } from "@/config/colleges";
import { GuardedPage } from "@/components/auth/guarded-page";
import { useAuth } from "@/context/auth-context";
import { useDepartments } from "@/hooks/use-departments";
import { DataBoundary } from "@/components/shared/api-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, Users } from "lucide-react";
import type { Department } from "@/lib/types";

export const Route = createFileRoute("/departments")({
  head: () => ({ meta: [{ title: "Choose your department — StudyKit ET" }] }),
  component: Departments,
});

function Departments() {
  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <DepartmentsPage />
    </GuardedPage>
  );
}

function DepartmentsPage() {
  const navigate = useNavigate();
  const { setDepartment } = useAuth();
  const [q, setQ] = useState("");
  const [college, setCollege] = useState<(typeof collegeFilters)[number]>("All");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: departments = [], isLoading, isError, error, refetch } = useDepartments(q, college);

  function handleContinue() {
    const dept = departments.find((d) => d.id === selected);
    if (!dept) return;
    setDepartment({ id: dept.id, name: dept.name, college: dept.college });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-muted/40 py-8 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold text-earth">StudyKit ET</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Choose your department</h1>
        <p className="mt-2 text-muted-foreground">
          Loaded from your database when API is connected.
        </p>

        <div className="mt-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search departments…"
            className="pl-10 h-12"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {collegeFilters.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCollege(c)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs border transition ${
                college === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">{departments.length} departments</div>

        <div className="mt-4">
          <DataBoundary
            resource="Departments"
            isLoading={isLoading}
            isError={isError}
            error={error}
            isEmpty={departments.length === 0}
            emptyTitle="No departments in database"
            emptyDescription="Add departments via your API, then refresh this page."
            onRetry={() => refetch()}
          >
            <DepartmentGrid
              departments={departments.slice(0, 60)}
              selected={selected}
              onSelect={setSelected}
            />
            {departments.length > 60 && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Showing 60 of {departments.length} — refine search
              </p>
            )}
          </DataBoundary>
        </div>

        <div className="sticky bottom-4 mt-8 flex justify-end">
          <Button size="lg" disabled={!selected} onClick={handleContinue}>
            Continue to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

function DepartmentGrid({
  departments,
  selected,
  onSelect,
}: {
  departments: Department[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {departments.map((d) => (
        <button key={d.id} type="button" onClick={() => onSelect(d.id)} className="text-left">
          <Card
            className={`p-4 transition ${selected === d.id ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"}`}
          >
            <Badge variant="secondary" className="text-[10px]">
              {d.college}
            </Badge>
            <div className="font-medium mt-2">{d.name}</div>
            {d.students != null && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Users className="h-3 w-3" /> {d.students.toLocaleString()} students
              </div>
            )}
          </Card>
        </button>
      ))}
    </div>
  );
}

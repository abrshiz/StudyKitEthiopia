import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { MaterialIcon } from "@/components/features/material-icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/auth-context";
import { useMaterials } from "@/hooks/use-materials";
import { useProgress } from "@/hooks/use-progress";
import { Sparkles, ArrowRight } from "lucide-react";

export function StudentDashboard() {
  const { user, department } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const materials = useMaterials("", "all");
  const progress = useProgress();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selam, ${firstName} 👋`}
        description={
          department
            ? `${department.name} · ${department.college}`
            : "Select a department to personalize your workspace."
        }
      />

      <DataBoundary
        resource="Progress overview"
        isLoading={progress.isLoading}
        isError={progress.isError}
        error={progress.error}
        isEmpty={false}
        emptyTitle=""
        emptyDescription=""
        onRetry={() => progress.refetch()}
      >
        {progress.data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Current streak" value={progress.data.currentStreak} />
            <StatCard label="Longest streak" value={progress.data.longestStreak} />
            <StatCard label="This week" value={progress.data.weeklyHours} />
            <StatCard label="Materials read" value={String(progress.data.materialsRead)} />
          </div>
        )}
      </DataBoundary>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent materials</h2>
            <Link to="/library">
              <Button variant="ghost" size="sm" className="gap-1">
                Library <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <DataBoundary
            resource="Materials"
            isLoading={materials.isLoading}
            isError={materials.isError}
            error={materials.error}
            isEmpty={(materials.data?.length ?? 0) === 0}
            emptyTitle="No materials yet"
            emptyDescription="Materials for your department appear here once uploaded by your lecturers."
            onRetry={() => materials.refetch()}
          >
            <Card>
              <div className="divide-y">
                {materials.data!.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-4 hover:bg-accent/30">
                    <MaterialIcon type={m.type} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.course} · {m.semester}
                      </div>
                    </div>
                    <Link to="/library">
                      <Button size="sm" variant="ghost">
                        Open
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          </DataBoundary>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Semester progress</h3>
          </div>
          {progress.data?.courses && progress.data.courses.length > 0 ? (
            <div className="space-y-3">
              {progress.data.courses.slice(0, 4).map((x) => (
                <div key={x.course}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate pr-2">{x.course}</span>
                    <span>{x.percent}%</span>
                  </div>
                  <Progress value={x.percent} className="h-1.5" />
                </div>
              ))}
              <Link to="/progress">
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  View all
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Course progress appears as you study.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-earth dark:text-foreground">{value}</div>
    </Card>
  );
}

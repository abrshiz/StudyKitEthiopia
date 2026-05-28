import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GuardedPage } from "@/components/auth/guarded-page";
import { useProgress } from "@/hooks/use-progress";
import { StreakHeatmap } from "@/components/features/streak-heatmap";
import { pingStreak } from "@/lib/api/streak";
import { isApiConfigured } from "@/lib/api/client";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — StudyKit ET" }] }),
  component: ProgressRoute,
});

function ProgressRoute() {
  return (
    <GuardedPage
      guard={{
        requireAuth: true,
        requireStudentDepartment: true,
      }}
    >
      <ProgressPage />
    </GuardedPage>
  );
}

const days = ["M", "T", "W", "T", "F", "S", "S"];

function ProgressPage() {
  const { data, isLoading, isError, error, refetch } = useProgress();

  useEffect(() => {
    if (!isApiConfigured()) return;
    void pingStreak().catch(() => {
      /* streak ping is best-effort */
    });
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Your progress" description="Synced from your database." />

        <DataBoundary
          resource="Progress"
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!data}
          emptyTitle="No progress data"
          emptyDescription="Expose GET /progress from your API with streaks, badges, and courses."
          onRetry={() => refetch()}
        >
          {data && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Current streak" value={data.currentStreak} />
                <Stat label="Longest streak" value={data.longestStreak} />
                <Stat label="This week" value={data.weeklyHours} />
                <Stat label="Materials read" value={String(data.materialsRead)} />
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="p-5 lg:col-span-2">
                  <h2 className="font-semibold">This week</h2>
                  <div className="mt-6 flex items-end gap-2 h-40">
                    {data.weeklyActivity.map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                        <div className="w-full bg-primary/15 rounded-md flex items-end flex-1">
                          <div
                            className="w-full bg-primary rounded-md"
                            style={{ height: `${v}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{days[i]}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="font-semibold">Badges</h2>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {data.badges.map((b) => (
                      <div
                        key={b.name}
                        className={`p-3 rounded-xl text-center border ${b.earned ? "bg-accent/30" : "opacity-40"}`}
                        title={b.description}
                      >
                        <div className="text-2xl">{b.icon}</div>
                        <div className="text-[11px] mt-1">{b.name}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <StreakHeatmap days={180} />

              <Card className="p-5">
                <h2 className="font-semibold">Course completion</h2>
                <div className="mt-4 space-y-4">
                  {data.courses.map((x) => (
                    <div key={x.course}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{x.course}</span>
                        <span className="text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px] mr-2">
                            {x.hours}
                          </Badge>
                          {x.percent}%
                        </span>
                      </div>
                      <Progress value={x.percent} className="h-2" />
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </DataBoundary>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1 text-earth dark:text-foreground">{value}</div>
    </Card>
  );
}

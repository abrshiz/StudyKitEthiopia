import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { StreakHeatmap } from "@/components/features/streak-heatmap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { fetchStudyKits } from "@/lib/api/study-kits";
import { fetchDueFlashcards } from "@/lib/api/flashcards";
import { pingStreak } from "@/lib/api/streak";
import { useEffect } from "react";
import { Plus, BookOpen, Sparkles, ArrowRight } from "lucide-react";

export function StudentDashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  useEffect(() => {
    pingStreak().catch(() => {});
  }, []);

  const kits = useQuery({
    queryKey: ["study-kits", "mine"],
    queryFn: () => fetchStudyKits({ public: false }),
  });

  const shared = useQuery({
    queryKey: ["study-kits", "shared-spotlight"],
    queryFn: () => fetchStudyKits({ public: true }),
  });

  const due = useQuery({
    queryKey: ["due-all"],
    queryFn: async () => {
      const mine = await fetchStudyKits({ public: false });
      let total = 0;
      for (const k of mine.slice(0, 5)) {
        try {
          const d = await fetchDueFlashcards(k.id);
          total += d.count;
        } catch {
          /* kit may have no cards */
        }
      }
      return total;
    },
    enabled: (kits.data?.length ?? 0) > 0,
  });

  const streakDays = user?.subscription?.streakDays ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selam, ${firstName} 👋`}
        description="Your AI study workspace — like Thea, built for Ethiopian .edu.et students."
      >
        <Link to="/study/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New kit
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Study streak" value={`${streakDays} days`} />
        <StatCard label="Due flashcards" value={String(due.data ?? "—")} />
        <StatCard label="My kits" value={String(kits.data?.length ?? 0)} />
        <StatCard label="Plan" value={user?.subscription?.plan ?? "free"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Recent kits
            </h2>
            <Link to="/study">
              <Button variant="ghost" size="sm" className="gap-1">
                All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <DataBoundary
            resource="Study kits"
            isLoading={kits.isLoading}
            isError={kits.isError}
            error={kits.error}
            isEmpty={(kits.data?.length ?? 0) === 0}
            emptyTitle="No study kits yet"
            emptyDescription="Upload a PDF, paste notes, or describe your exam topic to get started."
            onRetry={() => kits.refetch()}
          >
            <Card className="divide-y">
              {(kits.data ?? []).slice(0, 5).map((k) => (
                <Link
                  key={k.id}
                  to="/study/$kitId"
                  params={{ kitId: k.id }}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30"
                >
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{k.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {k.flashcardCount} cards · {k.quizQuestionCount} quiz Qs
                    </div>
                  </div>
                </Link>
              ))}
            </Card>
          </DataBoundary>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3">Activity</h3>
          <StreakHeatmap />
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Shared library spotlight</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {(shared.data ?? []).slice(0, 4).map((k) => (
            <Link key={k.id} to="/library">
              <Card className="p-4 hover:border-primary/40 transition">
                <p className="font-medium text-sm truncate">{k.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {k.ownerName ?? "Student"} · {k.sourceType}
                </p>
              </Card>
            </Link>
          ))}
        </div>
        {!shared.data?.length && (
          <p className="text-sm text-muted-foreground">
            Public kits from other students will show up here.
          </p>
        )}
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

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PageHeader } from "@/components/coming-soon";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — StudyKit ET" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Your progress"
          description="Streaks, study time, badges, and course completion will appear here."
          featureId="progress"
        />

        <EmptyState
          title="No activity tracked yet"
          description="Start studying from your library to build streaks and earn badges. Activity tracking is not connected yet."
          icon={TrendingUp}
        />
      </div>
    </AppShell>
  );
}

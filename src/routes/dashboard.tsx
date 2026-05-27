import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PageHeader } from "@/components/coming-soon";
import { Button } from "@/components/ui/button";
import { getSelectedDepartment } from "@/lib/session";
import { BookOpen, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StudyKit ET" }] }),
  component: Dashboard,
});

function Dashboard() {
  const department = getSelectedDepartment();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={department ? `Welcome back` : "Dashboard"}
          description={
            department
              ? `${department.name} · ${department.college}`
              : "Pick a department after sign-in to personalize your workspace."
          }
          featureId="library"
        />

        <EmptyState
          title="No materials yet"
          description="Your dashboard will show recent downloads, study time, and AI suggestions once the content library is connected to your account."
          icon={BookOpen}
          action={
            <Link to="/library">
              <Button className="gap-1.5">
                Go to library <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}

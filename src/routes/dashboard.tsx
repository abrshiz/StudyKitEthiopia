import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StudyKit ET" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <GuardedPage
      guard={{ requireAuth: true }}
    >
      <AppShell>
        <StudentDashboard />
      </AppShell>
    </GuardedPage>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { ProfessorDashboard } from "@/components/dashboard/professor-dashboard";
import { AdminHomeDashboard } from "@/components/dashboard/admin-home-dashboard";
import { resolveUserRole } from "@/lib/auth/role-from-email";
import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StudyKit ET" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <GuardedPage
      guard={{
        requireAuth: true,
        requireApproved: true,
        requireStudentDepartment: true,
      }}
    >
      <DashboardContent />
    </GuardedPage>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  if (!user) return null;

  const role = resolveUserRole(user);

  return (
    <AppShell>
      {role === "admin" && <AdminHomeDashboard />}
      {role === "professor" && <ProfessorDashboard />}
      {role === "student" && <StudentDashboard />}
    </AppShell>
  );
}

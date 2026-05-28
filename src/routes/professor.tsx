import { createFileRoute, Outlet, useLocation, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { BarChart3, LayoutDashboard, MessageSquare, Upload } from "lucide-react";

export const Route = createFileRoute("/professor")({
  head: () => ({ meta: [{ title: "Professor — StudyKit ET" }] }),
  component: ProfessorLayoutRoute,
});

const TABS = [
  { to: "/professor", label: "Overview", icon: LayoutDashboard },
  { to: "/professor/upload", label: "Upload", icon: Upload },
  { to: "/professor/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/professor/tickets", label: "Tickets", icon: MessageSquare },
] as const;

function ProfessorLayoutRoute() {
  return (
    <GuardedPage
      guard={{ requireAuth: true, requireApproved: true, allowedRoles: ["professor", "admin"] }}
    >
      <Layout />
    </GuardedPage>
  );
}

function Layout() {
  const { pathname } = useLocation();
  return (
    <AppShell>
      <div className="space-y-5">
        <nav className="flex flex-wrap gap-2 border-b pb-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active =
              t.to === "/professor" ? pathname === "/professor" : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
        <Outlet />
      </div>
    </AppShell>
  );
}

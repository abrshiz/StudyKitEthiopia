import { createFileRoute, Outlet, useLocation, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { BarChart3, LayoutDashboard, Megaphone, MessageSquare, Upload } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — StudyKit ET" }] }),
  component: AdminLayoutRoute,
});

const TABS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/upload", label: "Upload", icon: Upload },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/tickets", label: "Tickets", icon: MessageSquare },
  { to: "/admin/notifications", label: "Notify", icon: Megaphone },
] as const;

function AdminLayoutRoute() {
  return (
    <GuardedPage guard={{ requireAuth: true, requireApproved: true, allowedRoles: ["admin"] }}>
      <AdminLayout />
    </GuardedPage>
  );
}

function AdminLayout() {
  const { pathname } = useLocation();
  return (
    <AppShell>
      <div className="space-y-5">
        <nav className="flex flex-wrap gap-2 border-b pb-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.to === "/admin" ? pathname === "/admin" : pathname.startsWith(t.to);
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

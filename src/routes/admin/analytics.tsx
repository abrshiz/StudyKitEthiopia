import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAdminAnalytics } from "@/lib/api/admin";
import type { AdminAnalytics } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Admin analytics — StudyKit ET" }] }),
  component: AdminAnalyticsRoute,
});

const ROLE_COLORS: Record<string, string> = {
  student: "var(--primary)",
  professor: "var(--gold, #f59e0b)",
  admin: "var(--destructive)",
};

function AdminAnalyticsRoute() {
  const [days, setDays] = useState(30);
  const query = useQuery<AdminAnalytics>({
    queryKey: ["admin-analytics", days],
    queryFn: () => fetchAdminAnalytics(days),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="Users by role, downloads per day, popular materials."
      />

      <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
        <TabsList>
          <TabsTrigger value="7">7 days</TabsTrigger>
          <TabsTrigger value="30">30 days</TabsTrigger>
          <TabsTrigger value="90">90 days</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataBoundary
        resource="Analytics"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={!query.data}
        emptyTitle="No analytics yet"
        emptyDescription="Once users start downloading materials, charts will appear here."
        onRetry={() => query.refetch()}
      >
        {query.data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="Users" value={query.data.totals.users} />
              <KpiCard label="Materials" value={query.data.totals.materials} />
              <KpiCard label="Tickets" value={query.data.totals.tickets} />
              <KpiCard label="Total downloads" value={query.data.totals.downloads} />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <h2 className="font-semibold mb-3">Users by role</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={query.data.usersByRole}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {query.data.usersByRole.map((r) => (
                        <Cell key={r.role} fill={ROLE_COLORS[r.role] ?? "var(--primary)"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <h2 className="font-semibold mb-3">Downloads / day</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={query.data.downloadsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-5">
              <h2 className="font-semibold mb-3">Popular materials</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={query.data.popularMaterials} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="title" width={180} />
                  <Tooltip />
                  <Bar dataKey="downloads" fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </DataBoundary>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchProfessorAnalytics } from "@/lib/api/professor";
import type { AdminAnalytics } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/professor/analytics")({
  head: () => ({ meta: [{ title: "Department analytics — StudyKit ET" }] }),
  component: ProfessorAnalytics,
});

function ProfessorAnalytics() {
  const [days, setDays] = useState(30);
  const query = useQuery<AdminAnalytics>({
    queryKey: ["professor-analytics", days],
    queryFn: () => fetchProfessorAnalytics(days),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Department analytics"
        description="Downloads and engagement scoped to your department."
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
        emptyTitle="No data yet"
        emptyDescription="Activity in your department will appear here as students download materials."
        onRetry={() => query.refetch()}
      >
        {query.data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Department users" value={query.data.totals.users} />
              <Stat label="Materials" value={query.data.totals.materials} />
              <Stat label="Tickets" value={query.data.totals.tickets} />
              <Stat label="Downloads" value={query.data.totals.downloads} />
            </div>

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

            <Card className="p-5">
              <h2 className="font-semibold mb-3">Popular materials</h2>
              <ResponsiveContainer width="100%" height={260}>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}

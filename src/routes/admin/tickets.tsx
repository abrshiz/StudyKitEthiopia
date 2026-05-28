import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketsPanel } from "@/components/features/tickets-panel";

export const Route = createFileRoute("/admin/tickets")({
  head: () => ({ meta: [{ title: "Admin tickets — StudyKit ET" }] }),
  component: AdminTickets,
});

function AdminTickets() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  return (
    <div className="space-y-4">
      <PageHeader title="Support tickets" description="All student tickets across departments." />
      <Tabs value={status ?? "all"} onValueChange={(v) => setStatus(v === "all" ? undefined : v)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Open">Open</TabsTrigger>
          <TabsTrigger value="In progress">In progress</TabsTrigger>
          <TabsTrigger value="Resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>
      <TicketsPanel status={status} />
    </div>
  );
}

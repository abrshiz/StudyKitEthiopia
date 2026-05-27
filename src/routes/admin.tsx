import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PageHeader } from "@/components/coming-soon";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — StudyKit ET" }] }),
  component: Admin,
});

function Admin() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Admin panel"
          description="Manage content, users, analytics, and notifications."
          featureId="admin"
        />

        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="notify">Notify</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          {(["content", "analytics", "support", "notify", "audit"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-5">
              <EmptyState
                title={`${tab.charAt(0).toUpperCase()}${tab.slice(1)} — not available`}
                description="Admin tools require authentication, role checks, and backend APIs. This section will be enabled when the admin service is connected."
                icon={Shield}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}

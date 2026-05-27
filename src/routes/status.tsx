import { createFileRoute, Link } from "@tanstack/react-router";
import { features, type Feature, type FeatureStatus } from "@/config/features";
import { FeatureStatusBadge } from "@/components/coming-soon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/status")({
  head: () => ({ meta: [{ title: "Platform status — StudyKit ET" }] }),
  component: StatusPage,
});

const order: FeatureStatus[] = ["ready", "partial", "planned"];

function StatusPage() {
  const grouped = order.map((status) => ({
    status,
    items: Object.values(features).filter((f) => f.status === status),
  }));

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-5">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold">StudyKit ET</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">What&apos;s live vs coming soon</h1>
        <p className="mt-2 text-muted-foreground">
          Honest view of what works today and what still needs backend work.
        </p>

        <div className="mt-8 space-y-8">
          {grouped.map(({ status, items }) =>
            items.length === 0 ? null : (
              <section key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {status === "ready" ? "Live" : status === "partial" ? "In progress" : "Planned"}
                  </h2>
                  <FeatureStatusBadge status={status} />
                </div>
                <ul className="space-y-2">
                  {items.map((f) => (
                    <FeatureRow key={f.id} feature={f} />
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">Open app</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ feature }: { feature: Feature }) {
  return (
    <li>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="font-medium">{feature.label}</span>
          <FeatureStatusBadge status={feature.status} />
        </div>
        <p className="text-sm text-muted-foreground mt-1.5">{feature.description}</p>
      </Card>
    </li>
  );
}

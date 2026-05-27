import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/coming-soon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subscriptionPlans } from "@/config/plans";
import { Check, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: "Billing — StudyKit ET" }] }),
  component: Billing,
});

function Billing() {
  const [method, setMethod] = useState("telebirr");
  const [picked, setPicked] = useState("student");
  const selectedPlan = subscriptionPlans.find((p) => p.id === picked);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <PageHeader
          title="Subscription & payment"
          description="Choose a plan. Payments in ETB via TeleBirr, Chapa, or CBE Birr will be enabled soon."
          featureId="billing"
        />

        <div className="grid md:grid-cols-3 gap-4">
          {subscriptionPlans.map((p) => {
            const active = picked === p.id;
            return (
              <Card
                key={p.id}
                onClick={() => setPicked(p.id)}
                className={`p-6 cursor-pointer transition relative ${
                  active ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"
                }`}
              >
                {p.popular && <Badge className="absolute -top-2.5 left-6">Most popular</Badge>}
                <div className="font-semibold">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">
                    {p.price === 0 ? "Free" : `${p.price} ETB`}
                  </span>
                  {p.price > 0 && <span className="text-xs text-muted-foreground">/ {p.period}</span>}
                </div>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <Card className="p-6">
          <h2 className="font-semibold">Payment method</h2>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {[
              { id: "telebirr", name: "TeleBirr", desc: "Ethio Telecom mobile money" },
              { id: "chapa", name: "Chapa", desc: "Cards, bank transfer, mobile" },
              { id: "cbe", name: "CBE Birr", desc: "Commercial Bank of Ethiopia" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`text-left p-4 rounded-xl border transition ${
                  method === m.id ? "border-primary bg-accent/30" : "hover:border-primary/40"
                }`}
              >
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 flex-wrap pt-5 border-t">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Checkout is not live yet — plan selection is saved locally only
            </div>
            <Button size="lg" disabled>
              Pay {selectedPlan?.price ?? 0} ETB with {method.toUpperCase()} (coming soon)
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

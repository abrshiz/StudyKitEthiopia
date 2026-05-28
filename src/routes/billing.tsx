import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GuardedPage } from "@/components/auth/guarded-page";
import { usePlans } from "@/hooks/use-billing";
import { confirmChapaTransaction, createCheckout } from "@/lib/api/billing";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import { Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: "Billing — StudyKit ET" }] }),
  component: Billing,
});

function Billing() {
  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <BillingPage />
    </GuardedPage>
  );
}

function BillingPage() {
  const [method, setMethod] = useState("chapa");
  const [picked, setPicked] = useState<string | null>(null);
  const { data: plans = [], isLoading, isError, error, refetch } = usePlans();
  const { refresh, user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const txRef = params.get("tx_ref") ?? params.get("trx_ref");
    const planSlug = params.get("plan") as "student" | "premium" | null;
    if (status === "success" && txRef && (planSlug === "student" || planSlug === "premium")) {
      void confirmChapaTransaction({ tx_ref: txRef, planSlug })
        .then(() => {
          toast.success("Payment confirmed — your plan is active.");
          refresh();
          window.history.replaceState({}, "", window.location.pathname);
        })
        .catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : "Could not confirm payment");
        });
    }
  }, [refresh]);

  const selected = plans.find((p) => p.id === picked) ?? plans[0];

  async function handlePay() {
    if (!selected || !isApiConfigured()) {
      toast.error("Connect API and select a plan");
      return;
    }
    if (selected.price === 0) {
      toast.info("You're already on the free plan");
      return;
    }
    try {
      const result = await createCheckout({ planId: selected.id, method });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      toast.success("Checkout started");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Payment failed");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <PageHeader title="Subscription & payment" description="Plans from GET /billing/plans" />

        {user?.subscription && (
          <Card className="p-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm">
                Current plan:{" "}
                <span className="font-medium capitalize">{user.subscription.plan}</span>
                {user.subscription.expiryDate && user.subscription.plan !== "free" && (
                  <span className="text-muted-foreground">
                    {" "}
                    · expires {new Date(user.subscription.expiryDate).toLocaleDateString()}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Kits created this month: {user.subscription.kitsCreatedThisMonth}
              </p>
            </div>
          </Card>
        )}

        <DataBoundary
          resource="Subscription plans"
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={plans.length === 0}
          emptyTitle="No plans configured"
          emptyDescription="Add plans in your database and expose them via the billing API."
          onRetry={() => refetch()}
        >
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const active = (picked ?? plans[0]?.id) === p.id;
              return (
                <Card
                  key={p.id}
                  onClick={() => setPicked(p.id)}
                  className={`p-6 cursor-pointer transition ${active ? "border-primary ring-2 ring-primary/20" : ""}`}
                >
                  {p.popular && (
                    <span className="text-xs bg-gold/30 text-earth px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="font-semibold mt-2">{p.name}</div>
                  <div className="mt-3 text-3xl font-semibold">
                    {p.price === 0 ? "Free" : `${p.price} ETB`}
                  </div>
                  <ul className="mt-5 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </DataBoundary>

        <Card className="p-6">
          <h2 className="font-semibold">Payment method</h2>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {[
              { id: "telebirr", name: "TeleBirr" },
              { id: "chapa", name: "Chapa" },
              { id: "cbe", name: "CBE Birr" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`p-4 rounded-xl border text-left ${method === m.id ? "border-primary bg-accent/30" : ""}`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center pt-5 border-t flex-wrap gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              TeleBirr · Chapa · CBE Birr via your payment API
            </span>
            <Button size="lg" onClick={handlePay} disabled={!selected}>
              Pay {selected?.price ?? 0} ETB
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

import { apiFetch } from "./client";
import type { SubscriptionPlan } from "@/lib/types";

export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  return apiFetch<SubscriptionPlan[]>("/billing/plans");
}

export async function createCheckout(body: {
  planId: string;
  method: string;
}): Promise<{ checkoutUrl?: string }> {
  return apiFetch("/billing/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

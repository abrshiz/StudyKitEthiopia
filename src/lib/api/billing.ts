import { apiFetch } from "./client";
import type { SubscriptionPlan } from "@/lib/types";

export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  return apiFetch<SubscriptionPlan[]>("/billing/plans");
}

export async function createCheckout(body: {
  planId: string;
  method: string;
}): Promise<{ checkoutUrl?: string | null; txRef?: string }> {
  return apiFetch("/billing/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function confirmChapaTransaction(body: {
  tx_ref: string;
  planSlug: "student" | "premium";
}): Promise<{ ok: boolean }> {
  return apiFetch("/chapa/confirm", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function checkChapaStatus(): Promise<{ configured: boolean }> {
  return apiFetch("/chapa/status");
}

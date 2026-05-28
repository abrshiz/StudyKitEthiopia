import axios from "axios";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";
import {
  AuditLog,
  Notification,
  Plan,
  User,
  type PlanDocument,
} from "../models/index.js";
import { activatePlan, type PlanSlug } from "./subscription.service.js";
import { sendEmail, isResendConfigured } from "./resend.service.js";

export function isChapaConfigured(): boolean {
  return Boolean(env.chapa.secretKey);
}

export type InitializeInput = {
  userId: string;
  email: string;
  name: string;
  planSlug: string;
};

export type InitializeOutput = {
  checkoutUrl: string;
  txRef: string;
  amount: number;
  currency: string;
  plan: { slug: string; name: string; price: number };
};

const ALLOWED_PLANS = new Set<PlanSlug>(["student", "premium"]);

async function loadPlan(slug: string): Promise<PlanDocument> {
  const plan = await Plan.findOne({ slug }).lean<PlanDocument>();
  if (!plan) throw new HttpError(404, `Unknown plan: ${slug}`);
  return plan as PlanDocument;
}

export async function initializePayment(input: InitializeInput): Promise<InitializeOutput> {
  if (!isChapaConfigured()) {
    throw new HttpError(503, "Chapa is not configured (CHAPA_SECRET_KEY missing)");
  }
  if (!ALLOWED_PLANS.has(input.planSlug as PlanSlug)) {
    throw new HttpError(400, "Plan is not purchasable");
  }
  const plan = await loadPlan(input.planSlug);
  const tx_ref = `sk_${input.userId.slice(-6)}_${Date.now().toString(36)}`;

  const payload = {
    amount: String(plan.price),
    currency: "ETB",
    email: input.email,
    first_name: input.name?.split(" ")[0] ?? "Student",
    last_name: input.name?.split(" ").slice(1).join(" ") || "User",
    tx_ref,
    callback_url: env.chapa.callbackUrl,
    return_url: env.chapa.returnUrl,
    customization: {
      title: `StudyKit ${plan.name}`,
      description: `Subscription for ${plan.name}`,
    },
    meta: {
      planSlug: plan.slug,
      userId: input.userId,
    },
  };

  let response;
  try {
    response = await axios.post(`${env.chapa.baseUrl}/transaction/initialize`, payload, {
      headers: {
        Authorization: `Bearer ${env.chapa.secretKey}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    });
  } catch (err) {
    throw new HttpError(502, `Chapa unreachable: ${(err as Error).message}`);
  }

  if (response.status >= 400) {
    const message =
      response.data?.message ?? response.statusText ?? "Chapa initialize failed";
    throw new HttpError(502, `Chapa: ${message}`);
  }

  const checkoutUrl = response.data?.data?.checkout_url as string | undefined;
  if (!checkoutUrl) throw new HttpError(502, "Chapa returned no checkout URL");

  await AuditLog.create({
    userId: input.userId,
    userEmail: input.email,
    action: "payment_init",
    detail: `Initialized ${plan.slug} checkout (${tx_ref})`,
  });

  return {
    checkoutUrl,
    txRef: tx_ref,
    amount: plan.price,
    currency: "ETB",
    plan: { slug: plan.slug, name: plan.name, price: plan.price },
  };
}

/** Verify a transaction with Chapa's API (used by the webhook + the return-url poll). */
export async function verifyTransaction(txRef: string): Promise<{
  ok: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
}> {
  if (!isChapaConfigured()) {
    return { ok: false };
  }
  const r = await axios.get(`${env.chapa.baseUrl}/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: { Authorization: `Bearer ${env.chapa.secretKey}` },
    validateStatus: () => true,
  });
  if (r.status >= 400) return { ok: false, raw: r.data };
  const data = r.data?.data;
  return {
    ok: data?.status === "success",
    status: data?.status,
    amount: Number(data?.amount ?? 0),
    currency: data?.currency,
    raw: r.data,
  };
}

/** Verify webhook HMAC. Chapa signs the raw body with the configured webhook secret. */
export function verifyWebhookSignature(rawBody: Buffer | string, header: string | undefined): boolean {
  if (!env.chapa.webhookSecret) return false;
  if (!header) return false;
  const expected = crypto
    .createHmac("sha256", env.chapa.webhookSecret)
    .update(typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"))
    .digest("hex");
  // Constant-time compare
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(header, "hex"));
  } catch {
    return false;
  }
}

export async function handleSuccessfulPayment(input: {
  txRef: string;
  planSlug: PlanSlug;
  userId: string;
}) {
  const user = await User.findById(input.userId);
  if (!user) throw new HttpError(404, "User not found");

  await activatePlan(input.userId, input.planSlug);

  await AuditLog.create({
    userId: user._id,
    userEmail: user.email,
    action: "payment",
    detail: `Chapa payment success ${input.txRef} → ${input.planSlug}`,
  });

  await Notification.create({
    userId: user._id,
    title: "Subscription active",
    body: `Your ${input.planSlug} plan is now active for 30 days.`,
    type: "billing",
    read: false,
  });

  if (isResendConfigured() && user.email) {
    void sendEmail({
      to: user.email,
      subject: `StudyKit ET — ${input.planSlug} plan activated`,
      html: `
        <p>Hi ${user.name ?? "there"},</p>
        <p>Your <strong>${input.planSlug}</strong> subscription is now active for 30 days.</p>
        <p>Reference: <code>${input.txRef}</code></p>
        <p>— StudyKit ET</p>
      `,
    }).catch((err) => console.warn("[chapa] email failed", err));
  }
}

import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireApprovedUser } from "../middleware/auth.middleware.js";
import {
  handleSuccessfulPayment,
  initializePayment,
  isChapaConfigured,
  verifyTransaction,
  verifyWebhookSignature,
} from "../services/chapa.service.js";
import type { PlanSlug } from "../services/subscription.service.js";

export const chapaRouter = Router();

chapaRouter.get("/status", (_req, res) => {
  res.json({ configured: isChapaConfigured() });
});

const initSchema = z.object({
  planSlug: z.enum(["student", "premium"]),
});

chapaRouter.post(
  "/initialize",
  asyncHandler(async (req, res) => {
    const body = initSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    const user = requireApprovedUser(req);
    const result = await initializePayment({
      userId: user._id,
      email: user.email,
      name: user.name,
      planSlug: body.data.planSlug,
    });
    res.json(result);
  }),
);

/**
 * Chapa webhook — payload contains the transaction status. We verify the
 * HMAC signature (Chapa-Signature header) against the raw body, then
 * activate the plan when status==='success'.
 */
chapaRouter.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    const signature =
      (req.headers["chapa-signature"] as string | undefined) ??
      (req.headers["x-chapa-signature"] as string | undefined);

    if (!rawBody || !verifyWebhookSignature(rawBody, signature)) {
      throw new HttpError(401, "Invalid Chapa webhook signature");
    }

    const body = req.body as {
      status?: string;
      tx_ref?: string;
      meta?: { planSlug?: PlanSlug; userId?: string };
    };
    if (body.status !== "success") {
      res.json({ ok: true, ignored: true });
      return;
    }
    if (!body.tx_ref || !body.meta?.planSlug || !body.meta?.userId) {
      throw new HttpError(400, "Webhook missing tx_ref/meta");
    }

    // Double-check with Chapa rather than trusting the webhook body alone.
    const verified = await verifyTransaction(body.tx_ref);
    if (!verified.ok) throw new HttpError(400, "Chapa verification failed");

    await handleSuccessfulPayment({
      txRef: body.tx_ref,
      planSlug: body.meta.planSlug,
      userId: body.meta.userId,
    });

    res.json({ ok: true });
  }),
);

/**
 * Return-URL fallback (no signed webhook) — client polls this after Chapa
 * redirects back. Idempotent: re-running on the same tx_ref re-activates
 * the same plan window without compounding.
 */
chapaRouter.post(
  "/confirm",
  asyncHandler(async (req, res) => {
    const schema = z.object({ tx_ref: z.string().min(1), planSlug: z.enum(["student", "premium"]) });
    const body = schema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    const user = requireApprovedUser(req);
    const verified = await verifyTransaction(body.data.tx_ref);
    if (!verified.ok) throw new HttpError(400, "Payment not confirmed");
    await handleSuccessfulPayment({
      txRef: body.data.tx_ref,
      planSlug: body.data.planSlug,
      userId: user._id,
    });
    res.json({ ok: true });
  }),
);

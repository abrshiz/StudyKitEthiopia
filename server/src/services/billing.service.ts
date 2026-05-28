import { Plan } from "../models/index.js";
import { mapPlan } from "../mappers/index.js";
import { HttpError } from "../utils/http.js";
import {
  initializePayment,
  isChapaConfigured,
} from "./chapa.service.js";

export async function listPlans() {
  const docs = await Plan.find().sort({ sortOrder: 1 }).lean();
  return docs.map((d) => mapPlan(d as never));
}

export async function createCheckout(input: {
  planId: string;
  method: string;
  user: { _id: string; email: string; name: string };
}) {
  if (input.method.toLowerCase() === "free" || input.planId === "free") {
    return { checkoutUrl: null, message: "Free plan does not require payment" };
  }
  if (!isChapaConfigured()) {
    throw new HttpError(503, "Online payments are not configured (Chapa)");
  }
  const result = await initializePayment({
    userId: input.user._id,
    email: input.user.email,
    name: input.user.name,
    planSlug: input.planId,
  });
  return {
    checkoutUrl: result.checkoutUrl,
    txRef: result.txRef,
    plan: result.plan,
  };
}

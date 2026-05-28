import { Plan } from "../models/index.js";
import { mapPlan } from "../mappers/index.js";

export async function listPlans() {
  const docs = await Plan.find().sort({ sortOrder: 1 }).lean();
  return docs.map((d) => mapPlan(d as never));
}

export async function createCheckout(_input: { planId: string; method: string }) {
  return { checkoutUrl: undefined };
}

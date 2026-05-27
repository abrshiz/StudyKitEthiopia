import type { SubscriptionPlan } from "@/lib/types";

/** Product tiers — not live billing data. */
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    features: ["5 downloads/day", "Basic AI chat (10 msgs)", "Single department", "Ads supported"],
  },
  {
    id: "student",
    name: "Student",
    price: 199,
    period: "month",
    popular: true,
    features: ["50 downloads/day", "Unlimited AI chat", "All departments", "Offline mode", "No ads"],
  },
  {
    id: "semester",
    name: "Semester",
    price: 899,
    period: "semester",
    features: [
      "Everything in Student",
      "Priority AI model",
      "Group study rooms",
      "Past exam archive",
      "Save 25%",
    ],
  },
];

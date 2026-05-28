import { Badge, User, UserBadge, type UserDocument } from "../models/index.js";
import { HttpError } from "../utils/http.js";

export type PlanSlug = "free" | "student" | "premium";

/** How many study kits a user is allowed to create per UTC month. */
export const PLAN_MONTHLY_KITS: Record<PlanSlug, number> = {
  free: 3,
  student: 30,
  premium: Number.POSITIVE_INFINITY,
};

/** Max number of PDF pages per uploaded source. */
export const PLAN_PDF_PAGE_LIMITS: Record<PlanSlug, number> = {
  free: 20,
  student: 200,
  premium: 500,
};

/** Max number of quiz questions that can be generated per kit. */
export const PLAN_QUIZ_LIMITS: Record<PlanSlug, number> = {
  free: 10,
  student: 50,
  premium: 200,
};

/** Max number of flashcards that can be generated per kit. */
export const PLAN_FLASHCARD_LIMITS: Record<PlanSlug, number> = {
  free: 30,
  student: 100,
  premium: 400,
};

/** Gemini model used per plan. */
export const PLAN_GEMINI_MODEL: Record<PlanSlug, string> = {
  free: "gemini-1.5-flash",
  student: "gemini-1.5-flash",
  premium: "gemini-1.5-pro",
};

const BADGE_TIERS: Array<{ threshold: number; slug: string; name: string; icon: string }> = [
  { threshold: 100, slug: "kit-creator-gold", name: "Gold Creator", icon: "🥇" },
  { threshold: 25, slug: "kit-creator-silver", name: "Silver Creator", icon: "🥈" },
  { threshold: 5, slug: "kit-creator-bronze", name: "Bronze Creator", icon: "🥉" },
];

export function startOfDayUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function startOfMonthUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function isSubscriptionActive(
  sub: { plan: PlanSlug; expiryDate?: Date | null } | undefined | null,
) {
  if (!sub) return false;
  if (sub.plan === "free") return true;
  if (!sub.expiryDate) return false;
  return new Date(sub.expiryDate).getTime() > Date.now();
}

export function resolveActivePlan(user: UserDocument): PlanSlug {
  const plan = (user.subscription?.plan ?? "free") as PlanSlug;
  if (plan === "free") return "free";
  if (!isSubscriptionActive(user.subscription as never)) return "free";
  return plan;
}

/**
 * Throw 429 if the user has hit their monthly kit-creation quota for the
 * resolved active plan. Resets the counter on the 1st of every UTC month.
 * Returns the post-increment state so callers can preview "X of Y used".
 *
 * Call with `commit=false` for a pre-flight check that does not consume the
 * quota — useful in client-facing endpoints that only want to surface
 * upgrade prompts.
 */
export async function assertKitQuota(
  userId: string,
  { commit = true }: { commit?: boolean } = {},
): Promise<{ plan: PlanSlug; used: number; limit: number; remaining: number }> {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const plan = resolveActivePlan(user);
  const limit = PLAN_MONTHLY_KITS[plan];
  const monthStart = startOfMonthUtc();
  const lastReset = user.subscription?.monthlyResetAt
    ? new Date(user.subscription.monthlyResetAt)
    : new Date(0);

  if (lastReset.getTime() < monthStart.getTime()) {
    user.subscription.kitsCreatedThisMonth = 0;
    user.subscription.monthlyResetAt = monthStart;
  }

  const used = user.subscription.kitsCreatedThisMonth ?? 0;
  if (Number.isFinite(limit) && used >= limit) {
    throw new HttpError(
      429,
      `Monthly study-kit quota reached (${limit} on the ${plan} plan). Upgrade or wait until next month.`,
    );
  }

  if (commit) {
    user.subscription.kitsCreatedThisMonth = used + 1;
    await user.save();
    await awardCreatorBadges(userId, user.subscription.kitsCreatedThisMonth);
    return {
      plan,
      used: user.subscription.kitsCreatedThisMonth,
      limit,
      remaining: Number.isFinite(limit)
        ? Math.max(0, limit - user.subscription.kitsCreatedThisMonth)
        : Number.POSITIVE_INFINITY,
    };
  }

  return {
    plan,
    used,
    limit,
    remaining: Number.isFinite(limit) ? Math.max(0, limit - used) : Number.POSITIVE_INFINITY,
  };
}

/**
 * Award creator-tier badges based on lifetime kits created in the current
 * month bucket. Idempotent — existing slugs in `user.badges` aren't re-added.
 */
export async function awardCreatorBadges(userId: string, totalKits: number) {
  const earned: string[] = [];
  for (const tier of BADGE_TIERS) {
    if (totalKits >= tier.threshold) earned.push(tier.slug);
  }
  if (!earned.length) return;

  const user = await User.findById(userId);
  if (!user) return;

  const fresh = earned.filter((slug) => !(user.badges ?? []).includes(slug));
  if (!fresh.length) return;

  user.badges = Array.from(new Set([...(user.badges ?? []), ...fresh]));
  await user.save();

  for (const slug of fresh) {
    const tier = BADGE_TIERS.find((t) => t.slug === slug)!;
    const badge = await Badge.findOneAndUpdate(
      { slug: tier.slug },
      {
        $setOnInsert: {
          slug: tier.slug,
          name: tier.name,
          icon: tier.icon,
          description: `Awarded for ${tier.threshold} study kits created`,
        },
      },
      { new: true, upsert: true },
    );
    await UserBadge.updateOne(
      { userId, badgeId: badge!._id },
      { $setOnInsert: { userId, badgeId: badge!._id, earnedAt: new Date() } },
      { upsert: true },
    );
  }
}

/**
 * Bump streak on user activity. Streak = consecutive UTC days the user took
 * an action (created a kit, reviewed flashcards, ran a quiz). Returns the
 * new streak.
 */
export async function touchStreak(userId: string): Promise<{ streakDays: number }> {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  const today = startOfDayUtc();
  const last = user.subscription?.lastActiveDate
    ? startOfDayUtc(new Date(user.subscription.lastActiveDate))
    : null;

  let next = user.subscription?.streakDays ?? 0;
  if (!last) {
    next = 1;
  } else {
    const diffDays = Math.round((today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) {
      next = next || 1;
    } else if (diffDays === 1) {
      next = next + 1;
    } else {
      next = 1;
    }
  }

  user.subscription.streakDays = next;
  user.subscription.lastActiveDate = today;
  await user.save();

  return { streakDays: next };
}

/** Mark a paid plan active on the user for 30 days. */
export async function activatePlan(userId: string, plan: PlanSlug, days = 30) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");
  user.subscription.plan = plan;
  user.subscription.expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  // Reset the monthly counter so the user sees their fresh allotment immediately.
  user.subscription.kitsCreatedThisMonth = 0;
  user.subscription.monthlyResetAt = startOfMonthUtc();
  await user.save();
  return user;
}

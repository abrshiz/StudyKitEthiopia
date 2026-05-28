import { User, UserBadge, Badge } from "../models/index.js";
import { HttpError } from "../utils/http.js";

export type PlanSlug = "free" | "student" | "premium";

export const PLAN_DAILY_LIMITS: Record<PlanSlug, number> = {
  free: 5,
  student: 50,
  premium: 50,
};

const BADGE_TIERS: Array<{ threshold: number; slug: string; name: string; icon: string }> = [
  { threshold: 100, slug: "downloader-gold", name: "Gold Scholar", icon: "🥇" },
  { threshold: 50, slug: "downloader-silver", name: "Silver Scholar", icon: "🥈" },
  { threshold: 10, slug: "downloader-bronze", name: "Bronze Scholar", icon: "🥉" },
];

export function startOfDayUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function planLimit(plan: PlanSlug): number {
  return PLAN_DAILY_LIMITS[plan] ?? PLAN_DAILY_LIMITS.free;
}

export function isSubscriptionActive(sub: { plan: PlanSlug; expiryDate?: Date | null } | undefined | null) {
  if (!sub) return false;
  if (sub.plan === "free") return true;
  if (!sub.expiryDate) return false;
  return new Date(sub.expiryDate).getTime() > Date.now();
}

/**
 * Reset the daily counter if a new UTC day has rolled over, then verify the
 * user has a download left. Throws 429 if exhausted.
 */
export async function consumeDailyDownload(userId: string): Promise<{ left: number; limit: number; plan: PlanSlug }> {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, "User not found");

  // Auto-downgrade if paid plan has expired.
  if (user.subscription?.plan && user.subscription.plan !== "free" && !isSubscriptionActive(user.subscription as never)) {
    user.subscription.plan = "free";
    user.subscription.expiryDate = null;
  }

  const plan = (user.subscription?.plan ?? "free") as PlanSlug;
  const limit = planLimit(plan);
  const today = startOfDayUtc();
  const reset = user.subscription?.dailyDownloadsResetAt
    ? new Date(user.subscription.dailyDownloadsResetAt)
    : new Date(0);

  if (reset.getTime() < today.getTime()) {
    user.subscription.dailyDownloadsLeft = limit;
    user.subscription.dailyDownloadsResetAt = today;
  }

  if ((user.subscription.dailyDownloadsLeft ?? 0) <= 0) {
    throw new HttpError(
      429,
      `Daily download limit reached (${limit}/day on ${plan}). Upgrade or try again tomorrow.`,
    );
  }

  user.subscription.dailyDownloadsLeft -= 1;
  user.subscription.totalDownloads = (user.subscription.totalDownloads ?? 0) + 1;
  await user.save();

  await awardDownloadBadges(userId, user.subscription.totalDownloads);

  return { left: user.subscription.dailyDownloadsLeft, limit, plan };
}

export async function awardDownloadBadges(userId: string, total: number) {
  const earned: string[] = [];
  for (const tier of BADGE_TIERS) {
    if (total >= tier.threshold) earned.push(tier.slug);
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
          description: `Awarded for ${tier.threshold} lifetime downloads`,
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
 * an action (view material, ask AI, log in). Returns the new streak.
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
  user.subscription.dailyDownloadsLeft = planLimit(plan);
  user.subscription.dailyDownloadsResetAt = startOfDayUtc();
  await user.save();
  return user;
}

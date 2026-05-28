import { Badge, CourseProgress, UserBadge, UserProgress } from "../models/index.js";
import type { RequestUser } from "../middleware/user-context.js";

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export async function getProgressForUser(user: RequestUser) {
  const [stats, courses, allBadges, earned] = await Promise.all([
    UserProgress.findOne({ userId: user._id }).lean(),
    CourseProgress.find({ userId: user._id }).sort({ percent: -1 }).lean(),
    Badge.find().lean(),
    UserBadge.find({ userId: user._id }).lean(),
  ]);

  const earnedIds = new Set(earned.map((e) => String(e.badgeId)));

  const s = stats ?? {
    currentStreakDays: 0,
    longestStreakDays: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    weeklyMinutes: 0,
    materialsRead: 0,
  };

  return {
    currentStreak: `${s.currentStreakDays} days`,
    longestStreak: `${s.longestStreakDays} days`,
    weeklyHours: formatHours(s.weeklyMinutes),
    materialsRead: s.materialsRead,
    weeklyActivity: s.weeklyActivity,
    badges: allBadges.map((b) => ({
      name: b.name,
      icon: b.icon,
      earned: earnedIds.has(String(b._id)),
      description: b.description,
    })),
    courses: courses.map((c) => ({
      course: c.course,
      percent: c.percent,
      hours: c.hoursLabel,
    })),
  };
}

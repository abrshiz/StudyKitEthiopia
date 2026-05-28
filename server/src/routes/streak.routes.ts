import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { requireApprovedUser } from "../middleware/auth.middleware.js";
import { touchStreak } from "../services/subscription.service.js";
import { AuditLog } from "../models/index.js";

export const streakRouter = Router();

streakRouter.post(
  "/check",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const result = await touchStreak(user._id);
    res.json(result);
  }),
);

/**
 * Returns the last `days` (default 180) days of activity for the calendar heatmap.
 * Day buckets are UTC; value is the number of audit-log entries that day.
 */
streakRouter.get(
  "/calendar",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const days = Math.min(Number(req.query.days ?? 180), 365);
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - days);

    const docs = await AuditLog.aggregate([
      { $match: { userId: { $exists: true }, createdAt: { $gte: since } } },
      { $match: { userEmail: user.email } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(docs.map((d: { _id: string; count: number }) => ({ day: d._id, count: d.count })));
  }),
);

import {
  AuditLog,
  Material,
  SupportTicket,
  User,
} from "../models/index.js";
import { formatRelativeTime, toId } from "../utils/serialize.js";
import { roleLabel } from "../utils/role-from-email.js";
import { HttpError } from "../utils/http.js";
import type { RequestUser } from "../middleware/user-context.js";

export async function getAdminDashboard() {
  const [userCount, materialCount, downloadsToday, recentMaterials, tickets, audit] =
    await Promise.all([
      User.countDocuments(),
      Material.countDocuments(),
      Material.aggregate([
        { $match: { updatedAt: { $gte: new Date(Date.now() - 86_400_000) } } },
        { $group: { _id: null, total: { $sum: "$downloadCount" } } },
      ]),
      Material.find()
        .sort({ createdAt: -1 })
        .limit(4)
        .populate("departmentId", "name")
        .populate("uploadedById", "name")
        .lean(),
      SupportTicket.find().sort({ createdAt: -1 }).limit(10).populate("userId", "email").lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(20).lean(),
    ]);

  const dl = downloadsToday[0]?.total ?? 0;

  return {
    kpis: [
      { label: "Registered users", value: String(userCount), delta: "all time" },
      { label: "Materials", value: String(materialCount), delta: "in library" },
      { label: "Downloads (est.)", value: String(dl), delta: "last 24h" },
      { label: "Support tickets", value: String(tickets.length), delta: "recent" },
    ],
    recentUploads: recentMaterials.map((m) => ({
      title: m.title,
      department: (m.departmentId as { name?: string })?.name ?? "—",
      uploader: (m.uploadedById as { name?: string })?.name ?? "—",
    })),
    topMaterials: (
      await Material.find().sort({ downloadCount: -1 }).limit(4).select("title downloadCount").lean()
    ).map((m) => ({ title: m.title, downloads: m.downloadCount })),
    tickets: tickets.map((t) => ({
      id: `T-${String(t._id).slice(-4)}`,
      subject: t.subject,
      user: (t.userId as { email?: string })?.email ?? "—",
      status: t.status,
      time: formatRelativeTime(t.createdAt),
    })),
    auditLog: audit.map((a) => [
      a.createdAt.toISOString().slice(0, 16).replace("T", " "),
      a.userEmail || "—",
      a.action,
      a.detail,
    ] as [string, string, string, string]),
  };
}

export async function listPendingUsers() {
  const users = await User.find({ approvalStatus: "pending" })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return users.map((u) => ({
    id: toId(u),
    name: u.name,
    email: u.email,
    role: u.role,
    roleLabel: roleLabel(u.role),
    university: u.university ?? "—",
    requestedAt: formatRelativeTime(u.createdAt),
  }));
}

export async function approveUser(admin: RequestUser, userId: string) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      approvalStatus: "approved",
      approvedAt: new Date(),
      approvedById: admin._id,
    },
    { new: true },
  );
  if (!user) throw new HttpError(404, "User not found");

  await AuditLog.create({
    userEmail: admin.email,
    action: "approve_user",
    detail: `Approved ${user.email} (${user.role})`,
  });

  return {
    id: toId(user),
    email: user.email,
    approvalStatus: user.approvalStatus,
  };
}

export async function rejectUser(admin: RequestUser, userId: string) {
  const user = await User.findByIdAndUpdate(
    userId,
    { approvalStatus: "rejected", approvedAt: new Date(), approvedById: admin._id },
    { new: true },
  );
  if (!user) throw new HttpError(404, "User not found");

  await AuditLog.create({
    userEmail: admin.email,
    action: "reject_user",
    detail: `Rejected ${user.email}`,
  });

  return {
    id: toId(user),
    email: user.email,
    approvalStatus: user.approvalStatus,
  };
}

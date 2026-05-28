import {
  AuditLog,
  Department,
  Material,
  Notification,
  SupportTicket,
  User,
} from "../models/index.js";
import { formatRelativeTime, toId } from "../utils/serialize.js";
import { roleLabel } from "../utils/role-from-email.js";
import { HttpError } from "../utils/http.js";
import type { RequestUser } from "../middleware/auth.middleware.js";
import { isResendConfigured, sendEmail } from "./resend.service.js";

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
      await Material.find()
        .sort({ downloadCount: -1 })
        .limit(4)
        .select("title downloadCount")
        .lean()
    ).map((m) => ({ title: m.title, downloads: m.downloadCount })),
    tickets: tickets.map((t) => ({
      id: `T-${String(t._id).slice(-4)}`,
      subject: t.subject,
      user: (t.userId as { email?: string })?.email ?? "—",
      status: t.status,
      time: formatRelativeTime(t.createdAt),
    })),
    auditLog: audit.map(
      (a) =>
        [
          a.createdAt.toISOString().slice(0, 16).replace("T", " "),
          a.userEmail || "—",
          a.action,
          a.detail,
        ] as [string, string, string, string],
    ),
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

/** Promote a user to professor scoped to a department. Admin only. */
export async function promoteToProfessor(
  admin: RequestUser,
  userId: string,
  departmentId: string,
) {
  const department = await Department.findById(departmentId);
  if (!department) throw new HttpError(404, "Department not found");
  const user = await User.findByIdAndUpdate(
    userId,
    {
      role: "professor",
      professorDepartmentId: department._id,
      approvalStatus: "approved",
      approvedAt: new Date(),
      approvedById: admin._id,
    },
    { new: true },
  ).populate({ path: "departmentId", select: "name college" });
  if (!user) throw new HttpError(404, "User not found");

  await AuditLog.create({
    userId: admin._id,
    userEmail: admin.email,
    action: "promote_professor",
    detail: `Promoted ${user.email} → professor for ${department.name}`,
  });

  return {
    id: toId(user),
    email: user.email,
    role: user.role,
    professorDepartmentId: String(department._id),
  };
}

export async function getAdminAnalytics(
  _admin: RequestUser,
  range: { days?: number; departmentId?: string } = {},
) {
  const days = Math.min(Math.max(range.days ?? 30, 1), 180);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days);

  const materialFilter: Record<string, unknown> = {};
  if (range.departmentId) materialFilter.departmentId = range.departmentId;

  const ticketFilter: Record<string, unknown> = {};
  if (range.departmentId) ticketFilter.departmentId = range.departmentId;

  const userFilter: Record<string, unknown> = {};
  if (range.departmentId) {
    userFilter.$or = [
      { departmentId: range.departmentId },
      { professorDepartmentId: range.departmentId },
    ];
  }

  // For department-scoped downloads we look at AuditLog → join materialId →
  // department; cheap-and-cheerful: filter materials first, then count.
  const materialIds = range.departmentId
    ? (await Material.find(materialFilter).select("_id").lean()).map((m) => m._id)
    : null;

  const auditMatch: Record<string, unknown> = {
    action: "download",
    createdAt: { $gte: since },
  };
  if (materialIds) auditMatch.materialId = { $in: materialIds };

  const [usersByRole, downloadsPerDay, popular, totals] = await Promise.all([
    User.aggregate([
      ...(range.departmentId
        ? [
            {
              $match: {
                $or: [
                  { departmentId: range.departmentId },
                  { professorDepartmentId: range.departmentId },
                ],
              },
            },
          ]
        : []),
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    AuditLog.aggregate([
      { $match: auditMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Material.find(materialFilter)
      .sort({ downloadCount: -1 })
      .limit(10)
      .select("title downloadCount")
      .lean(),
    Promise.all([
      User.countDocuments(userFilter),
      Material.countDocuments(materialFilter),
      SupportTicket.countDocuments(ticketFilter),
      AuditLog.countDocuments(auditMatch),
    ]),
  ]);

  return {
    usersByRole: usersByRole.map((u: { _id: string; count: number }) => ({
      role: u._id,
      count: u.count,
    })),
    downloadsPerDay: downloadsPerDay.map((d: { _id: string; count: number }) => ({
      day: d._id,
      count: d.count,
    })),
    popularMaterials: popular.map((m) => ({
      id: String(m._id),
      title: m.title,
      downloads: m.downloadCount,
    })),
    totals: {
      users: totals[0],
      materials: totals[1],
      tickets: totals[2],
      downloads: totals[3],
    },
  };
}

export type BroadcastInput = {
  subject: string;
  body: string;
  audience: {
    role?: "student" | "professor" | "admin" | "all";
    departmentId?: string;
  };
  channels: { email: boolean; inApp: boolean };
};

export async function broadcastNotification(admin: RequestUser, input: BroadcastInput) {
  const filter: Record<string, unknown> = { approvalStatus: "approved" };
  if (input.audience.role && input.audience.role !== "all") {
    filter.role = input.audience.role;
  }
  if (input.audience.departmentId) {
    filter.$or = [
      { departmentId: input.audience.departmentId },
      { professorDepartmentId: input.audience.departmentId },
    ];
  }

  const users = await User.find(filter).select("_id email name").lean();
  if (!users.length) {
    return { recipients: 0, inAppSent: 0, emailSent: 0, emailFailed: 0 };
  }

  let inAppSent = 0;
  if (input.channels.inApp) {
    const docs = users.map((u) => ({
      userId: u._id,
      title: input.subject,
      body: input.body,
      type: "system",
      read: false,
    }));
    const inserted = await Notification.insertMany(docs, { ordered: false });
    inAppSent = inserted.length;
  }

  let emailSent = 0;
  let emailFailed = 0;
  if (input.channels.email && isResendConfigured()) {
    for (const u of users) {
      if (!u.email) {
        emailFailed += 1;
        continue;
      }
      const html = `
        <p>Hi ${u.name ?? "there"},</p>
        <div>${input.body.replace(/\n/g, "<br/>")}</div>
        <p>— StudyKit ET</p>
      `;
      const r = await sendEmail({ to: u.email, subject: input.subject, html });
      if (r.ok) emailSent += 1;
      else emailFailed += 1;
    }
  }

  await AuditLog.create({
    userId: admin._id,
    userEmail: admin.email,
    action: "broadcast",
    detail: `Broadcast "${input.subject}" to ${users.length} recipients`,
  });

  return { recipients: users.length, inAppSent, emailSent, emailFailed };
}

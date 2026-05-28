import type {
  CourseDocument,
  DepartmentDocument,
  MaterialDocument,
  PlanDocument,
  UserDocument,
} from "../models/index.js";
import { roleLabel } from "../utils/role-from-email.js";
import type { NotificationDocument } from "../models/Notification.js";
import type { ChatMessageDocument } from "../models/ChatMessage.js";
import { formatRelativeTime, toId } from "../utils/serialize.js";

export function mapDepartment(doc: DepartmentDocument) {
  return {
    id: toId(doc),
    name: doc.name,
    college: doc.college,
    students: doc.studentCount,
  };
}

export function mapCourse(doc: CourseDocument) {
  return {
    id: toId(doc),
    departmentId: String(doc.departmentId),
    code: doc.code,
    title: doc.title,
    year: doc.year,
    semester: doc.semester,
    credits: doc.credits,
    active: doc.active,
  };
}

export function mapMaterial(doc: MaterialDocument) {
  return {
    id: toId(doc),
    title: doc.title,
    type: doc.type,
    course: doc.course,
    courseCode: doc.courseCode ?? "",
    courseId: doc.courseId ? String(doc.courseId) : undefined,
    semester: doc.semester,
    size: doc.sizeLabel,
    updated: formatRelativeTime(doc.updatedAt),
    downloads: doc.downloadCount,
    expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString() : null,
    expired: doc.expiryDate ? new Date(doc.expiryDate).getTime() < Date.now() : false,
    departmentId: doc.departmentId ? String(doc.departmentId) : undefined,
    uploadedById: doc.uploadedById ? String(doc.uploadedById) : undefined,
  };
}

export function mapPlan(doc: PlanDocument) {
  return {
    id: doc.slug,
    name: doc.name,
    price: doc.price,
    period: doc.period,
    popular: doc.popular,
    features: doc.features,
  };
}

export function mapNotification(doc: NotificationDocument) {
  return {
    id: toId(doc),
    title: doc.title,
    body: doc.body,
    time: formatRelativeTime(doc.createdAt),
    read: doc.read,
    type: doc.type,
  };
}

export function mapChatMessage(doc: ChatMessageDocument) {
  return {
    id: toId(doc),
    role: doc.role,
    text: doc.text,
  };
}

export type PublicSubscription = {
  plan: "free" | "student" | "premium";
  expiryDate: string | null;
  kitsCreatedThisMonth: number;
  monthlyResetAt: string | null;
  streakDays: number;
  lastActiveDate: string | null;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "professor";
  roleLabel: string;
  university?: string;
  year?: string;
  department?: { id: string; name: string; college: string };
  badges: string[];
  subscription: PublicSubscription;
};

export function mapPublicUser(doc: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  university?: string | null;
  year?: string | null;
  departmentId?: null | { _id: unknown; name: string; college: string } | unknown;
  badges?: string[];
  subscription?: Partial<UserDocument["subscription"]> | null;
}): PublicUser {
  const role = (doc.role === "professor" ? "professor" : "student") as "student" | "professor";
  const sub = doc.subscription ?? {};
  const result: PublicUser = {
    id: doc._id ? String(doc._id) : "",
    name: doc.name,
    email: doc.email,
    role,
    roleLabel: roleLabel(role),
    university: doc.university ?? undefined,
    year: doc.year ?? undefined,
    badges: Array.isArray(doc.badges) ? doc.badges : [],
    subscription: {
      plan: (sub.plan as PublicSubscription["plan"]) ?? "free",
      expiryDate: sub.expiryDate ? new Date(sub.expiryDate as Date).toISOString() : null,
      kitsCreatedThisMonth:
        typeof sub.kitsCreatedThisMonth === "number" ? sub.kitsCreatedThisMonth : 0,
      monthlyResetAt: sub.monthlyResetAt
        ? new Date(sub.monthlyResetAt as Date).toISOString()
        : null,
      streakDays: typeof sub.streakDays === "number" ? sub.streakDays : 0,
      lastActiveDate: sub.lastActiveDate
        ? new Date(sub.lastActiveDate as Date).toISOString()
        : null,
    },
  };

  const dept = doc.departmentId;
  if (dept && typeof dept === "object" && "name" in dept && "college" in dept && "_id" in dept) {
    const d = dept as { _id: { toString(): string }; name: string; college: string };
    result.department = {
      id: d._id.toString(),
      name: d.name,
      college: d.college,
    };
  }

  return result;
}

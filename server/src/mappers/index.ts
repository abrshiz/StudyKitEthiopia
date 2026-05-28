import type { DepartmentDocument, MaterialDocument, PlanDocument, UserDocument } from "../models/index.js";
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

export function mapMaterial(doc: MaterialDocument) {
  return {
    id: toId(doc),
    title: doc.title,
    type: doc.type,
    course: doc.course,
    semester: doc.semester,
    size: doc.sizeLabel,
    updated: formatRelativeTime(doc.updatedAt),
    downloads: doc.downloadCount,
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

export function mapPublicUser(doc: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  approvalStatus?: UserDocument["approvalStatus"];
  university?: string | null;
  year?: string | null;
  departmentId?:
    | null
    | { _id: unknown; name: string; college: string }
    | unknown;
}) {
  const role = doc.role as "student" | "professor" | "admin";
  const result: {
    name: string;
    email: string;
    role: "student" | "professor" | "admin";
    roleLabel: string;
    approvalStatus: "pending" | "approved" | "rejected";
    university?: string;
    year?: string;
    department?: { id: string; name: string; college: string };
  } = {
    name: doc.name,
    email: doc.email,
    role,
    roleLabel: roleLabel(role),
    approvalStatus: doc.approvalStatus ?? "pending",
    university: doc.university ?? undefined,
    year: doc.year ?? undefined,
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

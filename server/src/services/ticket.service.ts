import { Material, SupportTicket } from "../models/index.js";
import { mapSupportTicket } from "../mappers/index.js";
import { HttpError } from "../utils/http.js";
import type { RequestUser } from "../middleware/auth.middleware.js";

const populate = [
  { path: "userId", select: "name email" },
  { path: "departmentId", select: "name" },
];

export async function createTicket(user: RequestUser, input: {
  subject: string;
  message: string;
  departmentId?: string;
  materialId?: string;
}) {
  const subject = input.subject.trim();
  if (!subject) throw new HttpError(400, "Subject required");

  let departmentId = input.departmentId ?? null;
  if (input.materialId && !departmentId) {
    const mat = await Material.findById(input.materialId).lean();
    if (mat) departmentId = String(mat.departmentId);
  }

  const ticket = await SupportTicket.create({
    userId: user._id,
    subject,
    message: input.message.trim(),
    status: "Open",
    departmentId: departmentId ?? null,
    materialId: input.materialId ?? null,
  });
  const populated = await SupportTicket.findById(ticket._id).populate(populate);
  return mapSupportTicket(populated as never);
}

export async function listTickets(user: RequestUser, query: { status?: string; departmentId?: string }) {
  const filter: Record<string, unknown> = {};

  if (user.role === "student") {
    filter.userId = user._id;
  } else if (user.role === "professor") {
    if (!user.professorDepartmentId) {
      return [];
    }
    filter.departmentId = user.professorDepartmentId;
  }
  // admin: no scope filter

  if (query.status) filter.status = query.status;
  if (query.departmentId && user.role !== "professor") {
    filter.departmentId = query.departmentId;
  }

  const docs = await SupportTicket.find(filter)
    .populate(populate)
    .sort({ createdAt: -1 })
    .limit(200);
  return docs.map((d) => mapSupportTicket(d as never));
}

async function loadAuthorizedTicket(id: string, user: RequestUser) {
  const ticket = await SupportTicket.findById(id).populate(populate);
  if (!ticket) throw new HttpError(404, "Ticket not found");

  if (user.role === "student") {
    if (String(ticket.userId?._id ?? ticket.userId) !== user._id) {
      throw new HttpError(403, "Not your ticket");
    }
  } else if (user.role === "professor") {
    const deptId = String(
      (ticket.departmentId as { _id?: unknown } | null)?._id ?? ticket.departmentId,
    );
    if (deptId !== user.professorDepartmentId) {
      throw new HttpError(403, "Ticket belongs to another department");
    }
  }
  return ticket;
}

export async function replyToTicket(
  id: string,
  user: RequestUser,
  body: { message: string },
) {
  if (user.role === "student") throw new HttpError(403, "Students cannot reply");
  const ticket = await loadAuthorizedTicket(id, user);
  ticket.adminResponse = body.message.trim();
  ticket.assignedToId = user._id as never;
  if (ticket.status === "Open") ticket.status = "In progress";
  await ticket.save();
  const reloaded = await SupportTicket.findById(ticket._id).populate(populate);
  return mapSupportTicket(reloaded as never);
}

export async function closeTicket(id: string, user: RequestUser) {
  if (user.role === "student") throw new HttpError(403, "Only staff can close tickets");
  const ticket = await loadAuthorizedTicket(id, user);
  ticket.status = "Resolved";
  ticket.resolvedAt = new Date();
  await ticket.save();
  const reloaded = await SupportTicket.findById(ticket._id).populate(populate);
  return mapSupportTicket(reloaded as never);
}

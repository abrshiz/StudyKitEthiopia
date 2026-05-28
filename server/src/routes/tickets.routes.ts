import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../utils/http.js";
import { requireApprovedUser } from "../middleware/auth.middleware.js";
import {
  closeTicket,
  createTicket,
  listTickets,
  replyToTicket,
} from "../services/ticket.service.js";
import { AuditLog } from "../models/index.js";

export const ticketsRouter = Router();

const createSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(3),
  departmentId: z.string().optional(),
  materialId: z.string().optional(),
});

ticketsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    const user = requireApprovedUser(req);
    const ticket = await createTicket(user, body.data);
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      action: "ticket",
      detail: `Created ticket "${ticket.subject}"`,
      ip: req.ip ?? "",
    });
    res.status(201).json(ticket);
  }),
);

ticketsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const departmentId =
      typeof req.query.departmentId === "string" ? req.query.departmentId : undefined;
    res.json(await listTickets(user, { status, departmentId }));
  }),
);

const replySchema = z.object({ message: z.string().min(1) });

ticketsRouter.patch(
  "/:id/reply",
  asyncHandler(async (req, res) => {
    const body = replySchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    const user = requireApprovedUser(req);
    const ticket = await replyToTicket(String(req.params.id), user, body.data);
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      action: "ticket_reply",
      detail: `Replied to "${ticket.subject}"`,
    });
    res.json(ticket);
  }),
);

ticketsRouter.patch(
  "/:id/close",
  asyncHandler(async (req, res) => {
    const user = requireApprovedUser(req);
    const ticket = await closeTicket(String(req.params.id), user);
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      action: "ticket_close",
      detail: `Closed "${ticket.subject}"`,
    });
    res.json(ticket);
  }),
);

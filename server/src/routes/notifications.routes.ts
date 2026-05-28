import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { requireUser } from "../middleware/user-context.js";
import { listNotifications, markAllRead, markRead } from "../services/notification.service.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await listNotifications(requireUser(req)));
  }),
);

notificationsRouter.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await markAllRead(requireUser(req));
    res.status(204).end();
  }),
);

notificationsRouter.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    await markRead(requireUser(req), String(req.params.id));
    res.status(204).end();
  }),
);

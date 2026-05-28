import { Notification } from "../models/index.js";
import { mapNotification } from "../mappers/index.js";
import type { RequestUser } from "../middleware/user-context.js";

export async function listNotifications(user: RequestUser) {
  const docs = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50);
  return docs.map(mapNotification);
}

export async function markRead(user: RequestUser, id: string) {
  await Notification.updateOne({ _id: id, userId: user._id }, { read: true });
}

export async function markAllRead(user: RequestUser) {
  await Notification.updateMany({ userId: user._id, read: false }, { read: true });
}

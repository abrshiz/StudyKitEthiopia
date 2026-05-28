import type { Types } from "mongoose";

/** Map MongoDB documents to frontend-friendly `{ id: string }` shapes. */
export function toId(doc: { _id: Types.ObjectId | string }): string {
  return String(doc._id);
}

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

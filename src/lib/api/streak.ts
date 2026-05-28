import { apiFetch } from "./client";

export type StreakCalendarEntry = { day: string; count: number };

export async function fetchStreakCalendar(days = 180): Promise<StreakCalendarEntry[]> {
  return apiFetch<StreakCalendarEntry[]>(`/streak/calendar?days=${days}`);
}

export async function pingStreak(): Promise<{ streakDays: number }> {
  return apiFetch<{ streakDays: number }>("/streak/check", { method: "POST" });
}

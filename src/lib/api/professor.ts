import { apiFetch } from "./client";
import type { AdminAnalytics } from "@/lib/types";

export async function fetchProfessorAnalytics(days = 30): Promise<AdminAnalytics> {
  return apiFetch<AdminAnalytics>(`/professor/analytics?days=${days}`);
}

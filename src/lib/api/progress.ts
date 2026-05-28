import { apiFetch } from "./client";
import type { ProgressSummary } from "@/lib/types";

export async function fetchProgress(): Promise<ProgressSummary> {
  return apiFetch<ProgressSummary>("/progress");
}

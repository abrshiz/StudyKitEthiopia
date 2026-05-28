import { apiFetch } from "./client";
import type { SearchResults } from "@/lib/types";

export async function globalSearch(q: string): Promise<SearchResults> {
  const search = new URLSearchParams({ q: q.trim() });
  return apiFetch<SearchResults>(`/search?${search}`);
}

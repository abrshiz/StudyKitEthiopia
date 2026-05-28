import { fetchProgress } from "@/lib/api/progress";
import { useApiQuery } from "./use-api-query";

export function useProgress() {
  return useApiQuery(["progress"], () => fetchProgress(), { staleTime: 60_000 });
}

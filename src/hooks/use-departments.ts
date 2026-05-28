import { fetchDepartments } from "@/lib/api/departments";
import { useApiQuery } from "./use-api-query";

export function useDepartments(q: string, college: string) {
  return useApiQuery(
    ["departments", q, college],
    () => fetchDepartments({ q, college }),
    { staleTime: 60_000 },
  );
}

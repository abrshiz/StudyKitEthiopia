import { fetchAdminDashboard } from "@/lib/api/admin";
import { useApiQuery } from "./use-api-query";

export function useAdminDashboard(enabled = true) {
  return useApiQuery(["admin", "dashboard"], () => fetchAdminDashboard(), {
    enabled,
    staleTime: 30_000,
  });
}

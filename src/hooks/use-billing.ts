import { fetchPlans } from "@/lib/api/billing";
import { useApiQuery } from "./use-api-query";

export function usePlans() {
  return useApiQuery(["billing", "plans"], () => fetchPlans(), { staleTime: 300_000 });
}

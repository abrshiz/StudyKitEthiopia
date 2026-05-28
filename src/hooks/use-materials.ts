import { fetchMaterial, fetchMaterials } from "@/lib/api/materials";
import { useApiQuery } from "./use-api-query";
import { useAuth } from "@/context/auth-context";

export function useMaterials(q: string, year: string) {
  const { department } = useAuth();
  return useApiQuery(
    ["materials", department?.id, q, year],
    () => fetchMaterials({ q, year, departmentId: department?.id }),
    { staleTime: 30_000 },
  );
}

export function useMaterial(id: string | null) {
  return useApiQuery(["material", id], () => fetchMaterial(id!), {
    enabled: Boolean(id),
  });
}

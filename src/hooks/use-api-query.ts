import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { ApiError, isApiConfigured } from "@/lib/api/client";

export function useApiQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey,
    queryFn,
    enabled: isApiConfigured() && (options?.enabled ?? true),
    retry: (count, error) => {
      if (error instanceof ApiError && (error.status === 0 || error.status === 403 || error.status === 404))
        return false;
      return count < 2;
    },
    ...options,
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveUserApi,
  fetchPendingUsers,
  rejectUserApi,
} from "@/lib/api/admin-users";
import { useApiQuery } from "./use-api-query";

export function usePendingUsers(enabled = true) {
  return useApiQuery(["admin", "pending-users"], () => fetchPendingUsers(), {
    enabled,
    staleTime: 15_000,
  });
}

export function useApproveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveUserApi,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useRejectUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectUserApi,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

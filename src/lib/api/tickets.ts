import { apiFetch } from "./client";
import type { TicketRecord } from "@/lib/types";

export type CreateTicketInput = {
  subject: string;
  message: string;
  departmentId?: string;
  materialId?: string;
};

export async function createTicket(input: CreateTicketInput): Promise<TicketRecord> {
  return apiFetch<TicketRecord>("/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listTickets(params?: { status?: string; departmentId?: string }): Promise<TicketRecord[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.departmentId) search.set("departmentId", params.departmentId);
  const qs = search.toString();
  return apiFetch<TicketRecord[]>(`/tickets${qs ? `?${qs}` : ""}`);
}

export async function replyTicket(id: string, message: string): Promise<TicketRecord> {
  return apiFetch<TicketRecord>(`/tickets/${id}/reply`, {
    method: "PATCH",
    body: JSON.stringify({ message }),
  });
}

export async function closeTicket(id: string): Promise<TicketRecord> {
  return apiFetch<TicketRecord>(`/tickets/${id}/close`, { method: "PATCH" });
}

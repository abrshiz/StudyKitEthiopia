import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DataBoundary } from "@/components/shared/api-state";
import {
  closeTicket,
  listTickets,
  replyTicket,
} from "@/lib/api/tickets";
import type { TicketRecord } from "@/lib/types";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

export function TicketsPanel({ status }: { status?: string }) {
  const qc = useQueryClient();
  const query = useQuery<TicketRecord[]>({
    queryKey: ["tickets", status ?? "all"],
    queryFn: () => listTickets({ status }),
  });

  const reply = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => replyTicket(id, message),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Reply sent");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Reply failed"),
  });

  const close = useMutation({
    mutationFn: closeTicket,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket closed");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Close failed"),
  });

  return (
    <DataBoundary
      resource="Tickets"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      isEmpty={(query.data?.length ?? 0) === 0}
      emptyTitle="No tickets"
      emptyDescription="When students open tickets they'll appear here."
      onRetry={() => query.refetch()}
    >
      <div className="space-y-3">
        {query.data?.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            onReply={(msg) => reply.mutate({ id: t.id, message: msg })}
            replying={reply.isPending}
            onClose={() => close.mutate(t.id)}
            closing={close.isPending}
          />
        ))}
      </div>
    </DataBoundary>
  );
}

function TicketCard({
  ticket,
  onReply,
  replying,
  onClose,
  closing,
}: {
  ticket: TicketRecord;
  onReply: (message: string) => void;
  replying: boolean;
  onClose: () => void;
  closing: boolean;
}) {
  const [draft, setDraft] = useState(ticket.adminResponse ?? "");
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-medium truncate">{ticket.subject}</div>
            <Badge variant="outline" className="text-[10px]">
              {ticket.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {ticket.user.email} · {ticket.department?.name ?? "no department"} · {ticket.time}
          </p>
          {ticket.message && (
            <p className="text-sm mt-3 whitespace-pre-line">{ticket.message}</p>
          )}
          {ticket.adminResponse && (
            <Card className="p-3 mt-3 bg-accent/30">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Staff response
              </p>
              <p className="text-sm mt-1 whitespace-pre-line">{ticket.adminResponse}</p>
            </Card>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "Reply"}
          </Button>
          {ticket.status !== "Resolved" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              disabled={closing}
            >
              Close
            </Button>
          )}
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a reply…"
            rows={4}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => onReply(draft.trim())} disabled={replying || !draft.trim()}>
              {replying ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

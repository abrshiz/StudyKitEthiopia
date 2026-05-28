import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GuardedPage } from "@/components/auth/guarded-page";
import { createTicket } from "@/lib/api/tickets";
import { ApiError, isApiConfigured } from "@/lib/api/client";
import { toast } from "sonner";
import { LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/support/new")({
  head: () => ({ meta: [{ title: "New ticket — StudyKit ET" }] }),
  component: NewTicket,
});

function NewTicket() {
  return (
    <GuardedPage guard={{ requireAuth: true, requireApproved: true }}>
      <NewTicketPage />
    </GuardedPage>
  );
}

function NewTicketPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isApiConfigured()) {
      toast.error("API not configured");
      return;
    }
    if (subject.trim().length < 3 || message.trim().length < 3) {
      toast.error("Please add a subject and message");
      return;
    }
    setSubmitting(true);
    try {
      await createTicket({ subject: subject.trim(), message: message.trim() });
      toast.success("Ticket submitted");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl space-y-5">
        <PageHeader title="Open a support ticket" description="We'll route it to admin or your department's professor." />

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Describe the issue</span>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Cannot download CSE 202 lecture 3"
                required
                minLength={3}
              />
            </div>
            <div>
              <Label htmlFor="message">Details</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Walk us through what you tried and the error you saw."
                required
                minLength={3}
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/dashboard" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit ticket"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

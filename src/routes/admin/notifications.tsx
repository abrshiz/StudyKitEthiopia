import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { broadcastNotification } from "@/lib/api/admin";
import { useDepartments } from "@/hooks/use-departments";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Broadcast — StudyKit ET" }] }),
  component: AdminBroadcast,
});

function AdminBroadcast() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState<"all" | "student" | "professor" | "admin">("all");
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [sendEmail, setSendEmail] = useState(false);
  const departments = useDepartments("", "All");

  const send = useMutation({
    mutationFn: broadcastNotification,
    onSuccess: (r) => {
      toast.success(
        `Sent to ${r.recipients} (in-app ${r.inAppSent}, email ${r.emailSent}/${r.emailSent + r.emailFailed})`,
      );
      setSubject("");
      setBody("");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Broadcast failed"),
  });

  function submit() {
    if (subject.trim().length < 2 || body.trim().length < 2) {
      toast.error("Subject and body required");
      return;
    }
    send.mutate({
      subject: subject.trim(),
      body: body.trim(),
      audience: { role, departmentId },
      channels: { email: sendEmail, inApp: true },
    });
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title="Broadcast"
        description="Send an in-app notification (and optionally email via Resend) to a slice of users."
      />

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Compose</span>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="subj">Subject</Label>
            <Input
              id="subj"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="System maintenance on Friday"
            />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell users what's happening…"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Audience role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="professor">Professors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department (optional)</Label>
              <Select
                value={departmentId ?? "all"}
                onValueChange={(v) => setDepartmentId(v === "all" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {(departments.data ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            Also send email via Resend
          </label>

          <div className="flex justify-end">
            <Button onClick={submit} disabled={send.isPending}>
              {send.isPending ? "Sending…" : "Send broadcast"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

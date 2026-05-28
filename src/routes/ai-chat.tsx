import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { ChatBubble } from "@/components/features/chat-bubble";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuardedPage } from "@/components/auth/guarded-page";
import { useAuth } from "@/context/auth-context";
import { fetchChatHistory, sendChatMessage } from "@/lib/api/chat";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import type { ChatMessage } from "@/lib/types";
import { Sparkles, Send, Paperclip } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-chat")({
  head: () => ({ meta: [{ title: "AI Assistant — StudyKit ET" }] }),
  component: AIChat,
});

function AIChat() {
  return (
    <GuardedPage
      guard={{
        requireAuth: true,
        requireApproved: true,
        requireStudentDepartment: true,
      }}
    >
      <AIChatPage />
    </GuardedPage>
  );
}

function AIChatPage() {
  const { user, department } = useAuth();
  const [input, setInput] = useState("");
  const [localMsgs, setLocalMsgs] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const history = useQuery({
    queryKey: ["chat"],
    queryFn: fetchChatHistory,
    enabled: isApiConfigured(),
  });

  const msgs = [...(history.data ?? []), ...localMsgs];

  async function send() {
    const text = input.trim();
    if (!text) return;
    if (!isApiConfigured()) {
      toast.error("Set VITE_API_URL to enable AI chat");
      return;
    }
    setInput("");
    setLocalMsgs((m) => [...m, { role: "user", text }]);
    setSending(true);
    try {
      const reply = await sendChatMessage({ message: text });
      setLocalMsgs((m) => [...m, reply]);
      history.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-4 h-[calc(100vh-7rem)] flex flex-col">
        <PageHeader
          title="Study Assistant"
          description={department ? `Context: ${department.name}` : undefined}
        />

        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Hi {user?.name?.split(" ")[0] ?? "there"}</span>
          </div>

          <div className="flex-1 overflow-auto px-5 py-6">
            <DataBoundary
              resource="Chat"
              isLoading={history.isLoading}
              isError={history.isError}
              error={history.error}
              isEmpty={msgs.length === 0}
              emptyTitle="No messages yet"
              emptyDescription="Start a conversation — messages are stored via POST /chat on your API."
              onRetry={() => history.refetch()}
            >
              <div className="space-y-4">
                {msgs.map((m, i) => (
                  <ChatBubble key={m.id ?? i} role={m.role}>
                    {m.text}
                  </ChatBubble>
                ))}
              </div>
            </DataBoundary>
          </div>

          <div className="border-t px-5 py-3 flex gap-2">
            <Button size="icon" variant="ghost" disabled title="Attach from library">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your materials…"
              disabled={sending}
            />
            <Button onClick={send} disabled={sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

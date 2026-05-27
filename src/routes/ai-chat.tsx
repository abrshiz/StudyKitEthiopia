import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PageHeader } from "@/components/coming-soon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Paperclip } from "lucide-react";

export const Route = createFileRoute("/ai-chat")({
  head: () => ({ meta: [{ title: "AI Assistant — StudyKit ET" }] }),
  component: AIChat,
});

function AIChat() {
  const [input, setInput] = useState("");

  return (
    <AppShell>
      <div className="space-y-5 h-[calc(100vh-7rem)] flex flex-col">
        <PageHeader
          title="Study Assistant"
          description="Ask questions grounded in your uploaded course materials."
          featureId="aiChat"
        />

        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b">
            <div className="h-8 w-8 rounded-lg bg-accent/40 grid place-items-center text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">AI chat</div>
              <div className="text-[11px] text-muted-foreground">Provider not connected</div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              title="AI assistant not connected"
              description="Chat will work once your library is synced and an AI provider is configured. Messages you type below are not sent anywhere yet."
            />
          </div>

          <div className="border-t px-5 py-3">
            <div className="flex items-end gap-2">
              <Button size="icon" variant="ghost" disabled title="Attach files — coming soon">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your materials…"
                disabled
              />
              <Button disabled title="Send — coming soon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

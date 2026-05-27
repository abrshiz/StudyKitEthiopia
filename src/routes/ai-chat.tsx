import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Paperclip, BookOpen, Zap } from "lucide-react";

export const Route = createFileRoute("/ai-chat")({
  head: () => ({ meta: [{ title: "AI Assistant — StudyKit ET" }] }),
  component: AIChat,
});

type Msg = { role: "user" | "ai"; text: string };

function AIChat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hi Selam 👋 I have access to your Software Engineering library. What should we study today?" },
  ]);
  const [input, setInput] = useState("");

  function send() {
    if (!input.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: input }, { role: "ai", text: "Great question! Based on your DBMS notes, normalization reduces redundancy by splitting tables into related ones. 1NF removes repeating groups, 2NF removes partial dependencies, 3NF removes transitive dependencies. Want a worked example?" }]);
    setInput("");
  }

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[260px_1fr] gap-5 h-[calc(100vh-7rem)]">
        {/* Sidebar */}
        <Card className="p-4 hidden lg:flex flex-col">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Context</div>
          <div className="space-y-2">
            <ContextItem title="Software Engineering" sub="Year 3 · Sem 1" active />
            <ContextItem title="DBMS Final Notes" sub="m3 · 8.1 MB" />
            <ContextItem title="OS Lecture 7" sub="m2 · 12.8 MB" />
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-6 mb-3">Recent chats</div>
          <div className="space-y-1 text-sm">
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/40">B+ tree explanation</button>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/40">TCP vs UDP comparison</button>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/40">Process scheduling quiz</button>
          </div>
          <Button className="mt-auto" variant="outline">+ New chat</Button>
        </Card>

        {/* Chat */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/40 grid place-items-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Study Assistant</div>
                <div className="text-[11px] text-muted-foreground">Grounded in your course materials</div>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3" />Priority model</Badge>
          </div>

          <div className="flex-1 overflow-auto px-5 py-6 space-y-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t px-5 py-3 space-y-3">
            <div className="flex gap-2 flex-wrap">
              {["Summarize", "Quiz me", "Make flashcards", "Explain like I'm 5"].map((s) => (
                <Button key={s} size="sm" variant="outline" className="text-xs h-7">{s}</Button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <Button size="icon" variant="ghost"><Paperclip className="h-4 w-4" /></Button>
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask anything about your materials…" />
              <Button onClick={send}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function ContextItem({ title, sub, active }: { title: string; sub: string; active?: boolean }) {
  return (
    <div className={`flex gap-2 p-2.5 rounded-lg ${active ? "bg-accent/40" : "hover:bg-accent/20"}`}>
      <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-sm truncate">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

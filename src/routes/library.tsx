import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { materials } from "@/lib/data";
import { Search, Filter, Download, Eye, Highlighter, StickyNote, ShieldAlert, ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Library — StudyKit ET" }] }),
  component: Library,
});

function Library() {
  const [open, setOpen] = useState<string | null>(null);
  const item = materials.find((m) => m.id === open);

  return (
    <AppShell>
      {!open ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Content library</h1>
              <p className="text-sm text-muted-foreground mt-1">42 of 50 daily downloads remaining · Software Engineering</p>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <ShieldAlert className="h-3 w-3" /> All PDFs watermarked with your ID
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search materials…" className="pl-9" />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-4 w-4" /> Filters</Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="y1">Year 1</TabsTrigger>
              <TabsTrigger value="y2">Year 2</TabsTrigger>
              <TabsTrigger value="y3">Year 3</TabsTrigger>
              <TabsTrigger value="y4">Year 4</TabsTrigger>
              <TabsTrigger value="exams">Past exams</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m) => (
              <Card key={m.id} className="p-5 group hover:border-primary/40 transition">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                  <span className="text-[11px] text-muted-foreground">{m.size}</span>
                </div>
                <h3 className="font-medium mt-3 line-clamp-2">{m.title}</h3>
                <div className="text-xs text-muted-foreground mt-1">{m.course} · {m.semester}</div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{m.downloads.toLocaleString()} downloads</span>
                  <span>{m.updated}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => setOpen(m.id)}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Open
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Viewer item={item!} onBack={() => setOpen(null)} />
      )}
    </AppShell>
  );
}

function Viewer({ item, onBack }: { item: typeof materials[number]; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5"><Highlighter className="h-3.5 w-3.5" />Highlight</Button>
          <Button size="sm" variant="outline" className="gap-1.5"><StickyNote className="h-3.5 w-3.5" />Note</Button>
          <Button size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />Download</Button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-semibold">{item.title}</h1>
        <div className="text-xs text-muted-foreground mt-1">{item.course} · {item.semester} · {item.size}</div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Document */}
        <Card className="overflow-hidden">
          <div className="relative bg-muted/40 min-h-[70vh] flex items-center justify-center">
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-foreground/[0.06] text-3xl font-bold rotate-[-22deg] select-none whitespace-pre-line text-center leading-tight">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>selam@aau.edu.et · {new Date().toLocaleString()}</div>
                ))}
              </div>
            </div>
            <div className="relative max-w-md p-8 text-center text-sm text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 text-primary/60" />
              <div className="font-medium text-foreground">Document preview</div>
              <p className="mt-2">Watermarked with your student email and timestamp. DRM-lite — expires at end of semester.</p>
            </div>
          </div>
        </Card>

        {/* AI chat sidebar */}
        <Card className="p-4 flex flex-col h-[70vh]">
          <div className="flex items-center gap-2 pb-3 border-b">
            <div className="h-7 w-7 rounded-lg bg-accent/40 grid place-items-center text-primary">
              <span className="text-xs font-bold">AI</span>
            </div>
            <div>
              <div className="text-sm font-medium">Ask about this doc</div>
              <div className="text-[11px] text-muted-foreground">Context: {item.course}</div>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-3 space-y-2 text-sm">
            <Bubble role="ai">Hi! I've loaded "{item.title}". Ask me anything about it.</Bubble>
            <Bubble role="me">Summarize section 3 in 5 bullets.</Bubble>
            <Bubble role="ai">Sure — section 3 covers traversal algorithms. Key points: DFS uses a stack, BFS uses a queue, time complexity O(V+E), use cases include shortest unweighted paths, cycle detection.</Bubble>
          </div>
          <div className="pt-2 border-t">
            <Input placeholder="Ask a question…" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: "ai" | "me"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "me" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
        role === "me" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
      }`}>
        {children}
      </div>
    </div>
  );
}

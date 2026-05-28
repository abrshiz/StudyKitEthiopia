import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { ChatBubble } from "@/components/features/chat-bubble";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuardedPage } from "@/components/auth/guarded-page";
import { useAuth } from "@/context/auth-context";
import { useMaterials, useMaterial } from "@/hooks/use-materials";
import { sendChatMessage } from "@/lib/api/chat";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import type { StudyMaterial } from "@/lib/types";
import type { ChatMessage } from "@/lib/types";
import {
  Search,
  Filter,
  Download,
  Eye,
  ShieldAlert,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Library — StudyKit ET" }] }),
  component: Library,
});

function Library() {
  return (
    <GuardedPage
      guard={{
        requireAuth: true,
        requireApproved: true,
        requireStudentDepartment: true,
      }}
    >
      <LibraryPage />
    </GuardedPage>
  );
}

function LibraryPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [yearTab, setYearTab] = useState("all");
  const { user } = useAuth();

  const list = useMaterials(q, yearTab);
  const detail = useMaterial(openId);

  if (openId && detail.data) {
    return (
      <AppShell>
        <DocumentViewer
          item={detail.data}
          watermark={user?.email ?? ""}
          onBack={() => setOpenId(null)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Content library" description="Materials from your database for this department.">
          <Badge variant="secondary" className="gap-1.5">
            <ShieldAlert className="h-3 w-3" /> Watermarked downloads
          </Badge>
        </PageHeader>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search materials…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>

        <Tabs value={yearTab} onValueChange={setYearTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="y1">Year 1</TabsTrigger>
            <TabsTrigger value="y2">Year 2</TabsTrigger>
            <TabsTrigger value="y3">Year 3</TabsTrigger>
            <TabsTrigger value="y4">Year 4</TabsTrigger>
            <TabsTrigger value="exams">Past exams</TabsTrigger>
          </TabsList>
        </Tabs>

        <DataBoundary
          resource="Library"
          isLoading={list.isLoading}
          isError={list.isError}
          error={list.error}
          isEmpty={(list.data?.length ?? 0) === 0}
          emptyTitle="No materials"
          emptyDescription="Your API returns materials at GET /materials?departmentId=…"
          onRetry={() => list.refetch()}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.data!.map((m) => (
              <Card key={m.id} className="p-5 hover:border-primary/40 transition">
                <div className="flex justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {m.type}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{m.size}</span>
                </div>
                <h3 className="font-medium mt-3 line-clamp-2">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {m.course} · {m.semester}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => setOpenId(m.id)}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("Download uses your API file URL when connected")}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </DataBoundary>
      </div>
    </AppShell>
  );
}

function DocumentViewer({
  item,
  watermark,
  onBack,
}: {
  item: StudyMaterial;
  watermark: string;
  onBack: () => void;
}) {
  const [docInput, setDocInput] = useState("");
  const [docMsgs, setDocMsgs] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  async function sendDocQuestion() {
    if (!docInput.trim() || !isApiConfigured()) {
      if (!isApiConfigured()) toast.error("Connect API for document AI");
      return;
    }
    const text = docInput.trim();
    setDocInput("");
    setDocMsgs((m) => [...m, { role: "user", text }]);
    setSending(true);
    try {
      const reply = await sendChatMessage({ message: text, materialId: item.id });
      setDocMsgs((m) => [...m, reply]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "AI request failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <h1 className="text-xl font-semibold">{item.title}</h1>
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <Card className="min-h-[70vh] relative bg-muted/30 flex items-center justify-center overflow-hidden">
          {watermark && (
            <div className="absolute inset-0 pointer-events-none text-foreground/[0.05] text-xl font-bold rotate-[-22deg] grid place-items-center">
              {watermark}
            </div>
          )}
          <div className="relative text-center p-8">
            <FileText className="h-12 w-12 mx-auto text-primary/60 mb-3" />
            <p className="text-sm text-muted-foreground">Preview streams from your API file URL</p>
          </div>
        </Card>
        <Card className="p-4 flex flex-col h-[70vh]">
          <p className="text-sm font-medium mb-2">Ask about this document</p>
          <div className="flex-1 overflow-auto space-y-2">
            {docMsgs.length === 0 && (
              <p className="text-xs text-muted-foreground">Questions go to POST /chat with materialId</p>
            )}
            {docMsgs.map((m, i) => (
              <ChatBubble key={i} role={m.role}>
                {m.text}
              </ChatBubble>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Input
              value={docInput}
              onChange={(e) => setDocInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendDocQuestion()}
              placeholder="Ask a question…"
              disabled={sending}
            />
            <Button onClick={sendDocQuestion} disabled={sending}>
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { createStudyKitJson, createStudyKitPdf } from "@/lib/api/study-kits";
import { toast } from "sonner";
import { FileUp, FileText, Youtube, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/study/new")({
  head: () => ({ meta: [{ title: "New study kit — StudyKit ET" }] }),
  component: NewStudyKitPage,
});

function NewStudyKitPage() {
  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <NewStudyKitWizard />
      </AppShell>
    </GuardedPage>
  );
}

function NewStudyKitWizard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("pdf");
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) {
      toast.error("Give your kit a title");
      return;
    }
    setBusy(true);
    try {
      let kit;
      if (tab === "pdf") {
        if (!file) {
          toast.error("Choose a PDF file");
          return;
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("sourceType", "pdf");
        fd.append("title", title.trim());
        fd.append("isPublic", String(isPublic));
        kit = await createStudyKitPdf(fd);
      } else if (tab === "text") {
        kit = await createStudyKitJson({
          sourceType: "text",
          title: title.trim(),
          text,
          isPublic,
        });
      } else if (tab === "youtube") {
        kit = await createStudyKitJson({
          sourceType: "youtube",
          title: title.trim(),
          url,
          isPublic,
        });
      } else {
        kit = await createStudyKitJson({
          sourceType: "topic",
          title: title.trim(),
          topic,
          isPublic,
        });
      }
      toast.success("Study kit created");
      navigate({ to: "/study/$kitId", params: { kitId: kit.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create kit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="New study kit"
        description="Like Thea — turn your materials into flashcards, quizzes, and study guides."
      />

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g. CSE 201 — Algorithms midterm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="public">Share in the library (.edu.et students)</Label>
          <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="pdf" className="gap-1 text-xs">
              <FileUp className="h-3.5 w-3.5" /> PDF
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-1 text-xs">
              <FileText className="h-3.5 w-3.5" /> Paste
            </TabsTrigger>
            <TabsTrigger value="youtube" className="gap-1 text-xs">
              <Youtube className="h-3.5 w-3.5" /> YouTube
            </TabsTrigger>
            <TabsTrigger value="topic" className="gap-1 text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Topic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-3 pt-2">
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">Free plan: up to 20 pages per PDF.</p>
          </TabsContent>

          <TabsContent value="text" className="pt-2">
            <Textarea
              rows={8}
              placeholder="Paste lecture notes, slides text, or exam topics…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="youtube" className="space-y-2 pt-2">
            <Input
              placeholder="https://youtube.com/watch?v=…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Requires Student or Premium plan.</p>
          </TabsContent>

          <TabsContent value="topic" className="pt-2">
            <Textarea
              rows={4}
              placeholder="Describe what your exam covers — e.g. 'Sorting algorithms, Big-O, graphs for CSE 201'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </TabsContent>
        </Tabs>

        <Button className="w-full" disabled={busy} onClick={submit}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating…
            </>
          ) : (
            "Create study kit"
          )}
        </Button>
      </Card>
    </div>
  );
}

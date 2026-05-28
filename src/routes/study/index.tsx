import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchStudyKits } from "@/lib/api/study-kits";
import { Plus, BookOpen, Globe } from "lucide-react";

export const Route = createFileRoute("/study/")({
  head: () => ({ meta: [{ title: "My Study — StudyKit ET" }] }),
  component: StudyListPage,
});

function StudyListPage() {
  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <StudyList />
      </AppShell>
    </GuardedPage>
  );
}

function StudyList() {
  const [tab, setTab] = useState<"mine" | "shared">("mine");

  const mine = useQuery({
    queryKey: ["study-kits", "mine"],
    queryFn: () => fetchStudyKits({ public: false }),
    enabled: tab === "mine",
  });

  const shared = useQuery({
    queryKey: ["study-kits", "shared"],
    queryFn: () => fetchStudyKits({ public: true }),
    enabled: tab === "shared",
  });

  const active = tab === "mine" ? mine : shared;

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Study"
        description="Upload notes, paste text, or describe a topic — then generate flashcards, quizzes, and guides."
      >
        <Link to="/study/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New study kit
          </Button>
        </Link>
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "mine" | "shared")}>
        <TabsList>
          <TabsTrigger value="mine">My kits</TabsTrigger>
          <TabsTrigger value="shared">Shared library</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataBoundary
        resource="Study kits"
        isLoading={active.isLoading}
        isError={active.isError}
        error={active.error}
        isEmpty={(active.data?.length ?? 0) === 0}
        emptyTitle={tab === "mine" ? "No study kits yet" : "No public kits yet"}
        emptyDescription={
          tab === "mine"
            ? "Create your first kit from a PDF, pasted notes, YouTube, or a topic description."
            : "When students mark kits as public, they appear here for everyone on .edu.et."
        }
        onRetry={() => active.refetch()}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(active.data ?? []).map((kit) => (
            <Link key={kit.id} to="/study/$kitId" params={{ kitId: kit.id }}>
              <Card className="p-5 h-full hover:border-primary/40 transition">
                <div className="flex items-start justify-between gap-2">
                  <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {kit.sourceType}
                  </Badge>
                </div>
                <h3 className="font-semibold mt-3 line-clamp-2">{kit.title}</h3>
                {tab === "shared" && kit.ownerName && (
                  <p className="text-xs text-muted-foreground mt-1">by {kit.ownerName}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-muted-foreground">
                  <span>{kit.flashcardCount} cards</span>
                  <span>{kit.quizQuestionCount} Qs</span>
                  {kit.hasSummary && <span>Summary</span>}
                  {kit.hasGuide && <span>Guide</span>}
                  {kit.isPublic && (
                    <Globe className="h-3 w-3 inline text-primary" aria-label="Public" />
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </DataBoundary>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  fetchStudyKit,
  generateFlashcards,
  generateGuide,
  generateQuiz,
  generateSummary,
  generateTest,
  updateStudyKit,
} from "@/lib/api/study-kits";
import {
  Brain,
  Layers,
  FileText,
  BookMarked,
  ClipboardList,
  Loader2,
  Gamepad2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/study/$kitId/")({
  head: () => ({ meta: [{ title: "Study kit — StudyKit ET" }] }),
  component: KitOverviewPage,
});

function KitOverviewPage() {
  const { kitId } = Route.useParams();
  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <KitOverview kitId={kitId} />
      </AppShell>
    </GuardedPage>
  );
}

function KitOverview({ kitId }: { kitId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const kit = useQuery({
    queryKey: ["study-kit", kitId],
    queryFn: () => fetchStudyKit(kitId),
  });

  async function runGen(
    key: string,
    fn: () => Promise<unknown>,
    success: string,
  ) {
    setBusy(key);
    try {
      await fn();
      toast.success(success);
      await qc.invalidateQueries({ queryKey: ["study-kit", kitId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <DataBoundary
      resource="Study kit"
      isLoading={kit.isLoading}
      isError={kit.isError}
      error={kit.error}
      isEmpty={!kit.data}
      emptyTitle="Kit not found"
      emptyDescription=""
      onRetry={() => kit.refetch()}
    >
      {kit.data && (
        <div className="space-y-6">
          <PageHeader title={kit.data.title} description={kit.data.description || kit.data.sourceType}>
            <Badge variant="outline">{kit.data.sourceType}</Badge>
          </PageHeader>

          <Card className="p-4 flex items-center justify-between">
            <Label htmlFor="pub">Public in shared library</Label>
            <Switch
              id="pub"
              checked={kit.data.isPublic}
              onCheckedChange={async (v) => {
                await updateStudyKit(kitId, { isPublic: v });
                qc.invalidateQueries({ queryKey: ["study-kit", kitId] });
              }}
            />
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <GenCard
              kitId={kitId}
              icon={<Layers className="h-5 w-5" />}
              title="Flashcards"
              count={kit.data.flashcardCount}
              continueTo="/study/$kitId/flashcards"
              onGenerate={() =>
                runGen("fc", () => generateFlashcards(kitId, 20), "Flashcards ready")
              }
              busy={busy === "fc"}
            />
            <GenCard
              icon={<Brain className="h-5 w-5" />}
              title="Smart Study"
              count={kit.data.quizQuestionCount}
              continueTo="/study/$kitId/smart-study"
              kitId={kitId}
              onGenerate={() =>
                runGen("quiz", () => generateQuiz(kitId, 10), "Quiz questions ready")
              }
              busy={busy === "quiz"}
            />
            <GenCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="Practice Test"
              count={kit.data.quizQuestionCount}
              continueTo="/study/$kitId/test"
              kitId={kitId}
              onGenerate={() =>
                runGen("test", () => generateTest(kitId, 15), "Practice test ready")
              }
              busy={busy === "test"}
            />
            <GenCard
              icon={<FileText className="h-5 w-5" />}
              title="Summary"
              ready={kit.data.hasSummary}
              continueTo="/study/$kitId/summary"
              kitId={kitId}
              onGenerate={() =>
                runGen("sum", () => generateSummary(kitId), "Summary ready")
              }
              busy={busy === "sum"}
            />
            <GenCard
              icon={<BookMarked className="h-5 w-5" />}
              title="Study Guide"
              ready={kit.data.hasGuide}
              continueTo="/study/$kitId/guide"
              kitId={kitId}
              onGenerate={() =>
                runGen("guide", () => generateGuide(kitId), "Study guide ready")
              }
              busy={busy === "guide"}
            />
            <Card className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-primary">
                <Gamepad2 className="h-5 w-5" />
                <span className="font-semibold">Game modes</span>
              </div>
              <p className="text-xs text-muted-foreground flex-1">
                Stack cards or match pairs — fun review after you generate flashcards.
              </p>
              <div className="flex gap-2">
                <Link to="/study/$kitId/play/stacker" params={{ kitId }} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full" disabled={!kit.data.flashcardCount}>
                    Stacker
                  </Button>
                </Link>
                <Link to="/study/$kitId/play/match" params={{ kitId }} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full" disabled={!kit.data.flashcardCount}>
                    Match
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          <Link to="/study">
            <Button variant="ghost">← All kits</Button>
          </Link>
        </div>
      )}
    </DataBoundary>
  );
}

type KitChildRoute =
  | "/study/$kitId/flashcards"
  | "/study/$kitId/smart-study"
  | "/study/$kitId/test"
  | "/study/$kitId/summary"
  | "/study/$kitId/guide";

function GenCard({
  icon,
  title,
  count,
  ready,
  continueTo,
  kitId,
  onGenerate,
  busy,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  ready?: boolean;
  continueTo: KitChildRoute;
  kitId: string;
  onGenerate: () => void;
  busy: boolean;
}) {
  const hasContent = (count ?? 0) > 0 || ready;
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      {typeof count === "number" && (
        <p className="text-xs text-muted-foreground">{count} items</p>
      )}
      <div className="flex gap-2 mt-auto">
        <Button size="sm" variant="secondary" disabled={busy} onClick={onGenerate}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
        </Button>
        {hasContent && (
          <Link to={continueTo} params={{ kitId }}>
            <Button size="sm">Continue</Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

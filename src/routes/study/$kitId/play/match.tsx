import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchFlashcards } from "@/lib/api/flashcards";

export const Route = createFileRoute("/study/$kitId/play/match")({
  head: () => ({ meta: [{ title: "Match — StudyKit ET" }] }),
  component: MatchPage,
});

type Tile = { id: string; text: string; pairId: string; kind: "front" | "back" };

function MatchPage() {
  const { kitId } = Route.useParams();
  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);

  const cards = useQuery({
    queryKey: ["flashcards", kitId],
    queryFn: () => fetchFlashcards(kitId),
  });

  const tiles = useMemo(() => {
    const deck = (cards.data ?? []).slice(0, 6);
    const out: Tile[] = [];
    for (const c of deck) {
      out.push({ id: `${c.id}-f`, text: c.front, pairId: c.id, kind: "front" });
      out.push({ id: `${c.id}-b`, text: c.back, pairId: c.id, kind: "back" });
    }
    return out.sort(() => Math.random() - 0.5);
  }, [cards.data]);

  function pick(tileId: string) {
    if (matched.has(tileId) || selected.includes(tileId)) return;
    const next = [...selected, tileId];
    setSelected(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((id) => tiles.find((t) => t.id === id)!);
      if (a.pairId === b.pairId && a.kind !== b.kind) {
        setMatched((m) => new Set([...m, a.id, b.id]));
      }
      setTimeout(() => setSelected([]), 600);
    }
  }

  const won = tiles.length > 0 && matched.size === tiles.length;

  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <div className="space-y-5 max-w-2xl mx-auto">
          <PageHeader title="Match pairs" description={`Moves: ${moves}`}>
            <Link to="/study/$kitId" params={{ kitId }}>
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </PageHeader>

          {won ? (
            <Card className="p-8 text-center">You matched all pairs in {moves} moves!</Card>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {tiles.map((t) => {
                const isSel = selected.includes(t.id);
                const isDone = matched.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isDone}
                    onClick={() => pick(t.id)}
                    className={`p-3 text-xs rounded-lg border min-h-[72px] text-left transition ${
                      isDone
                        ? "opacity-40 bg-muted"
                        : isSel
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50"
                    }`}
                  >
                    {t.text}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </GuardedPage>
  );
}

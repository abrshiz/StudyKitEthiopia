import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fetchFlashcards, reviewFlashcard } from "@/lib/api/flashcards";
import { toast } from "sonner";

export const Route = createFileRoute("/study/$kitId/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards — StudyKit ET" }] }),
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const { kitId } = Route.useParams();
  const qc = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cards = useQuery({
    queryKey: ["flashcards", kitId],
    queryFn: () => fetchFlashcards(kitId),
  });

  const deck = cards.data ?? [];
  const card = deck[idx];

  async function grade(g: number) {
    if (!card) return;
    await reviewFlashcard(kitId, card.id, g);
    setFlipped(false);
    if (idx + 1 >= deck.length) {
      toast.success("Session complete");
      setIdx(0);
      qc.invalidateQueries({ queryKey: ["flashcards", kitId] });
    } else {
      setIdx(idx + 1);
    }
  }

  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <div className="space-y-5 max-w-lg mx-auto">
          <PageHeader title="Flashcard review" description="Rate how well you knew each card (0–5).">
            <Link to="/study/$kitId" params={{ kitId }}>
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </PageHeader>

          {!deck.length && !cards.isLoading ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Generate flashcards from the kit overview first.
            </Card>
          ) : card ? (
            <>
              <Progress value={((idx + 1) / deck.length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {idx + 1} / {deck.length}
              </p>
              <Card
                className="p-10 min-h-[200px] grid place-items-center text-center cursor-pointer"
                onClick={() => setFlipped(!flipped)}
              >
                <p className="text-lg font-medium">
                  {flipped ? card.back : card.front}
                </p>
                <p className="text-xs text-muted-foreground mt-4">Tap to flip</p>
              </Card>
              {flipped && (
                <div className="grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((g) => (
                    <Button key={g} variant="outline" onClick={() => grade(g)}>
                      {g}
                    </Button>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </AppShell>
    </GuardedPage>
  );
}

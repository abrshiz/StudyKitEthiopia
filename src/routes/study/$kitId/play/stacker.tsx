import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchFlashcards } from "@/lib/api/flashcards";

export const Route = createFileRoute("/study/$kitId/play/stacker")({
  head: () => ({ meta: [{ title: "Stacker — StudyKit ET" }] }),
  component: StackerPage,
});

function StackerPage() {
  const { kitId } = Route.useParams();
  const [tower, setTower] = useState(0);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [over, setOver] = useState(false);

  const cards = useQuery({
    queryKey: ["flashcards", kitId],
    queryFn: () => fetchFlashcards(kitId),
  });

  const deck = cards.data ?? [];
  const card = deck[idx % Math.max(deck.length, 1)];

  function answer(correct: boolean) {
    if (!card) return;
    if (correct) setTower((t) => t + 1);
    else setOver(true);
    setShowBack(false);
    setIdx((i) => i + 1);
  }

  if (!deck.length) {
    return (
      <GuardedPage guard={{ requireAuth: true }}>
        <AppShell>
          <Card className="p-8 text-center">Generate flashcards first.</Card>
        </AppShell>
      </GuardedPage>
    );
  }

  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <div className="space-y-5 max-w-md mx-auto">
          <PageHeader title="Stacker" description={`Tower height: ${tower}`}>
            <Link to="/study/$kitId" params={{ kitId }}>
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </PageHeader>

          {over ? (
            <Card className="p-8 text-center space-y-3">
              <p className="text-xl font-semibold">Tower fell at {tower} cards</p>
              <Button onClick={() => { setOver(false); setTower(0); setIdx(0); }}>Play again</Button>
            </Card>
          ) : (
            <>
              <div className="flex justify-center gap-1 h-24 items-end">
                {Array.from({ length: Math.min(tower, 12) }).map((_, i) => (
                  <div key={i} className="w-8 h-6 bg-primary/80 rounded-sm" />
                ))}
              </div>
              <Card
                className="p-8 text-center min-h-[140px] grid place-items-center cursor-pointer"
                onClick={() => setShowBack(!showBack)}
              >
                <p className="font-medium">{showBack ? card?.back : card?.front}</p>
              </Card>
              {showBack && (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="destructive" onClick={() => answer(false)}>
                    Wrong
                  </Button>
                  <Button onClick={() => answer(true)}>Got it</Button>
                </div>
              )}
            </>
          )}
        </div>
      </AppShell>
    </GuardedPage>
  );
}

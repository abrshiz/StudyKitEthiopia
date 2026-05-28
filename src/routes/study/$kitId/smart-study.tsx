import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchNextQuizQuestion,
  fetchQuizQuestions,
  submitQuizAttempt,
  type QuizQuestionRecord,
} from "@/lib/api/quizzes";
import { toast } from "sonner";

export const Route = createFileRoute("/study/$kitId/smart-study")({
  head: () => ({ meta: [{ title: "Smart Study — StudyKit ET" }] }),
  component: SmartStudyPage,
});

function SmartStudyPage() {
  const { kitId } = Route.useParams();
  const [q, setQ] = useState<QuizQuestionRecord | null>(null);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [session, setSession] = useState<
    Array<{ questionId: string; response: string; correct: boolean }>
  >([]);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);

  async function loadNext() {
    try {
      const next = await fetchNextQuizQuestion(kitId);
      const all = await fetchQuizQuestions(kitId);
      const full = all.find((x) => x.id === next.id);
      if (!full) throw new Error("Question not found");
      setQ({ ...next, answer: full.answer, explanation: full.explanation });
      setAnswer("");
      setRevealed(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generate quiz questions first");
    }
  }

  function check() {
    if (!q) return;
    const ok = normalize(answer) === normalize(q.answer);
    setCorrect(ok);
    setRevealed(true);
    setSession((s) => [...s, { questionId: q.id, response: answer, correct: ok }]);
  }

  async function finish() {
    const result = await submitQuizAttempt(kitId, {
      mode: "smart-study",
      perQuestion: session.map((r) => ({ ...r, durationMs: 0 })),
      durationSec: Math.max(30, session.length * 20),
    });
    setScore(result.score);
    setDone(true);
    toast.success(`Score: ${result.score}%`);
  }

  if (done) {
    return (
      <GuardedPage guard={{ requireAuth: true }}>
        <AppShell>
          <Card className="p-8 text-center space-y-4 max-w-md mx-auto">
            <p className="text-2xl font-semibold">{score}%</p>
            <Link to="/study/$kitId" params={{ kitId }}>
              <Button>Back to kit</Button>
            </Link>
          </Card>
        </AppShell>
      </GuardedPage>
    );
  }

  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <div className="space-y-5 max-w-xl mx-auto">
          <PageHeader title="Smart Study" description="Adaptive quiz — weaker cards appear more often.">
            <Link to="/study/$kitId" params={{ kitId }}>
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </PageHeader>

          {!q ? (
            <Button onClick={loadNext}>Start session</Button>
          ) : (
            <Card className="p-6 space-y-4">
              <p className="font-medium">{q.prompt}</p>
              {q.type === "mc" && q.choices?.length ? (
                <div className="space-y-2">
                  {q.choices.map((c) => (
                    <Button
                      key={c}
                      variant={answer === c ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setAnswer(c)}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              ) : (
                <Input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" />
              )}
              {!revealed ? (
                <Button onClick={check}>Check</Button>
              ) : (
                <>
                  <p className={correct ? "text-green-600 text-sm" : "text-destructive text-sm"}>
                    {correct ? "Correct!" : `Answer: ${q.answer}`}
                  </p>
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground">{q.explanation}</p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={loadNext}>
                      Next
                    </Button>
                    {session.length >= 3 && (
                      <Button onClick={finish}>Finish ({session.length})</Button>
                    )}
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </AppShell>
    </GuardedPage>
  );
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

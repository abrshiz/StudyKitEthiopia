import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchQuizQuestions, submitQuizAttempt } from "@/lib/api/quizzes";
import type { QuizQuestionRecord } from "@/lib/api/quizzes";

export const Route = createFileRoute("/study/$kitId/test")({
  head: () => ({ meta: [{ title: "Practice test — StudyKit ET" }] }),
  component: TestPage,
});

function TestPage() {
  const { kitId } = Route.useParams();
  const [seconds, setSeconds] = useState(15 * 60);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const qs = useQuery({
    queryKey: ["quiz-full", kitId],
    queryFn: () => fetchQuizQuestions(kitId),
  });

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  async function submit() {
    const questions = qs.data ?? [];
    const perQuestion = questions.map((q) => {
      const response = responses[q.id] ?? "";
      const correct = normalize(response) === normalize(q.answer);
      return { questionId: q.id, response, correct, durationMs: 0 };
    });
    const result = await submitQuizAttempt(kitId, {
      mode: "practice-test",
      perQuestion,
      durationSec: 15 * 60 - seconds,
    });
    setScore(result.score);
    setSubmitted(true);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <div className="space-y-5 max-w-2xl mx-auto">
          <PageHeader title="Practice test" description={`Timed · ${mm}:${ss} left`}>
            <Link to="/study/$kitId" params={{ kitId }}>
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </PageHeader>

          {submitted ? (
            <Card className="p-8 text-center">
              <p className="text-3xl font-semibold">{score}%</p>
              <p className="text-sm text-muted-foreground mt-2">Submitted</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {(qs.data ?? []).map((q, i) => (
                <QuestionBlock
                  key={q.id}
                  index={i + 1}
                  q={q}
                  value={responses[q.id] ?? ""}
                  onChange={(v) => setResponses((r) => ({ ...r, [q.id]: v }))}
                />
              ))}
              <Button className="w-full" onClick={submit} disabled={!qs.data?.length}>
                Submit test
              </Button>
            </div>
          )}
        </div>
      </AppShell>
    </GuardedPage>
  );
}

function QuestionBlock({
  index,
  q,
  value,
  onChange,
}: {
  index: number;
  q: QuizQuestionRecord;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Card className="p-4 space-y-2">
      <p className="text-sm font-medium">
        {index}. {q.prompt}
      </p>
      {q.type === "mc" && q.choices?.length ? (
        <div className="space-y-1">
          {q.choices.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={value === c ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => onChange(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </Card>
  );
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

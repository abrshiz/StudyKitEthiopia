import { apiFetch } from "./client";

export type QuizQuestionRecord = {
  id: string;
  type: "mc" | "short" | "tf";
  prompt: string;
  choices: string[];
  answer: string;
  explanation?: string;
  difficulty: string;
  timesSeen: number;
  timesCorrect: number;
};

export async function fetchQuizQuestions(kitId: string) {
  return apiFetch<QuizQuestionRecord[]>(`/study-kits/${kitId}/quizzes`);
}

export async function fetchNextQuizQuestion(kitId: string) {
  return apiFetch<QuizQuestionRecord & { answer?: never }>(`/study-kits/${kitId}/quizzes/next`);
}

export async function submitQuizAttempt(
  kitId: string,
  body: {
    mode: "smart-study" | "practice-test";
    perQuestion: Array<{
      questionId: string;
      response: string;
      correct: boolean;
      durationMs?: number;
    }>;
    durationSec: number;
  },
) {
  return apiFetch<{ id: string; score: number; correctCount: number; questionCount: number }>(
    `/study-kits/${kitId}/quizzes/attempt`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function fetchQuizAttempts(kitId: string) {
  return apiFetch<
    Array<{
      id: string;
      mode: string;
      score: number;
      correctCount: number;
      questionCount: number;
      durationSec: number;
      completedAt: string;
    }>
  >(`/study-kits/${kitId}/quizzes/attempts`);
}

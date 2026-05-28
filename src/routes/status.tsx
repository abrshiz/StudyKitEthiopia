import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl, isApiConfigured, apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/status")({
  head: () => ({ meta: [{ title: "API setup — StudyKit ET" }] }),
  component: StatusPage,
});

const endpoints = [
  "GET  /departments",
  "GET  /materials",
  "GET  /progress",
  "GET  /notifications",
  "GET  /billing/plans",
  "POST /billing/checkout",
  "GET  /admin/dashboard",
  "GET  /search?q=",
  "GET  /chat",
  "POST /chat",
  "POST /auth/login",
  "POST /auth/register",
];

function StatusPage() {
  const configured = isApiConfigured();
  const base = getApiBaseUrl();
  const health = useQuery({
    queryKey: ["health", base],
    queryFn: () => apiFetch<{ ok: boolean }>("/health"),
    enabled: configured,
    retry: 1,
  });

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-5">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold text-earth">StudyKit ET</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Backend connection</h1>
        <p className="mt-2 text-muted-foreground">
          The frontend loads all lists from your API. No sample data is bundled in the app.
        </p>

        <Card className="mt-8 p-6">
          <div className="flex items-center gap-3">
            {configured ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <div className="font-medium">
                {configured ? "API URL configured" : "API not configured"}
              </div>
              <code className="text-xs text-muted-foreground block mt-1">
                {configured ? base : "Set VITE_API_URL in .env"}
              </code>
            </div>
          </div>
        </Card>

        {configured && (
          <Card className="mt-4 p-6">
            <div className="flex items-center gap-3">
              {health.isSuccess ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <div className="font-medium">
                  {health.isSuccess
                    ? "API reachable"
                    : health.isLoading
                      ? "Checking API…"
                      : "API not reachable"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Run <code className="bg-muted px-1 rounded">npm run dev:api</code> and MongoDB,
                  then refresh.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="mt-4 p-6 text-sm">
          <h2 className="font-semibold mb-2">Demo account (after seed)</h2>
          <p className="text-muted-foreground font-mono text-xs">
            student@aau.edu.et · StudyKit123!
          </p>
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="font-semibold text-sm mb-3">Expected endpoints</h2>
          <ul className="font-mono text-xs space-y-1.5 text-muted-foreground">
            {endpoints.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Card>

        <Card className="mt-4 p-6 text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Session flow (no JWT in the client):</strong> sign
            in → pick department → use app. Guards only check sessionStorage, not tokens.
          </p>
          <p>
            Copy <code className="bg-muted px-1 rounded">.env.example</code> to{" "}
            <code className="bg-muted px-1 rounded">.env</code> and point{" "}
            <code className="bg-muted px-1 rounded">VITE_API_URL</code> at your server.
          </p>
        </Card>

        <div className="mt-8 flex gap-2">
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

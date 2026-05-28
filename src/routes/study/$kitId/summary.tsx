import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchSummary } from "@/lib/api/study-kits";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/study/$kitId/summary")({
  head: () => ({ meta: [{ title: "Summary — StudyKit ET" }] }),
  component: SummaryPage,
});

function SummaryPage() {
  const { kitId } = Route.useParams();
  const summary = useQuery({
    queryKey: ["summary", kitId],
    queryFn: () => fetchSummary(kitId),
    retry: false,
  });

  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <div className="space-y-5 max-w-3xl">
          <PageHeader title="Summary">
            <Link to="/study/$kitId" params={{ kitId }}>
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </PageHeader>
          <DataBoundary
            resource="Summary"
            isLoading={summary.isLoading}
            isError={summary.isError}
            error={summary.error}
            isEmpty={!summary.data}
            emptyTitle="No summary yet"
            emptyDescription="Generate a summary from the kit overview."
            onRetry={() => summary.refetch()}
          >
            <Card className="p-6 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary.data!.content}</ReactMarkdown>
            </Card>
          </DataBoundary>
        </div>
      </AppShell>
    </GuardedPage>
  );
}

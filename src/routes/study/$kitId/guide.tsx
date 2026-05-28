import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { GuardedPage } from "@/components/auth/guarded-page";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchGuide, fetchStudyKit, downloadGuidePdf } from "@/lib/api/study-kits";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download } from "lucide-react";

export const Route = createFileRoute("/study/$kitId/guide")({
  head: () => ({ meta: [{ title: "Study guide — StudyKit ET" }] }),
  component: GuidePage,
});

function GuidePage() {
  const { kitId } = Route.useParams();
  const kit = useQuery({ queryKey: ["study-kit", kitId], queryFn: () => fetchStudyKit(kitId) });
  const guide = useQuery({
    queryKey: ["guide", kitId],
    queryFn: () => fetchGuide(kitId),
    retry: false,
  });

  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <div className="space-y-5 max-w-3xl">
          <PageHeader title="Study guide">
            <div className="flex gap-2">
              {guide.data && kit.data && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => downloadGuidePdf(kitId, kit.data!.title)}
                >
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
              )}
              <Link to="/study/$kitId" params={{ kitId }}>
                <Button variant="ghost" size="sm">
                  Back
                </Button>
              </Link>
            </div>
          </PageHeader>
          <DataBoundary
            resource="Study guide"
            isLoading={guide.isLoading}
            isError={guide.isError}
            error={guide.error}
            isEmpty={!guide.data}
            emptyTitle="No guide yet"
            emptyDescription="Generate a study guide from the kit overview."
            onRetry={() => guide.refetch()}
          >
            <Card className="p-6 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.data!.content}</ReactMarkdown>
            </Card>
          </DataBoundary>
        </div>
      </AppShell>
    </GuardedPage>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GuardedPage } from "@/components/auth/guarded-page";
import { fetchStudyKits, forkStudyKit } from "@/lib/api/study-kits";
import { Search, Copy, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Shared Library — StudyKit ET" }] }),
  component: Library,
});

function Library() {
  return (
    <GuardedPage guard={{ requireAuth: true }}>
      <AppShell>
        <SharedLibrary />
      </AppShell>
    </GuardedPage>
  );
}

function SharedLibrary() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["study-kits", "public", q],
    queryFn: () => fetchStudyKits({ public: true, q }),
  });

  async function fork(id: string) {
    try {
      const kit = await forkStudyKit(id);
      toast.success("Forked to your kits");
      qc.invalidateQueries({ queryKey: ["study-kits"] });
      window.location.href = `/study/${kit.id}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fork");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shared library"
        description="Discover public study kits from other .edu.et students — fork any kit into your workspace."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search kits…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <DataBoundary
        resource="Shared library"
        isLoading={list.isLoading}
        isError={list.isError}
        error={list.error}
        isEmpty={(list.data?.length ?? 0) === 0}
        emptyTitle="No public kits yet"
        emptyDescription="Mark one of your kits as public to share with classmates."
        onRetry={() => list.refetch()}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(list.data ?? []).map((kit) => (
            <Card key={kit.id} className="p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-[10px] uppercase">
                  {kit.sourceType}
                </Badge>
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-medium line-clamp-2">{kit.title}</h3>
              <p className="text-xs text-muted-foreground">
                {kit.ownerName ?? "Student"} · {kit.flashcardCount} cards · {kit.forkCount} forks
              </p>
              <div className="flex gap-2 mt-auto">
                <Link to="/study/$kitId" params={{ kitId: kit.id }} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Preview
                  </Button>
                </Link>
                <Button size="sm" className="gap-1" onClick={() => fork(kit.id)}>
                  <Copy className="h-3.5 w-3.5" />
                  Fork
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </DataBoundary>
    </div>
  );
}

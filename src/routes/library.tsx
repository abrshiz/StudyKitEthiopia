import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PageHeader } from "@/components/coming-soon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Library — StudyKit ET" }] }),
  component: Library,
});

function Library() {
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="Content library"
          description="Course materials for your department will appear here."
          featureId="library"
        >
          <Badge variant="secondary" className="gap-1.5">
            <ShieldAlert className="h-3 w-3" /> PDFs will be watermarked with your student ID
          </Badge>
        </PageHeader>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search materials…" className="pl-9" disabled />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all" disabled>
              All
            </TabsTrigger>
            <TabsTrigger value="y1" disabled>
              Year 1
            </TabsTrigger>
            <TabsTrigger value="y2" disabled>
              Year 2
            </TabsTrigger>
            <TabsTrigger value="y3" disabled>
              Year 3
            </TabsTrigger>
            <TabsTrigger value="y4" disabled>
              Year 4
            </TabsTrigger>
            <TabsTrigger value="exams" disabled>
              Past exams
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <EmptyState
          title="Library is empty"
          description="When your university connects materials, PDFs, slides, and past exams will show up here with download limits and DRM watermarks."
        />
      </div>
    </AppShell>
  );
}

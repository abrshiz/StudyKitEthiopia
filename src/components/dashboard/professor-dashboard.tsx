import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { DataBoundary } from "@/components/shared/api-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useMaterials } from "@/hooks/use-materials";
import { Upload, BookOpen, MessageSquare, Users } from "lucide-react";

export function ProfessorDashboard() {
  const { user, department } = useAuth();
  const materials = useMaterials("", "all");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name?.split(" ")[0] ?? "Lecturer"}`}
        description="Manage course materials, review uploads, and support students in your department."
      >
        <Badge variant="secondary" className="shrink-0">
          {user?.roleLabel ?? "Lecturer / Professor"}
        </Badge>
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <Upload className="h-5 w-5 text-primary mb-2" />
          <div className="font-medium text-sm">Upload materials</div>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, slides, past exams for your courses
          </p>
          <Link to="/library">
            <Button size="sm" className="mt-3 w-full">
              Open library
            </Button>
          </Link>
        </Card>
        <Card className="p-4">
          <MessageSquare className="h-5 w-5 text-primary mb-2" />
          <div className="font-medium text-sm">AI course assistant</div>
          <p className="text-xs text-muted-foreground mt-1">
            Answer student questions grounded in your files
          </p>
          <Link to="/ai-chat">
            <Button size="sm" variant="outline" className="mt-3 w-full">
              Open AI tools
            </Button>
          </Link>
        </Card>
        <Card className="p-4">
          <Users className="h-5 w-5 text-primary mb-2" />
          <div className="font-medium text-sm">Your department</div>
          <p className="text-xs text-muted-foreground mt-1">
            {department ? department.name : "Link a department in your profile when available"}
          </p>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Your course materials
          </h2>
        </div>
        <DataBoundary
          resource="Materials"
          isLoading={materials.isLoading}
          isError={materials.isError}
          error={materials.error}
          isEmpty={(materials.data?.length ?? 0) === 0}
          emptyTitle="No uploads yet"
          emptyDescription="Upload lecture notes and exams — students in your department will see them in the library."
          onRetry={() => materials.refetch()}
        >
          <Card className="divide-y">
            {(materials.data ?? []).slice(0, 8).map((m) => (
              <div key={m.id} className="p-4 flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{m.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.course} · {m.downloads ?? 0} downloads
                  </div>
                </div>
                <Badge variant="outline">{m.type}</Badge>
              </div>
            ))}
          </Card>
        </DataBoundary>
      </div>
    </div>
  );
}

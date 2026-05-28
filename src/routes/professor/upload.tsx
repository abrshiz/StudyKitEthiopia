import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { MaterialUploader } from "@/components/features/material-uploader";
import { fetchDepartments } from "@/lib/api/departments";
import type { Department } from "@/lib/types";

export const Route = createFileRoute("/professor/upload")({
  head: () => ({ meta: [{ title: "Upload (professor) — StudyKit ET" }] }),
  component: ProfessorUpload,
});

function ProfessorUpload() {
  const { user } = useAuth();
  const deptId = user?.professorDepartmentId;

  const department = useQuery<Department | null>({
    queryKey: ["department", deptId],
    enabled: Boolean(deptId),
    queryFn: async () => {
      const all = await fetchDepartments({});
      return all.find((d) => d.id === deptId) ?? null;
    },
  });

  if (!deptId) {
    return (
      <Card className="p-6 text-sm">
        You aren't assigned to a department yet. Ask an admin to set
        `professorDepartmentId` on your account.
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload material"
        description="Uploads go to your department only. PDFs are chunked for AI context automatically."
      />
      <MaterialUploader
        fixedDepartmentId={deptId}
        fixedDepartmentName={department.data?.name}
      />
    </div>
  );
}

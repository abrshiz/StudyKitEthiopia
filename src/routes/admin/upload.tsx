import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialUploader } from "@/components/features/material-uploader";

export const Route = createFileRoute("/admin/upload")({
  head: () => ({ meta: [{ title: "Upload material — StudyKit ET" }] }),
  component: AdminUpload,
});

function AdminUpload() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload material"
        description="Drop a PDF, PPT, or DOC. PDFs are chunked into the AI context index automatically."
      />
      <MaterialUploader />
    </div>
  );
}

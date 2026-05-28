import { FileImage, FileText, FileType } from "lucide-react";

export function MaterialIcon({ type }: { type: string }) {
  const map: Record<string, typeof FileText> = { PDF: FileText, PPT: FileImage, DOC: FileType };
  const Icon = map[type] ?? FileText;
  const color: Record<string, string> = {
    PDF: "bg-red-500/10 text-red-600",
    PPT: "bg-orange-500/10 text-orange-600",
    DOC: "bg-blue-500/10 text-blue-600",
  };
  return (
    <div
      className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${color[type] ?? "bg-muted"}`}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

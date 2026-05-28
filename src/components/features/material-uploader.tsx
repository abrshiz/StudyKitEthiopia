import { useState, type DragEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadMaterial } from "@/lib/api/materials";
import { useDepartments } from "@/hooks/use-departments";
import { Upload, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

export type MaterialUploaderProps = {
  fixedDepartmentId?: string;
  fixedDepartmentName?: string;
};

export function MaterialUploader({ fixedDepartmentId, fixedDepartmentName }: MaterialUploaderProps) {
  const qc = useQueryClient();
  const departments = useDepartments("", "All");

  const [departmentId, setDepartmentId] = useState<string>(fixedDepartmentId ?? "");
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState("Year 1 Semester I");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastResult, setLastResult] = useState<{ title: string; chunks: number } | null>(null);

  const mutation = useMutation({
    mutationFn: uploadMaterial,
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ["materials"] });
      setLastResult({ title: result.material.title, chunks: result.indexedChunks });
      toast.success(
        result.indexedChunks > 0
          ? `Uploaded — ${result.indexedChunks} chunks indexed for AI`
          : "Uploaded",
      );
      setFile(null);
      setTitle("");
      setCourse("");
      setCourseCode("");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Upload failed"),
  });

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Pick a file");
    if (!departmentId) return toast.error("Pick a department");
    if (title.trim().length < 2) return toast.error("Enter a title");
    if (course.trim().length < 1) return toast.error("Enter a course");
    mutation.mutate({
      title: title.trim(),
      course: course.trim(),
      courseCode: courseCode.trim(),
      semester: semester.trim(),
      departmentId,
      file,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`p-8 border-dashed text-center transition ${dragOver ? "bg-accent/30" : ""}`}
      >
        <Upload className="h-8 w-8 mx-auto text-primary" />
        <p className="text-sm mt-2 font-medium">
          {file ? file.name : "Drop a PDF, PPT, or DOC here"}
        </p>
        <p className="text-xs text-muted-foreground">or</p>
        <Input
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-3 max-w-xs mx-auto"
        />
        {file && (
          <p className="text-xs text-muted-foreground mt-2">
            {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "unknown"}
          </p>
        )}
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Data Structures — Lecture 5"
            required
          />
        </div>
        <div>
          <Label htmlFor="course">Course name</Label>
          <Input
            id="course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="Data Structures"
            required
          />
        </div>
        <div>
          <Label htmlFor="code">Course code</Label>
          <Input
            id="code"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            placeholder="CSE 201"
          />
        </div>
        <div>
          <Label htmlFor="sem">Semester</Label>
          <Input
            id="sem"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            placeholder="Year 2 Semester I"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Department</Label>
          {fixedDepartmentId ? (
            <p className="text-sm mt-2">
              {fixedDepartmentName ?? "Your department"}{" "}
              <Badge variant="outline" className="ml-2 text-[10px]">
                locked
              </Badge>
            </p>
          ) : (
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select department…" />
              </SelectTrigger>
              <SelectContent>
                {(departments.data ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} · {d.college}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Uploading…" : "Upload"}
        </Button>
        {lastResult && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Last upload: {lastResult.title} · {lastResult.chunks} chunks indexed
          </p>
        )}
      </div>
    </form>
  );
}

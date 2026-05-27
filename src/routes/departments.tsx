import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { collegeFilters } from "@/config/colleges";
import { FeatureNotice } from "@/components/coming-soon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, GraduationCap } from "lucide-react";
import { setSelectedDepartment } from "@/lib/session";

export const Route = createFileRoute("/departments")({
  head: () => ({ meta: [{ title: "Choose your department — StudyKit ET" }] }),
  component: Departments,
});

function Departments() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [college, setCollege] = useState<(typeof collegeFilters)[number]>("All");

  const filteredCount = useMemo(() => {
    if (!q.trim() && college === "All") return 0;
    return 0;
  }, [q, college]);

  function continueAsGuest() {
    setSelectedDepartment({
      id: "pending",
      name: "Department not selected",
      college: college === "All" ? "—" : college,
    });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold">StudyKit ET</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Choose your department</h1>
        <p className="mt-2 text-muted-foreground">
          The full catalog of Ethiopian university departments will appear here once the API is connected.
        </p>

        <div className="mt-6">
          <FeatureNotice featureId="departments" />
        </div>

        <div className="mt-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search e.g. Software Engineering, Medicine, Accounting…"
            className="pl-10 h-12"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {collegeFilters.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCollege(c)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs border transition ${
                college === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          {filteredCount} departments {q.trim() ? `matching “${q}”` : "loaded"}
        </div>

        <Card className="mt-6 p-10 text-center border-dashed">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Department data is not loaded yet. You can still explore the app — select a college filter and continue,
            then switch your department when the catalog goes live.
          </p>
        </Card>

        <div className="sticky bottom-4 mt-8 flex flex-wrap justify-end gap-2">
          <Link to="/login">
            <Button variant="outline">Sign in first</Button>
          </Link>
          <Button size="lg" onClick={continueAsGuest}>
            Continue to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

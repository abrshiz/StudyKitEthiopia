import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { departments } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, Users } from "lucide-react";

export const Route = createFileRoute("/departments")({
  head: () => ({ meta: [{ title: "Choose your department — StudyKit ET" }] }),
  component: Departments,
});

const colleges = ["All", "Engineering & Technology", "Health Sciences", "Natural Sciences", "Agriculture", "Business & Economics", "Law", "Education", "Arts", "Language & Communication", "Social Sciences & Humanities"];

function Departments() {
  const [q, setQ] = useState("");
  const [college, setCollege] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return departments.filter((d) =>
      (college === "All" || d.college === college) &&
      d.name.toLowerCase().includes(q.toLowerCase())
    );
  }, [q, college]);

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
        <p className="mt-2 text-muted-foreground">231 departments across all Ethiopian public universities. Pick yours to personalize your library.</p>

        <div className="mt-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search e.g. Software Engineering, Medicine, Accounting…" className="pl-10 h-12" />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {colleges.map((c) => (
            <button
              key={c}
              onClick={() => setCollege(c)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs border transition ${
                college === c ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">{filtered.length} departments</div>

        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.slice(0, 60).map((d) => {
            const active = selected === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                className="text-left"
              >
                <Card className={`p-4 transition ${active ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"}`}>
                  <Badge variant="secondary" className="text-[10px]">{d.college}</Badge>
                  <div className="font-medium mt-2">{d.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {d.students.toLocaleString()} students
                  </div>
                </Card>
              </button>
            );
          })}
        </div>

        {filtered.length > 60 && (
          <div className="text-center text-xs text-muted-foreground mt-4">
            Showing 60 of {filtered.length} — refine your search to see more
          </div>
        )}

        <div className="sticky bottom-4 mt-8 flex justify-end">
          <Link to="/dashboard">
            <Button size="lg" disabled={!selected}>
              {selected ? "Continue to dashboard" : "Select a department"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

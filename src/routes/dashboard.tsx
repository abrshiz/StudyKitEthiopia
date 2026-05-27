import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { materials, aiSuggestions } from "@/lib/data";
import { Flame, BookOpen, Sparkles, Clock, TrendingUp, FileText, FileType, FileImage, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StudyKit ET" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Selam, Selam 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">Software Engineering · Addis Ababa University · Year 3 · Semester 1</p>
          </div>
          <Badge className="gap-1.5 bg-orange-500/15 text-orange-700 dark:text-orange-300 border-0">
            <Flame className="h-3 w-3" /> 7-day streak
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={BookOpen} label="Materials" value="124" sub="in your library" />
          <StatCard icon={Clock} label="Study time" value="14h" sub="this week" />
          <StatCard icon={Sparkles} label="AI sessions" value="38" sub="this month" />
          <StatCard icon={TrendingUp} label="Completion" value="68%" sub="semester progress" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent materials */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent materials</h2>
              <Link to="/library"><Button variant="ghost" size="sm" className="gap-1">See all <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
            </div>
            <Card>
              <div className="divide-y">
                {materials.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-4 hover:bg-accent/30 transition">
                    <FileIcon type={m.type} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{m.course} · {m.semester} · {m.size}</div>
                    </div>
                    <div className="hidden sm:block text-xs text-muted-foreground">{m.updated}</div>
                    <Link to="/library"><Button size="sm" variant="ghost">Open</Button></Link>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* AI Suggestions + Progress */}
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent/40 grid place-items-center text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI suggestions</h3>
                  <p className="text-xs text-muted-foreground">Based on your last sessions</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {aiSuggestions.map((s) => (
                  <Link key={s} to="/ai-chat" className="block text-sm px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-accent/40 transition">
                    {s}
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-sm">Semester progress</h3>
              <div className="mt-4 space-y-3">
                {[
                  { c: "Data Structures", v: 82 },
                  { c: "Operating Systems", v: 64 },
                  { c: "Databases", v: 71 },
                  { c: "Networks", v: 45 },
                ].map((x) => (
                  <div key={x.c}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>{x.c}</span><span className="text-muted-foreground">{x.v}%</span>
                    </div>
                    <Progress value={x.v} className="h-1.5" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </Card>
  );
}

function FileIcon({ type }: { type: string }) {
  const map: Record<string, any> = { PDF: FileText, PPT: FileImage, DOC: FileType };
  const I = map[type] ?? FileText;
  const color: Record<string, string> = {
    PDF: "bg-red-500/10 text-red-600",
    PPT: "bg-orange-500/10 text-orange-600",
    DOC: "bg-blue-500/10 text-blue-600",
  };
  return (
    <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${color[type] ?? "bg-muted"}`}>
      <I className="h-5 w-5" />
    </div>
  );
}

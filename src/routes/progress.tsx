import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { badges } from "@/lib/data";
import { Flame, Trophy, Clock, BookOpen } from "lucide-react";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — StudyKit ET" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const activity = [40, 65, 80, 45, 90, 30, 60];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your progress</h1>
          <p className="text-sm text-muted-foreground mt-1">Keep the streak alive — consistency beats intensity.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat icon={Flame} label="Current streak" value="7 days" tone="bg-orange-500/15 text-orange-600" />
          <Stat icon={Trophy} label="Longest streak" value="21 days" tone="bg-amber-500/15 text-amber-600" />
          <Stat icon={Clock} label="This week" value="14h 22m" tone="bg-primary/15 text-primary" />
          <Stat icon={BookOpen} label="Materials read" value="124" tone="bg-blue-500/15 text-blue-600" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-2">
            <h2 className="font-semibold">This week</h2>
            <div className="mt-6 flex items-end gap-2 h-40">
              {activity.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary/15 rounded-md flex items-end" style={{ height: "100%" }}>
                    <div className="w-full bg-primary rounded-md transition-all" style={{ height: `${v}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{days[i]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Badges</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {badges.map((b) => (
                <div key={b.name} className={`p-3 rounded-xl text-center border ${b.earned ? "bg-accent/30" : "opacity-40"}`}>
                  <div className="text-2xl">{b.icon}</div>
                  <div className="text-[11px] mt-1 leading-tight">{b.name}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="font-semibold">Course completion</h2>
          <div className="mt-4 space-y-4">
            {[
              { c: "Data Structures & Algorithms", v: 82, hrs: "12h" },
              { c: "Operating Systems", v: 64, hrs: "9h" },
              { c: "Database Systems", v: 71, hrs: "11h" },
              { c: "Computer Networks", v: 45, hrs: "5h" },
              { c: "Software Engineering Principles", v: 30, hrs: "3h" },
            ].map((x) => (
              <div key={x.c}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{x.c}</span>
                  <span className="text-muted-foreground"><Badge variant="secondary" className="text-[10px] mr-2">{x.hrs}</Badge>{x.v}%</span>
                </div>
                <Progress value={x.v} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <Card className="p-4">
      <div className={`h-9 w-9 rounded-lg grid place-items-center ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs text-muted-foreground mt-3">{label}</div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </Card>
  );
}

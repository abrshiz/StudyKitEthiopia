import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Users, TrendingUp, FileText, MessageSquare, Megaphone, Activity, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — StudyKit ET" }] }),
  component: Admin,
});

function Admin() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage content, users, and platform-wide notifications.</p>
          </div>
          <Badge variant="secondary" className="gap-1.5"><ShieldAlert className="h-3 w-3" /> Admin role · 2FA active</Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={Users} label="Active users (7d)" value="12,847" delta="+8.4%" />
          <Kpi icon={FileText} label="Materials" value="3,421" delta="+126 this week" />
          <Kpi icon={TrendingUp} label="Downloads today" value="8,219" delta="+12%" />
          <Kpi icon={Activity} label="AI sessions" value="2,103" delta="last 24h" />
        </div>

        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="notify">Notify</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-5">
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="p-6 lg:col-span-1 border-dashed">
                <Upload className="h-8 w-8 text-primary" />
                <h3 className="font-semibold mt-3">Upload materials</h3>
                <p className="text-xs text-muted-foreground mt-1">PDFs, PPTs, DOCs. Auto-tagged by department & semester.</p>
                <Input type="file" className="mt-4" multiple />
                <Button className="w-full mt-3">Upload to library</Button>
              </Card>
              <Card className="lg:col-span-2">
                <div className="p-5 border-b">
                  <h3 className="font-semibold">Recent uploads</h3>
                </div>
                <div className="divide-y">
                  {[
                    { t: "Compilers — Lecture 12", d: "Computer Science", u: "Prof. Mulu" },
                    { t: "Hematology Case Studies", d: "Medicine", u: "Dr. Kebede" },
                    { t: "Macroeconomics Set 3", d: "Economics", u: "Prof. Hanna" },
                    { t: "Surveying Field Notes", d: "Civil Engineering", u: "Eng. Tewodros" },
                  ].map((x) => (
                    <div key={x.t} className="p-4 flex items-center justify-between hover:bg-accent/20">
                      <div>
                        <div className="font-medium text-sm">{x.t}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{x.d} · uploaded by {x.u}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">View</Button>
                        <Button size="sm" variant="ghost" className="text-destructive">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-5">
            <Card className="p-6">
              <h3 className="font-semibold">Top materials this week</h3>
              <div className="mt-4 space-y-3">
                {[
                  { t: "Data Structures — Trees & Graphs", d: 1240 },
                  { t: "Database Systems — Final Notes", d: 2104 },
                  { t: "OS Lecture 7", d: 892 },
                  { t: "Discrete Math Practice", d: 678 },
                ].map((m) => (
                  <div key={m.t}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{m.t}</span><span className="text-muted-foreground">{m.d}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(m.d / 2200) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="mt-5">
            <Card>
              <div className="divide-y">
                {[
                  { id: "T-1042", subj: "Can't download past exams", user: "biruk@ju.edu.et", status: "Open", time: "12m ago" },
                  { id: "T-1041", subj: "Watermark covers page numbers", user: "hanan@bdu.edu.et", status: "In progress", time: "1h ago" },
                  { id: "T-1040", subj: "TeleBirr payment stuck", user: "yohannes@aau.edu.et", status: "Resolved", time: "3h ago" },
                ].map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{t.subj}</div>
                        <div className="text-xs text-muted-foreground">{t.id} · {t.user} · {t.time}</div>
                      </div>
                    </div>
                    <Badge variant={t.status === "Resolved" ? "secondary" : t.status === "Open" ? "destructive" : "default"}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notify" className="mt-5">
            <Card className="p-6 max-w-2xl">
              <Megaphone className="h-6 w-6 text-primary" />
              <h3 className="font-semibold mt-3">Send bulk notification</h3>
              <div className="space-y-3 mt-4">
                <Input placeholder="Title (e.g. New OS lecture available)" />
                <textarea className="w-full min-h-[120px] rounded-md border bg-background p-3 text-sm" placeholder="Message body…" />
                <div className="flex flex-wrap gap-2 text-xs">
                  {["All students", "Computer Science", "Medicine", "Year 3 only"].map((s) => (
                    <Badge key={s} variant="outline" className="cursor-pointer">{s}</Badge>
                  ))}
                </div>
                <Button>Send push notification</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-5">
            <Card>
              <div className="p-5 border-b flex items-center justify-between">
                <h3 className="font-semibold">Audit log</h3>
                <span className="text-xs text-muted-foreground">Every view & download is tracked</span>
              </div>
              <div className="divide-y font-mono text-xs">
                {[
                  ["2026-05-27 09:12", "selam@aau.edu.et", "DOWNLOAD", "m3 · Database Systems Final"],
                  ["2026-05-27 09:08", "biruk@ju.edu.et", "VIEW", "m1 · Data Structures"],
                  ["2026-05-27 09:05", "admin@aau.edu.et", "UPLOAD", "Compilers Lecture 12"],
                  ["2026-05-27 09:01", "hanan@bdu.edu.et", "AI_CHAT", "Asked about normalization"],
                  ["2026-05-27 08:58", "yohannes@aau.edu.et", "DOWNLOAD_BLOCKED", "rate limit (50/day)"],
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-[140px_220px_120px_1fr] gap-3 p-3 hover:bg-accent/20">
                    <span className="text-muted-foreground">{row[0]}</span>
                    <span>{row[1]}</span>
                    <Badge variant="outline" className="text-[10px] w-fit">{row[2]}</Badge>
                    <span className="text-muted-foreground truncate">{row[3]}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Kpi({ icon: Icon, label, value, delta }: { icon: any; label: string; value: string; delta: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="text-xs text-primary mt-0.5">{delta}</div>
    </Card>
  );
}

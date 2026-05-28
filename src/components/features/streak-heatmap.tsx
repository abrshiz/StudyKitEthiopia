import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { useQuery } from "@tanstack/react-query";
import { fetchStreakCalendar } from "@/lib/api/streak";
import { Card } from "@/components/ui/card";

type Entry = { day: string; count: number };

function valueClass(count: number): string {
  if (!count) return "color-empty";
  if (count < 2) return "color-scale-1";
  if (count < 5) return "color-scale-2";
  if (count < 10) return "color-scale-3";
  return "color-scale-4";
}

export function StreakHeatmap({ days = 180 }: { days?: number }) {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - days);

  const { data = [] } = useQuery<Entry[]>({
    queryKey: ["streak-calendar", days],
    queryFn: () => fetchStreakCalendar(days),
  });

  const values = data.map((d) => ({ date: d.day, count: d.count }));

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Activity heatmap</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Last {days} days of audit-log activity (downloads, AI queries, logins).
      </p>
      <div className="streak-heatmap text-xs">
        <CalendarHeatmap
          startDate={start}
          endDate={today}
          values={values}
          classForValue={(v: unknown) => {
            const value = v as { count?: number } | null;
            return valueClass(value?.count ?? 0);
          }}
          showWeekdayLabels
        />
      </div>
      <style>{`
        .streak-heatmap .color-empty { fill: var(--muted, #e5e7eb); }
        .streak-heatmap .color-scale-1 { fill: oklch(0.85 0.05 162); }
        .streak-heatmap .color-scale-2 { fill: oklch(0.75 0.1 162); }
        .streak-heatmap .color-scale-3 { fill: oklch(0.6 0.13 162); }
        .streak-heatmap .color-scale-4 { fill: oklch(0.45 0.17 162); }
        .streak-heatmap text { fill: currentColor; opacity: 0.7; }
      `}</style>
    </Card>
  );
}

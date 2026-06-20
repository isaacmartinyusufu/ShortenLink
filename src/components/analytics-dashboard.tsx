import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";

type Click = {
  created_at: string;
  referrer: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
};

export function AnalyticsDashboard({ clicks }: { clicks: Click[] }) {
  const series = useMemo(() => bucketByDay(clicks, 14), [clicks]);
  const refs = useMemo(() => topGroup(clicks, (c) => domainOf(c.referrer) ?? "Direct", 8), [clicks]);
  const devices = useMemo(() => topGroup(clicks, (c) => c.device || "desktop", 6), [clicks]);
  const countries = useMemo(() => topGroup(clicks, (c) => c.country || "Unknown", 8), [clicks]);

  if (clicks.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        No clicks yet — share your link and analytics will appear here in real time.
      </Card>
    );
  }

  const palette = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5 md:col-span-2">
        <h3 className="font-semibold mb-3">Clicks over time</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Top referrers</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={refs} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis dataKey="key" type="category" tick={{ fontSize: 12 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Devices</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={devices} dataKey="count" nameKey="key" outerRadius={80} label>
                {devices.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5 md:col-span-2">
        <h3 className="font-semibold mb-3">Countries</h3>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={countries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="key" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function bucketByDay(clicks: Click[], days: number) {
  const map = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const c of clicks) {
    const k = c.created_at.slice(0, 10);
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map, ([day, clicks]) => ({ day: day.slice(5), clicks }));
}

function topGroup<T>(arr: T[], key: (t: T) => string, top: number) {
  const m = new Map<string, number>();
  for (const t of arr) m.set(key(t), (m.get(key(t)) ?? 0) + 1);
  return Array.from(m, ([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

function domainOf(ref: string | null) {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

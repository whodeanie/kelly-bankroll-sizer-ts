"use client";

import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  median: number[];
  p10: number[];
  p90: number[];
  bankroll: number;
}

interface Row {
  bet: number;
  median: number;
  p10: number;
  band: [number, number];
}

export function SimChart({ median, p10, p90, bankroll }: Props) {
  const data: Row[] = median.map((m, i) => ({
    bet: i,
    median: m,
    p10: p10[i] ?? 0,
    band: [p10[i] ?? 0, p90[i] ?? 0],
  }));

  return (
    <div style={{ width: "100%", height: 360 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
          <XAxis dataKey="bet" tick={{ fill: "#93999f", fontSize: 11 }} />
          <YAxis
            tick={{ fill: "#93999f", fontSize: 11 }}
            tickFormatter={(v: number) => `$${Math.round(v).toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{ background: "#0b0d10", border: "1px solid #1d2126" }}
            formatter={(v: number) => `$${Math.round(v).toLocaleString()}`}
            labelFormatter={(v) => `bet ${v}`}
          />
          <Area
            type="monotone"
            dataKey="band"
            stroke="none"
            fill="#7AA2D4"
            fillOpacity={0.18}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="median"
            stroke="#7AA2D4"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={() => bankroll}
            stroke="#93999f"
            strokeDasharray="3 4"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

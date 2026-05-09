"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const WIN = "var(--chart-positive)";
const LOSS = "var(--chart-neutral)";
const MUTED = "var(--muted)";

export function WinRateDonut({
  wins,
  losses,
  breakeven = 0,
  size = "md",
}: {
  wins: number;
  losses: number;
  breakeven?: number;
  size?: "sm" | "md" | "lg";
}) {
  const data =
    wins + losses + breakeven === 0
      ? [{ name: "empty", value: 1, fill: MUTED }]
      : [
          { name: "Wins", value: wins, fill: WIN },
          { name: "Losses", value: losses, fill: LOSS },
          ...(breakeven > 0
            ? [{ name: "BE", value: breakeven, fill: MUTED }]
            : []),
        ];

  const sizeClass =
    size === "lg" ? "size-40" : size === "sm" ? "size-24" : "size-32";

  return (
    <div className={`relative ${sizeClass} shrink-0`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={data}
            innerRadius="62%"
            outerRadius="92%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

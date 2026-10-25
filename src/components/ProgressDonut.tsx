"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

/** Matches the proportions and clockwise slices of the Admin's territory chart. */
export function ProgressDonut({ completed, pending, primary, secondary, label }: {
  completed: number;
  pending: number;
  primary: string;
  secondary: string;
  label: string;
}) {
  const total = completed + pending;
  const percent = total ? Math.round(completed / total * 100) : 0;
  const values = total ? [{ value: completed }, { value: pending }] : [{ value: 0 }, { value: 1 }];

  return (
    <div className="relative aspect-square w-full max-w-36" role="img" aria-label={`${label}: ${percent}% concluído`}>
      <div className="absolute inset-0" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie data={values} dataKey="value" cx="50%" cy="50%" innerRadius="50%" outerRadius="95%"
              paddingAngle={total && completed && pending ? 2 : 0} startAngle={90} endAngle={-270} isAnimationActive={false}>
              <Cell fill={primary} />
              <Cell fill={secondary} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-semibold" aria-hidden="true">{percent}%</span>
    </div>
  );
}

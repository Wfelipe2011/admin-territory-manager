"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { number } from './common';

type Point = { at: string; primary: number | null; secondary: number | null };
export function TimelineChart({ points, labels, stepMs, unit = '' }: { points: Point[]; labels: [string, string]; stepMs: number; unit?: string }) {
  if (!points.length) return <p className="flex h-64 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">Sem amostras neste período. O histórico começa com a coleta.</p>;
  const sorted = [...points].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const data: Point[] = [];
  sorted.forEach((point, i) => {
    if (i && Date.parse(point.at) - Date.parse(sorted[i - 1].at) > stepMs) data.push({ at: new Date(Date.parse(sorted[i - 1].at) + stepMs).toISOString(), primary: null, secondary: null });
    data.push(point);
  });
  return <div className="h-72 min-w-0 w-full" role="img" aria-label={`Evolução de ${labels.join(' e ')}`}>
    <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ left: -20, right: 12, top: 8, bottom: 4 }}>
      <CartesianGrid vertical={false} stroke="#e8edf0" />
      <XAxis dataKey="at" tickLine={false} axisLine={false} minTickGap={45} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={value => new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} />
      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 'auto']} allowDecimals={!!unit} />
      <Tooltip labelFormatter={label => new Date(label).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} formatter={(value: number) => `${number(value, 2)}${unit}`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
      <Line name={labels[0]} dataKey="primary" type="linear" stroke="#538638" strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
      <Line name={labels[1]} dataKey="secondary" type="linear" stroke="#6486b8" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} isAnimationActive={false} />
    </LineChart></ResponsiveContainer>
  </div>;
}

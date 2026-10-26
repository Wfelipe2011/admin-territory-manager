"use client";
import type { ReactNode } from 'react';
import { Loader2, Pause, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { TenantOption, UsageFilters, ServiceObservation } from './types';

export const number = (value: number | null | undefined, digits = 0) => value == null ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: digits });
export const date = (value: string | null | undefined) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' }) : 'Sem registro';
export const inputClass = 'h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-sm';
export function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <Card className={`min-w-0 rounded-2xl p-4 shadow-sm sm:p-5 ${className}`} aria-label={title}><h2 className="mb-4 text-base font-semibold">{title}</h2>{children}</Card>;
}
export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <Card className="min-w-0 rounded-2xl p-4 shadow-sm sm:p-5" aria-label={label}><h2 className="text-xs font-medium text-slate-500 sm:text-sm">{label}</h2><p className="my-2 break-words text-3xl font-semibold tracking-tight tabular-nums text-slate-900">{value}</p>{detail && <p className="text-xs leading-relaxed text-slate-500">{detail}</p>}</Card>;
}
export function Loading() { return <p role="status" className="flex items-center gap-2 py-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Carregando indicadores…</p>; }
export function ErrorNotice({ error, retry, stale }: { error: string; retry: () => void; stale?: boolean }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p role="alert" className="min-w-0 text-sm text-amber-900">{error}{stale && ' Últimos valores preservados; podem estar desatualizados.'}</p><Button variant="outline" className="min-h-11" onClick={retry}>Tentar novamente</Button></div>;
}
export function RefreshControls({ paused, setPaused, refresh, loading, updatedAt }: { paused: boolean; setPaused: (value: boolean) => void; refresh: () => void; loading: boolean; updatedAt: string | null }) {
  return <div className="flex flex-wrap items-center gap-2"><span className="mr-auto text-xs text-slate-500" role="status">{updatedAt ? `Atualizado ${date(updatedAt)}` : 'Aguardando atualização'}{paused && ' · Pausado'}</span><Button variant="outline" className="min-h-11" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? 'Retomar' : 'Pausar'}</Button><Button variant="outline" className="min-h-11" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Atualizar</Button></div>;
}
export function Filters({ value, change, options, congregation = true }: { value: UsageFilters; change: (value: UsageFilters) => void; options: TenantOption[]; congregation?: boolean }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Filtros de uso">
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-slate-600">Período<select aria-label="Período" className={inputClass} value={value.period} onChange={event => change({ ...value, period: event.target.value, groupBy: event.target.value === '1d' ? '10min' : event.target.value === '30d' ? '1d' : '1h' })}><option value="1d">Últimas 24 horas</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option><option value="custom">Personalizado</option></select></label>
    {congregation && <label className="grid min-w-0 gap-1.5 text-xs font-medium text-slate-600">Congregação<select aria-label="Congregação" className={inputClass} value={value.tenantId} onChange={event => change({ ...value, tenantId: event.target.value })}><option value="">Todas as congregações</option>{options.map(option => <option key={option.id} value={option.id}>{option.name} · {option.city}/{option.state}</option>)}</select></label>}
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-slate-600">Agrupamento<select aria-label="Agrupamento" className={inputClass} value={value.groupBy} onChange={event => change({ ...value, groupBy: event.target.value })}><option value="10min">10 minutos</option><option value="30min">30 minutos</option><option value="1h">1 hora</option><option value="1d">1 dia</option></select></label>
    {value.period === 'custom' && <><label className="grid gap-1.5 text-xs font-medium text-slate-600">De<input type="datetime-local" className={inputClass} value={value.from} onChange={event => change({ ...value, from: event.target.value })} /></label><label className="grid gap-1.5 text-xs font-medium text-slate-600">Até<input type="datetime-local" className={inputClass} value={value.to} onChange={event => change({ ...value, to: event.target.value })} /></label></>}
  </div>;
}
const states = { operational: ['Operacional', 'bg-emerald-50 text-emerald-800'], degraded: ['Degradado', 'bg-amber-50 text-amber-900'], unavailable: ['Indisponível', 'bg-red-50 text-red-800'], unknown: ['Sem medição', 'bg-slate-100 text-slate-600'] };
export function ServiceBadge({ service }: { service: ServiceObservation }) {
  const [label, color] = states[service.state];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${color}`}><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

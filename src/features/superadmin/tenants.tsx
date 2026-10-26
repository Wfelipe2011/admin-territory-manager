"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Building2, LogIn, Pencil, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminRequest } from '@/features/requests/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Filters, Panel, Loading, ErrorNotice, RefreshControls, inputClass, number, date } from './common';
import { useResource } from './use-resource';
import { useUsage } from './use-usage';
import type { Tenant, TenantOption, UsageFilters } from './types';

type TenantDetail = TenantOption & { phone: string | null };
function TenantEditor({ id, close, saved }: { id: number; close: () => void; saved: () => void }) {
  const resource = useResource<TenantDetail>(`admin/tenants/${id}`, true);
  const [form, setForm] = useState({ name: '', city: '', state: '', phone: '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { if (resource.data) setForm({ ...resource.data, phone: resource.data.phone || '' }); }, [resource.data]);
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl"><DialogTitle>Editar congregação</DialogTitle><DialogDescription>Atualize os dados do cadastro.</DialogDescription>{resource.error && <ErrorNotice error={resource.error} retry={resource.refresh} />}{!resource.data && resource.loading && <Loading />}{resource.data && <form className="grid gap-4" onSubmit={async event => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try { await adminRequest(`admin/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(form) }); saved(); close(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  }}>{([{ key: 'name', title: 'Nome', max: 200 }, { key: 'city', title: 'Cidade', max: 200 }, { key: 'state', title: 'UF', max: 2 }, { key: 'phone', title: 'Telefone', max: 30 }] as const).map(field => <label key={field.key} className="grid gap-1.5 text-sm">{field.title}<input className={inputClass} required={field.key !== 'phone'} maxLength={field.max} value={form[field.key]} onChange={event => setForm({ ...form, [field.key]: field.key === 'state' ? event.target.value.toUpperCase() : event.target.value })} /></label>)}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<Button disabled={busy} className="min-h-11">{busy ? 'Salvando…' : 'Salvar cadastro'}</Button></form>}</DialogContent></Dialog>;
}

export function Tenants({ initialFilters, initialCondition }: { initialFilters: UsageFilters; initialCondition: string }) {
  const usage = useUsage(initialFilters), { replaceToken } = useAuth();
  const [search, setSearch] = useState(''), [city, setCity] = useState(''), [state, setState] = useState('');
  const [sort, setSort] = useState('online'), [condition, setCondition] = useState(initialCondition), [page, setPage] = useState(0);
  const [editing, setEditing] = useState<number | null>(null), [busy, setBusy] = useState<number | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const tenants = usage.data?.tenants || [];
  const names = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
  const rows = tenants.filter(row => `${row.name} ${row.city} ${row.state}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')) && (!city || city === row.city) && (!state || state === row.state)
    && (condition !== 'pending' || row.pendingRequests > 0) && (condition !== 'inactive' || row.samples > 0 && !row.fieldActivity && !row.operationalActivity));
  rows.sort((a, b) => (sort === 'name' ? 0 : sort === 'peak' ? (b.peak ?? -1) - (a.peak ?? -1) : sort === 'pending' ? b.pendingRequests - a.pendingRequests : sort === 'activity' ? b.operationalActivity - a.operationalActivity : b.online - a.online) || names.compare(a.name, b.name));
  const pages = Math.max(1, Math.ceil(rows.length / 15)), current = Math.min(page, pages - 1), visible = rows.slice(current * 15, (current + 1) * 15);
  const inspectUrl = (row: Tenant) => {
    const query = new URLSearchParams({ period: usage.filters.period, groupBy: usage.filters.groupBy, tenantId: String(row.id) });
    if (usage.filters.period === 'custom') { query.set('from', usage.filters.from); query.set('to', usage.filters.to); }
    return `/superadmin?${query}`;
  };
  const access = async (row: Tenant) => {
    if (busy !== null) return;
    setBusy(row.id); setError('');
    try {
      const result = await adminRequest<{ token: string }>('admin/tenants/switch', { method: 'POST', headers: { Accept: 'application/json' }, body: JSON.stringify({ tenantId: row.id }) });
      replaceToken(result.token);
      window.location.assign('/dashboard');
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível acessar a congregação.'); setBusy(null); }
  };
  const actions = (row: Tenant) => <div className="flex flex-wrap items-center gap-2"><Button asChild variant="outline" className="min-h-11 px-3 text-xs"><Link href={inspectUrl(row)} aria-label={`Ver indicadores de ${row.name}`}><ArrowUpRight size={15} />Indicadores</Link></Button><Button variant="outline" className="min-h-11 px-3 text-xs" onClick={() => setEditing(row.id)} aria-label={`Editar ${row.name}`} disabled={busy !== null}><Pencil size={14} />Editar</Button><Button className="min-h-11 px-3 text-xs" onClick={() => void access(row)} aria-label={`Acessar ${row.name}`} disabled={busy !== null}><LogIn size={15} />{busy === row.id ? 'Acessando…' : 'Acessar'}</Button></div>;
  const activity = (row: Tenant) => row.fieldActivity || row.operationalActivity > 0 ? 'Com atividade no período' : row.samples ? 'Sem atividade registrada' : 'Sem amostras de campo';
  return <>
    <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#538638]">Gestão global</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Congregações</h1><p className="mt-2 text-sm text-slate-500">Consulte o uso e acesse a gestão de cada congregação.</p></div>
    <div className="space-y-4 rounded-2xl border bg-white p-4 sm:p-5"><Filters value={usage.filters} change={value => { usage.change(value); setPage(0); }} options={usage.options} /><RefreshControls {...usage} /></div>
    {usage.invalid && <p role="alert" className="text-sm text-amber-900">Informe um intervalo válido de até 366 dias.</p>}
    {usage.error && <ErrorNotice error={usage.error} retry={usage.refresh} stale={!!usage.data} />}
    {error && <ErrorNotice error={error} retry={() => setError('')} />}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {usage.loading && !usage.data && <Loading />}
    {usage.data && <Panel title="Uso por congregação">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Filtros da lista">
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-slate-600">Buscar nome ou localidade<div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden /><input type="search" className={`${inputClass} pl-9`} value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></div></label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-slate-600">UF<select aria-label="UF" className={inputClass} value={state} onChange={event => { setState(event.target.value); setCity(''); setPage(0); }}><option value="">Todas</option>{[...new Set(tenants.map(row => row.state))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-slate-600">Cidade<select aria-label="Cidade" className={inputClass} value={city} onChange={event => { setCity(event.target.value); setPage(0); }}><option value="">Todas</option>{[...new Set(tenants.filter(row => !state || row.state === state).map(row => row.city))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-slate-600">Situação<select aria-label="Situação" className={inputClass} value={condition} onChange={event => { setCondition(event.target.value); setPage(0); const query = new URLSearchParams(window.location.search); query.set('condition', event.target.value); window.history.replaceState(null, '', `?${query}`); }}><option value="">Todas</option><option value="pending">Com pendências</option><option value="inactive">Sem atividade registrada</option></select></label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-slate-600">Ordenar<select aria-label="Ordenar" className={inputClass} value={sort} onChange={event => { setSort(event.target.value); setPage(0); }}><option value="online">Online agora</option><option value="peak">Maior pico</option><option value="activity">Atividade operacional</option><option value="pending">Mais pendências</option><option value="name">Nome</option></select></label>
      </div><p className="mb-4 text-xs text-slate-500">Os filtros desta lista não alteram a congregação do usuário.</p>
      {!rows.length ? <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-500"><Building2 className="h-8 w-8 text-slate-300" />Nenhuma congregação encontrada.</div> : <>
        <div className="space-y-3 md:hidden" aria-label="Lista de congregações">{visible.map(row => <article key={row.id} aria-label={row.name} className="rounded-xl border p-3"><h3 className="break-words text-sm font-semibold">{row.name}</h3><p className="mt-1 text-xs text-slate-500">{row.city}/{row.state} · {activity(row)}</p><dl className="my-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-500">Online agora</dt><dd className="mt-1 font-semibold">{number(row.online)}</dd></div><div><dt className="text-slate-500">Pico / média</dt><dd className="mt-1 font-semibold">{number(row.peak)} / {number(row.average, 2)}</dd></div><div><dt className="text-slate-500">Territórios / casas</dt><dd className="mt-1 font-semibold">{number(row.territories)} / {number(row.houses)}</dd></div><div><dt className="text-slate-500">Pendências</dt><dd className="mt-1 font-semibold">{number(row.pendingRequests)}</dd></div></dl><p className="mb-3 text-xs text-slate-500">{number(row.registeredUsers)} usuários · Última alteração de rodada: {date(row.lastActivity)}</p>{actions(row)}</article>)}</div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-xs"><thead><tr className="border-b text-slate-500">{['Congregação', 'Online', 'Pico / média', 'Cadastros', 'Pendências', 'Ações'].map(label => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{visible.map(row => <tr key={row.id} className="border-b align-top last:border-0"><td className="min-w-44 p-3"><strong className="block text-sm font-medium">{row.name}</strong><span className="mt-1 block text-slate-500">{row.city}/{row.state} · {activity(row)}</span><span className="mt-2 block text-[11px] text-slate-500">Rodada: {date(row.lastActivity)}</span></td><td className="p-3 tabular-nums">{number(row.online)}</td><td className="p-3 tabular-nums">{number(row.peak)} / {number(row.average, 2)}</td><td className="min-w-28 p-3">{number(row.territories)} territórios<span className="mt-1 block text-slate-500">{number(row.houses)} casas · {number(row.registeredUsers)} usuários</span></td><td className="p-3 tabular-nums">{number(row.pendingRequests)}</td><td className="min-w-48 p-3">{actions(row)}</td></tr>)}</tbody></table></div>
      </>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-xs text-slate-500" role="status">{number(rows.length)} congregações · Página {current + 1} de {pages}</p><div className="flex gap-2"><Button variant="outline" className="min-h-11" disabled={!current} onClick={() => setPage(current - 1)}>Anterior</Button><Button variant="outline" className="min-h-11" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Próxima</Button></div></div>
    </Panel>}
    {editing !== null && <TenantEditor key={editing} id={editing} close={() => setEditing(null)} saved={() => { setNotice('Cadastro atualizado.'); usage.refresh(); }} />}
  </>;
}

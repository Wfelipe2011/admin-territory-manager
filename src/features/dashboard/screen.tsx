"use client";

import { useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ChevronDown, ClipboardList, House, Loader2, RefreshCw, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/PageTitle";
import { ProgressDonut } from "@/components/ProgressDonut";
import { useRequests } from "@/features/requests/provider";
import type { Round, Territories } from "@/types/territories";
import { useDashboardResource } from "./use-dashboard-resource";

const HistoryChart = dynamic(() => import("@/components/LineChart").then((module) => module.LineChart), {
  loading: () => <Loading label="Carregando gráfico…" />,
});
type MarkedHouses = { date: string; [key: string]: string | number };
const number = (value: number) => value.toLocaleString("pt-BR");
const date = (value: string | null | undefined) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleDateString("pt-BR") : "Data indisponível";
const names = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
const validColor = (value: string, fallback: string) => /^#[a-f0-9]{3}([a-f0-9]{3})?$/i.test(value) ? value : fallback;
const activeAssignment = (territory: Territories, now: number) =>
  !!territory.signature?.key && !!territory.signature.expirationDate && Date.parse(territory.signature.expirationDate) > now;

function Loading({ label = "Carregando…" }: { label?: string }) {
  return <p role="status" className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{label}</p>;
}
function Failure({ error, retry, compact = false }: { error: string; retry: () => void; compact?: boolean }) {
  return (
    <div className="space-y-2">
      <p role="alert" className={`break-words text-red-700 ${compact ? "text-xs" : "text-sm"}`}>{error}</p>
      <Button variant="outline" className={compact ? "min-h-11 w-full whitespace-normal px-2 text-xs" : "min-h-11"} onClick={retry}>Tentar novamente</Button>
    </div>
  );
}
function SummaryMetric({ title, value, icon: Icon, href, loading, error, retry }: {
  title: string;
  value: number | null;
  icon: ComponentType<{ className?: string }>;
  href: string;
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  return (
    <Card aria-label={title}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-h-8 break-words text-xs font-medium text-muted-foreground sm:min-h-0 sm:text-sm">{title}</h2>
          <Icon className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
        </div>
        {loading ? <Loading /> : <>
          {value !== null && <p className="mt-2 text-2xl font-semibold tabular-nums sm:mt-3 sm:text-3xl">{number(value)}</p>}
          {error && <div className="mt-3"><Failure error={error} retry={retry} compact />{value !== null && <p className="mt-2 text-xs text-muted-foreground">Último valor recebido</p>}</div>}
        </>}
        <Link href={href} aria-label={`Ver detalhes de ${title}`} className="mt-2 inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline sm:text-sm"><span className="sm:hidden">Abrir</span><span className="hidden sm:inline">Ver detalhes</span> <ArrowUpRight size={15} aria-hidden /></Link>
      </CardContent>
    </Card>
  );
}
function AttentionList({ title, items, kind, href }: {
  title: string;
  items: Territories[];
  kind: "unassigned" | "expiring";
  href: string;
}) {
  return (
    <Card aria-label={title} className="h-full">
      <CardHeader className="p-4 pb-2"><CardTitle className="text-base font-medium">{title}</CardTitle></CardHeader>
      <CardContent className="p-4 pt-0">
        {items.length ? <>
          <ul className="divide-y">
            {items.slice(0, 5).map((territory) => (
              <li key={territory.territoryId}>
                <Link href={href} aria-label={`Abrir gestão de ${territory.name}`} className="flex min-h-20 items-center justify-between gap-3 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold">{territory.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {kind === "unassigned" ? `${number(territory.negativeCompleted)} casas a fazer · Sem link válido` : territory.overseer || "Dirigente não informado"}
                    </span>
                    {kind === "expiring" && <span className="mt-1 block text-xs text-amber-800">Vence em {new Date(territory.signature.expirationDate!).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>}
                  </span>
                  <ArrowUpRight size={17} className="shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {items.length > 5 && <p className="mt-2 text-xs text-muted-foreground">Exibindo 5 de {number(items.length)} territórios.</p>}
          <Button asChild variant="outline" className="mt-3 min-h-11 w-full"><Link href={href}>Abrir gestão da rodada</Link></Button>
        </> : <p className="flex items-start gap-2 py-4 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />{kind === "unassigned" ? "Nenhum território com casas pendentes está sem designação ativa." : "Nenhum link vence nas próximas 48 horas."}</p>}
      </CardContent>
    </Card>
  );
}

export function DashboardScreen() {
  const rounds = useDashboardResource<Round[]>("rounds/info");
  const houses = useDashboardResource<{ total: number | null }>("dashboard/territory-details");
  const requests = useRequests();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [now, setNow] = useState(Date.now);
  const history = useDashboardResource<MarkedHouses[]>(historyOpen ? "dashboard/marked-houses" : null);
  const openRounds = [...(rounds.data ?? [])].filter((round) => round.status === "open").sort((a, b) => b.round_number - a.round_number);
  const selected = openRounds.find((round) => round.round_number === selectedNumber) ?? openRounds[0];
  const territories = useDashboardResource<Territories[]>(selected ? `territories?round=${selected.round_number}` : null);
  const rows = territories.data ?? [];
  const active = rows.filter((territory) => activeAssignment(territory, now));
  const unassigned = rows.filter((territory) => territory.negativeCompleted > 0 && !activeAssignment(territory, now))
    .sort((a, b) => b.negativeCompleted - a.negativeCompleted || names.compare(a.name, b.name));
  const expiring = active.filter((territory) => Date.parse(territory.signature.expirationDate!) <= now + 48 * 3600000)
    .sort((a, b) => Date.parse(a.signature.expirationDate!) - Date.parse(b.signature.expirationDate!) || names.compare(a.name, b.name));
  const managementUrl = selected ? `/territories/${selected.round_number}` : "/gestao";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const refresh = () => {
    setNow(Date.now());
    rounds.reload();
    houses.reload();
    territories.reload();
    requests.refresh();
    if (historyOpen) history.reload();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-2 pb-10 pt-3 sm:px-4">
      <PageTitle title="Início" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1><p className="mt-1 text-sm text-muted-foreground">Acompanhe o trabalho e veja o que precisa de atenção.</p></div>
        <Button variant="outline" className="min-h-11" onClick={refresh}><RefreshCw size={16} />Atualizar painel</Button>
      </div>
      <section aria-label="Resumo da congregação">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Congregação</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <SummaryMetric title="Rodadas abertas" value={rounds.data ? openRounds.length : null} icon={Layers3} href="/gestao" loading={rounds.loading} error={rounds.error} retry={rounds.reload} />
          <SummaryMetric title="Casas cadastradas" value={houses.data ? houses.data.total ?? 0 : null} icon={House} href="/cadastro/territorio" loading={houses.loading} error={houses.error} retry={houses.reload} />
          <SummaryMetric title="Solicitações pendentes" value={requests.hasSnapshot ? requests.pending : null} icon={ClipboardList} href="/gestao/solicitacoes" loading={!requests.hasSnapshot && !requests.error} error={requests.error} retry={requests.refresh} />
        </div>
      </section>
      <section aria-label="Operação da rodada" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold">Trabalho em andamento</h2><p className="mt-1 text-xs text-muted-foreground">Progresso e designações da rodada selecionada.</p></div>
          <div className="w-full sm:w-auto sm:min-w-64 sm:max-w-sm">
            <label htmlFor="dashboard-round" className="mb-1 block text-xs font-medium text-muted-foreground">Rodada em andamento</label>
            <select id="dashboard-round" className="h-11 w-full min-w-0 rounded-md border bg-white px-3 text-sm" value={selected?.round_number ?? ""} disabled={rounds.loading || !openRounds.length} onChange={(event) => setSelectedNumber(+event.target.value)}>
              {!openRounds.length && <option value="">{rounds.loading ? "Carregando rodadas…" : "Nenhuma rodada aberta"}</option>}
              {openRounds.map((round) => <option key={round.round_number} value={round.round_number}>{round.round_number} · {round.name}</option>)}
            </select>
          </div>
        </div>
        {rounds.loading ? <Loading label="Carregando rodadas…" /> : rounds.error ? <Card><CardContent className="p-5"><Failure error={rounds.error} retry={rounds.reload} /></CardContent></Card> : !selected ? (
          <Card><CardContent className="space-y-3 p-5"><p className="font-medium">Nenhuma rodada em andamento</p><p className="text-sm text-muted-foreground">Abra a gestão para iniciar uma rodada e acompanhar seu progresso.</p><Button asChild className="min-h-11"><Link href="/gestao">Abrir gestão de territórios</Link></Button></CardContent></Card>
        ) : <>
          <Card aria-label="Progresso da rodada">
            <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0"><CardTitle className="break-words text-lg font-medium">{selected.name}</CardTitle><p className="text-xs text-muted-foreground">Iniciada em {date(selected.start_date)}</p></CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-3" data-testid="round-chart-and-data">
                <div className="flex w-1/2 min-w-0 justify-start"><ProgressDonut completed={selected.completed} pending={selected.not_completed} primary={validColor(selected.color_primary, "#7AAD58")} secondary={validColor(selected.color_secondary, "#CBE6BA")} label="Progresso da rodada" /></div>
                <div className="w-1/2 min-w-0 space-y-3 text-sm">
                  <p><strong className="text-xl tabular-nums">{number(selected.completed)}</strong><span className="block text-muted-foreground">casas concluídas</span></p>
                  <p><strong className="text-xl tabular-nums">{number(selected.not_completed)}</strong><span className="block text-muted-foreground">casas a fazer</span></p>
                  {territories.loading ? <Loading label="Carregando designações…" /> : territories.error ? <p className="text-xs text-muted-foreground">Designações indisponíveis</p> : <p><strong className="text-xl tabular-nums">{number(active.length)}</strong><span className="block text-muted-foreground">designações ativas</span></p>}
                </div>
              </div>
              {selected.completed + selected.not_completed === 0 && <p className="mt-3 text-sm text-muted-foreground">Sem casas nesta rodada.</p>}
              <div className="mt-4 border-t pt-3"><Button asChild variant="outline" className="min-h-11"><Link href={managementUrl}>Abrir gestão da rodada <ArrowUpRight size={16} /></Link></Button></div>
            </CardContent>
          </Card>
          <div><h3 className="mb-3 text-base font-semibold">Precisam de atenção</h3>
            {territories.loading ? <Loading label="Carregando designações…" /> : territories.error ? <Card><CardContent className="p-5"><Failure error={territories.error} retry={territories.reload} /></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">
              <AttentionList title="Sem designação ativa" items={unassigned} kind="unassigned" href={managementUrl} />
              <AttentionList title="Vencem em até 48 horas" items={expiring} kind="expiring" href={managementUrl} />
            </div>}
          </div>
        </>}
      </section>
      <section aria-label="Histórico de marcações" className="border-t pt-2">
        <Button variant="ghost" className="min-h-12 w-full justify-between whitespace-normal px-0 text-left" aria-expanded={historyOpen} aria-controls="dashboard-history" onClick={() => setHistoryOpen((open) => !open)}>
          Histórico de marcações por categoria <ChevronDown size={18} className={historyOpen ? "rotate-180" : ""} />
        </Button>
        {historyOpen && <div id="dashboard-history" className="pt-3">
          <p className="mb-3 text-xs text-muted-foreground">Congregação · Até quatro categorias disponíveis. Este gráfico não representa o total geral de casas trabalhadas.</p>
          {history.loading ? <Loading /> : history.error ? <Failure error={history.error} retry={history.reload} /> : !history.data?.length ? <p className="py-4 text-sm text-muted-foreground">Nenhuma marcação disponível para este histórico.</p> : <HistoryChart data={history.data} baseColor="#7AAD58" yAxisConfig={{ label: "Quantidade" }} />}
        </div>}
      </section>
    </div>
  );
}

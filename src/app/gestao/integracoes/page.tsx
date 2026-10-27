"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "@/features/requests/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight, Bot, CircleCheck, Link2, Plug, ShieldCheck } from "lucide-react";
import styles from "@/features/integrations/palette.module.css";

type Connection = { id: string; clientName: string; scopes: string[]; createdAt: string; expiresAt: string; revokedAt: string | null };
type Integrations = { enabled: boolean; mcpUrl: string | null; connections: Connection[] };

export default function IntegrationsPage() {
  const [data, setData] = useState<Integrations | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try { setData(await adminRequest<Integrations>("agent-integrations", { signal })); setError(""); }
    catch (failure) { if (!signal?.aborted) setError(failure instanceof Error ? failure.message : "Não foi possível carregar as integrações."); }
  }, []);
  useEffect(() => { const abort = new AbortController(); void load(abort.signal); return () => abort.abort(); }, [load]);
  async function revoke(id: string) {
    setBusy(id);
    try { await adminRequest(`agent-integrations/${encodeURIComponent(id)}`, { method: "DELETE" }); await load(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível revogar a conexão."); }
    finally { setBusy(null); }
  }
  return <main className={`${styles.palette} mx-auto w-full max-w-5xl space-y-7 p-4 text-foreground sm:p-8`}>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Plug aria-hidden="true" className="h-6 w-6" /></div>
        <div className="max-w-2xl"><h1 className="text-2xl font-semibold tracking-tight">Integrações com agentes</h1><p className="mt-2 leading-relaxed text-muted-foreground">Conecte ChatGPT, Claude Code ou outro cliente MCP à sua congregação. Você escolhe as permissões e pode revogar o acesso a qualquer momento.</p></div>
      </div>
      <Link href="/integracoes" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Como funciona <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
    </header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><Button variant="outline" onClick={() => void load()}>Tentar novamente</Button></div>}
    {!data && !error && <p role="status" className="rounded-xl border bg-card p-6 text-muted-foreground">Carregando integrações…</p>}
    {data && <>
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="connect-agents">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6"><h2 id="connect-agents" className="flex items-center gap-2 font-semibold"><Link2 aria-hidden="true" className="h-5 w-5 text-primary" />Conectar uma conta</h2><span className={`rounded-full px-3 py-1 text-xs font-medium ${data.enabled && data.mcpUrl ? "bg-secondary text-primary" : "bg-slate-100 text-slate-600"}`}>{data.enabled && data.mcpUrl ? "Disponível neste ambiente" : "Ainda não disponível"}</span></div>
        <div className="space-y-5 p-5 sm:p-6">
          {data.enabled && data.mcpUrl ? <div className="space-y-3"><p className="text-sm leading-relaxed text-muted-foreground">Adicione este endereço ao seu cliente de IA e entre com sua conta de administrador.</p><div className="space-y-2 rounded-lg border border-primary/20 bg-secondary/50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Endereço do servidor MCP</p><code className="block break-all text-sm font-medium text-foreground sm:text-base">{data.mcpUrl}</code></div></div> : <p className="text-sm text-muted-foreground">As conexões MCP ainda não foram habilitadas neste ambiente.</p>}
          <div className="flex items-start gap-3 rounded-lg bg-background p-4"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div className="space-y-2 text-sm leading-relaxed"><h3 className="font-semibold">Você controla o acesso</h3><p className="text-muted-foreground">Confira a congregação e as permissões na tela de autorização. A senha é informada somente no Território Digital.</p><p className="text-muted-foreground">O agente recebe dados de territórios, quadras, ruas e casas. As permissões não incluem exclusões, marcações ou acesso a outras congregações.</p></div></div>
        </div>
      </section>
      <section className="space-y-4" aria-labelledby="active-connections"><h2 id="active-connections" className="text-lg font-semibold">Suas conexões nesta congregação</h2>
        {!data.connections.length && <div className="rounded-xl border border-dashed bg-card px-5 py-8 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary"><Bot aria-hidden="true" className="h-6 w-6" /></div><h3 className="font-medium">Nenhuma conexão autorizada</h3><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Depois de autorizar um agente, ele aparecerá aqui com suas permissões e a opção de revogar o acesso.</p></div>}
        <ul className="space-y-3">{data.connections.map(connection => {
          const active = !connection.revokedAt && new Date(connection.expiresAt).getTime() > Date.now();
          return <li key={connection.id} data-connection-id={connection.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm"><div className="flex min-w-0 flex-1 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Bot aria-hidden="true" className="h-5 w-5" /></div><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-semibold">{connection.clientName}</h3><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? "bg-secondary text-primary" : "bg-slate-100 text-slate-600"}`}>{connection.revokedAt ? "Revogada" : active ? "Ativa" : "Expirada"}</span></div><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />{connection.scopes.includes("catalog:write") ? "Consulta, cadastro e edição" : "Somente consulta"}</p><p className="text-xs text-muted-foreground">{`${active ? "Válida" : "Validade original"} até ${new Date(connection.expiresAt).toLocaleDateString("pt-BR")}`}</p></div></div>{active && <Button variant="outline" className="border-red-200 bg-card text-red-700 hover:bg-red-50 hover:text-red-800" disabled={busy !== null} onClick={() => void revoke(connection.id)}>{busy === connection.id ? "Revogando…" : "Revogar acesso"}</Button>}</li>;
        })}</ul>
      </section>
    </>}
  </main>;
}

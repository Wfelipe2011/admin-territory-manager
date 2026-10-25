"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock3, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Block } from "./types";

const names = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
export const compareBlocks = (a: Block, b: Block) =>
  (a.lastWorkedAt ? Date.parse(a.lastWorkedAt) : 0) -
    (b.lastWorkedAt ? Date.parse(b.lastWorkedAt) : 0) ||
  names.compare(a.name, b.name) || a.id - b.id;

function remainingTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  const clock = [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
    .map((value) => String(value).padStart(2, "0")).join(":");
  return `${days ? `${days}d ` : ""}${clock}`;
}

export function BlockCard({ block, href, presence, busy, share, revoke }: {
  block: Block;
  href: string;
  presence: number;
  busy: boolean;
  share: () => void;
  revoke: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  const deadline = block.signature ? Date.parse(block.signature.expirationDate) : 0;
  useEffect(() => {
    setNow(Date.now());
    if (deadline <= Date.now()) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= deadline) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  const active = !!block.signature && deadline > now;
  const percent = block.total ? Math.round((block.completed / block.total) * 100) : 0;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border bg-white p-4 shadow-sm sm:p-5" aria-label={block.name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold">
            <Link href={href} className="underline-offset-4 hover:underline">{block.name}</Link>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {block.lastWorkedAt
              ? `Último trabalho: ${new Date(block.lastWorkedAt).toLocaleDateString("pt-BR")}`
              : "Sem histórico de trabalho"}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-500" aria-label={`${presence} pessoas ativas`}>
          <Users size={14} aria-hidden />{presence}
        </span>
      </div>
      {block.registrationStatus === "pending" && (
        <p className="mt-2 text-xs text-amber-800">Cadastro em análise · Você já pode cadastrar ruas e casas</p>
      )}
      {block.withoutRound > 0 && (
        <p className="mt-2 text-xs text-slate-500">{block.withoutRound} casas aguardando aprovação ou rodada</p>
      )}
      <div className="my-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(var(--field-primary) ${percent}%, var(--field-secondary) 0)` }}
          role="img" aria-label={`${percent}% da quadra concluída`}>
          <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white text-lg font-semibold">{percent}%</span>
        </div>
        <div className="min-w-0 space-y-2 text-sm">
          <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--field-secondary)]" /><span><strong>{block.pending}</strong> a fazer</span></p>
          <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--field-primary)]" /><span><strong>{block.completed}</strong> concluídas</span></p>
          <p className="text-xs leading-relaxed text-slate-500">Sugestão: {block.suggestion}</p>
          {active && (
            <Button variant="outline" className="h-11 w-full rounded-xl border-red-200 px-2 text-xs text-red-700 hover:bg-red-50 hover:text-red-800" disabled={busy} onClick={revoke}>
              Revogar acesso
            </Button>
          )}
        </div>
      </div>
      <div className="mt-auto space-y-3 border-t pt-3">
        <div className="flex min-h-6 items-center gap-2 text-xs text-slate-500">
          <Clock3 size={16} aria-hidden />
          {block.signature ? (
            <span className="tabular-nums" aria-label={`Validade do link de ${block.name}`}>
              {active ? "Expira em " : "Link vencido · "}<strong className="text-slate-700">{remainingTime(deadline - now)}</strong>
            </span>
          ) : <span>Link ainda não gerado</span>}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-11 min-w-0 flex-1 rounded-xl">
            <Link href={href}>Ver ruas <ChevronRight size={18} /></Link>
          </Button>
          <Button className="h-11 w-11 shrink-0 rounded-xl bg-[var(--field-primary)] p-0 text-white" aria-label={`Compartilhar ${block.name}`} title={active ? "Reenviar link" : "Gerar e compartilhar link"} disabled={busy} onClick={share}>
            <Share2 size={19} />
          </Button>
        </div>
      </div>
    </article>
  );
}

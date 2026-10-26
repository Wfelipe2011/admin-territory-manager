"use client";

import type { CSSProperties, ComponentType } from "react";
import { ChartPie, ChevronDown, Clock3, FolderHeart, Heart, ListCollapse, MessageSquarePlus, Share2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { HouseTile, legends, type HouseAppearance } from "./house-tile";
import { CarIcon, PostAddIcon } from "./legacy-icons";

const house: HouseAppearance = {
  number: "102", legend: null, hasRound: true, registrationStatus: "approved",
  pendingRequest: null, dontVisit: false, status: false, leaveLetter: false,
};
const examples: { label: string; house: HouseAppearance; reason?: string; timeLocked?: boolean }[] = [
  { label: "A fazer", house },
  { label: "Concluída", house: { ...house, number: "104", status: true } },
  { label: "Deixar carta", house: { ...house, number: "106", leaveLetter: true } },
  { label: "Não bater", house: { ...house, number: "108", dontVisit: true }, reason: "Não bater" },
  { label: "Sem rodada", house: { ...house, number: "110", hasRound: false }, reason: "Sem rodada" },
  { label: "Desmarcação encerrada", house: { ...house, number: "112", status: true }, timeLocked: true },
];
const leaderHints = [
  { Icon: ChartPie, title: "Gráfico", text: "A fazer e concluídas" },
  { Icon: Share2, title: "Compartilhar", text: "Envie ou reenvie o link" },
  { Icon: Users, title: "Pessoas ativas", text: "Atividade no último minuto" },
  { Icon: Clock3, title: "Validade", text: "Tempo restante do link" },
];

function Hint({ Icon, children }: { Icon: ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-xs text-slate-600"><Icon className="h-5 w-5 shrink-0 text-[var(--field-primary)]" /><span>{children}</span></div>;
}

export function FieldHelp({ open, onOpenChange, block, theme }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: boolean;
  theme: CSSProperties;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={theme} className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md gap-3 overflow-y-auto rounded-2xl">
        <DialogTitle>{block ? "Entenda as casas" : "Ajuda das quadras"}</DialogTitle>
        <DialogDescription className="text-xs">{block ? "Reconheça as cores e os ícones." : "Acompanhe e compartilhe o trabalho."}</DialogDescription>
        {block ? <>
          <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-x-2 gap-y-3" aria-label="Exemplos de casas">
            {examples.map((example) => (
              <figure key={example.label} className="flex min-w-0 flex-col items-center gap-1" aria-label={example.label}>
                <div className="w-16" aria-hidden="true"><HouseTile house={example.house} reason={example.reason} timeLocked={example.timeLocked} /></div>
                <figcaption className="text-center text-xs font-medium leading-tight text-slate-700">{example.label}</figcaption>
              </figure>
            ))}
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-600"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />Cadastro em análise</p>
          <p className="flex items-center gap-2 text-xs text-slate-600"><Heart size={15} fill="currentColor" className="shrink-0 text-rose-600" aria-hidden />Registro pessoal salvo neste aparelho</p>
          <details className="group rounded-xl border px-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium">Siglas das casas <ChevronDown size={16} className="group-open:rotate-180" /></summary>
            <dl className="grid grid-cols-2 gap-3 pb-3 text-xs text-slate-600">
              {Object.entries(legends).map(([label, short]) => <div key={short} className="flex items-start gap-2"><dt className="font-semibold text-slate-800">{short}</dt><dd>{label}</dd></div>)}
            </dl>
          </details>
          <div className="space-y-3 border-t pt-3">
            <Hint Icon={CarIcon}><strong>Como chegar</strong> · Escolha a rua no rodapé.</Hint>
            <Hint Icon={PostAddIcon}><strong>Solicitar alteração</strong> · Abra Mais no rodapé e escolha a rua.</Hint>
            <Hint Icon={MessageSquarePlus}><strong>Registrar conversa</strong> · Abra Registros no rodapé para guardar uma conversa.</Hint>
            <Hint Icon={FolderHeart}><strong>Meus registros</strong> · Abra Registros no rodapé para consultar seus interessados e continuar as conversas.</Hint>
          </div>
        </> : <>
          <div className="grid grid-cols-2 gap-3">
            {leaderHints.map(({ Icon, title, text }) => <div key={title} className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-4 text-center">
              <Icon className="h-8 w-8 text-[var(--field-primary)]" aria-hidden />
              <span className="text-sm font-medium">{title}</span><span className="text-xs text-slate-600">{text}</span>
            </div>)}
          </div>
          <Hint Icon={ListCollapse}>Toque em “Ver ruas” para abrir as casas.</Hint>
        </>}
      </DialogContent>
    </Dialog>
  );
}

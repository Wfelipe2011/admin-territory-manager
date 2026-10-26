"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Street } from "./types";
import { CarIcon, PostAddIcon } from "./legacy-icons";

export type StreetAction = "directions" | "report";

export function StreetPicker({ action, streets, select, mapUrl, close, theme }: {
  action: StreetAction;
  streets: Street[];
  select: (id: number) => boolean;
  mapUrl: (street: Street) => string;
  close: () => void;
  theme: CSSProperties;
}) {
  const transferring = useRef(false);
  const [error, setError] = useState("");
  const [opener] = useState(() => document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const choose = (id: number) => {
    const selected = select(id);
    transferring.current = selected && action === "report";
    if (!selected) setError("Esta rua não está mais disponível. Escolha outra rua.");
    return selected;
  };
  const Icon = action === "directions" ? CarIcon : PostAddIcon;
  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent style={theme} className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md rounded-2xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (!transferring.current && opener?.isConnected) opener.focus();
        }}>
        <DialogTitle>{action === "directions" ? "Como chegar" : "Solicitar alteração"}</DialogTitle>
        <DialogDescription>Escolha a rua da quadra.</DialogDescription>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="max-h-[60dvh] overflow-y-auto" aria-label="Escolha da rua">
          {!streets.length ? <p role="status" className="py-4 text-sm text-slate-600">Nenhuma rua disponível nesta quadra.</p> : (
            <ul className="divide-y">
              {streets.map((street) => {
                const content = <>
                  <Icon className="h-6 w-6 shrink-0 text-[var(--field-primary)]" />
                  <span className="min-w-0 flex-1 text-left"><span className="block break-words font-medium">{street.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">{street.firstNumber ? `${street.firstNumber} – ${street.lastNumber}` : "Sem casas cadastradas"}</span>
                  </span><ChevronRight size={18} className="shrink-0 text-slate-400" aria-hidden />
                </>;
                const className = "flex min-h-16 w-full items-center gap-3 rounded-lg px-2 py-3 text-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800";
                return <li key={street.mappingId ?? -street.id}>
                  {action === "directions" ? <a href={mapUrl(street)} target="_blank" rel="noopener noreferrer" aria-label={street.name} className={className}
                    onClick={(event) => { if (!choose(street.id)) event.preventDefault(); }}>{content}</a> : (
                    <button type="button" aria-label={street.name} className={className} onClick={() => choose(street.id)}>{content}</button>
                  )}
                </li>;
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

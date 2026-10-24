"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown, Compass, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { House, Street } from "./types";
import { HouseGrid } from "./house-grid";

export function StreetAccordion({
  street,
  open,
  toggle,
  mapUrl,
  pending,
  connected,
  now,
  select,
  report,
  editStructure,
  removeStreet,
}: {
  street: Street;
  open: boolean;
  toggle: () => void;
  mapUrl: string;
  pending: Set<number>;
  connected: boolean;
  now: number;
  select: (house: House) => void;
  report: () => void;
  editStructure?: () => void;
  removeStreet?: () => void;
}) {
  const total = street.total;
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={toggle}
      className="overflow-hidden rounded-2xl border bg-white"
      data-street-id={street.id}
    >
      <h2>
        <Collapsible.Trigger className="flex min-h-[76px] w-full items-center gap-3 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-emerald-800">
          <span className="min-w-0 flex-1">
            <span className="block break-words text-base font-semibold leading-snug">
              {street.name}{" "}
              {street.registrationStatus === "pending" && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-normal text-amber-900">
                  Em análise
                </span>
              )}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              {total
                ? `${street.firstNumber} – ${street.lastNumber} · ${street.pending} a fazer`
                : "Sem casas cadastradas"}
            </span>
          </span>
          <span
            className="shrink-0 text-xs tabular-nums text-slate-500"
            aria-label={`${street.completed} de ${total} concluídas`}
          >
            {street.completed}/{total}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-slate-500 transition-transform motion-reduce:transition-none ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Content>
        <div className="space-y-3 border-t p-3">
          <HouseGrid
            houses={street.houses}
            streetName={street.name}
            pending={pending}
            connected={connected}
            now={now}
            select={select}
          />
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button
              variant="ghost"
              className="h-11 rounded-xl px-3 text-xs"
              asChild
            >
              <a href={mapUrl} target="_blank" rel="noreferrer">
                <Compass size={16} />
                Como chegar
              </a>
            </Button>
            <Button
              variant="ghost"
              className="h-11 rounded-xl px-3 text-xs"
              onClick={report}
            >
              <Pencil size={16} />
              Solicitar alteração
            </Button>
            {editStructure && (
              <Button
                variant="ghost"
                className="h-11 rounded-xl px-3 text-xs"
                onClick={editStructure}
              >
                Corrigir rua
              </Button>
            )}
            {removeStreet && (
              <Button
                variant="ghost"
                className="h-11 rounded-xl px-3 text-xs text-red-700"
                onClick={removeStreet}
              >
                Excluir rua
              </Button>
            )}
            {street.pendingRequest &&
              street.registrationStatus === "approved" && (
                <p className="w-full text-xs text-amber-800">
                  Alteração da rua em análise. As casas continuam disponíveis.
                </p>
              )}
            {street.withoutRound > 0 && (
              <p className="w-full text-xs text-slate-500">
                {street.withoutRound} casas em cinza aguardam aprovação ou
                rodada.
              </p>
            )}
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

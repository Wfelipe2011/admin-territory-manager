"use client";

import { Check, Loader2, Mail, LockKeyhole } from "lucide-react";
import type { House } from "./types";

export const legends: Record<string, string> = {
  Comércio: "CM",
  Terreno: "TR",
  Fundos: "FD",
  "Testemunha de Jeová": "TJ",
  Igreja: "IG",
  Escola: "ES",
  Hospital: "HP",
  Apartamento: "AP",
};

export type HouseAppearance = Pick<House,
  "number" | "legend" | "hasRound" | "registrationStatus" | "pendingRequest" |
  "dontVisit" | "status" | "leaveLetter"
>;

/** Shared artwork for real houses and inert help examples. No action handlers. */
export function HouseTile({ house, reason = "", timeLocked = false, busy = false }: {
  house: HouseAppearance;
  reason?: string;
  timeLocked?: boolean;
  busy?: boolean;
}) {
  return (
    <span
      className="relative flex h-full min-h-[80px] w-full flex-col items-center justify-center rounded-xl border-2 px-1 py-3 shadow-sm"
      style={{
        backgroundColor: !house.hasRound || (house.registrationStatus === "pending" && !house.status)
          ? "#E2E8F0"
          : house.dontVisit
          ? "#FEE2E2"
          : house.status
          ? "var(--field-primary)"
          : "#FFFFFF",
        color: house.status && !house.dontVisit && !!house.hasRound ? "#FFFFFF" : "#334155",
        borderColor: house.dontVisit
          ? "#FECACA"
          : house.status
          ? "var(--field-primary)"
          : "#E2E8F0",
      }}
    >
      {(house.pendingRequest || house.registrationStatus === "pending") && (
        <span
          className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500"
          title="Cadastro em análise"
          aria-label="Cadastro em análise"
        />
      )}
      {timeLocked && <LockKeyhole className="absolute right-1 top-1 h-3.5 w-3.5" aria-label="Prazo para desmarcar encerrado" />}
      {house.leaveLetter && !house.dontVisit && !timeLocked && (
        <Mail className="absolute right-1 top-1 h-3.5 w-3.5" aria-label="Deixar carta" />
      )}
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <span className="max-w-full break-all text-xl font-semibold leading-tight">
            {house.number}
          </span>
          {legends[house.legend || ""] && <span className="text-[10px]">{legends[house.legend || ""]}</span>}
          {reason && !timeLocked && <span className="mt-1 text-[9px] leading-tight">{reason}</span>}
          {house.status && !house.dontVisit && <Check size={12} className="absolute bottom-1 right-1" />}
        </>
      )}
    </span>
  );
}

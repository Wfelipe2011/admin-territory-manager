"use client";

import { Check, Loader2, Mail, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import { houseAction } from "./house-permissions";
import { House } from "./types";

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

export function HouseGrid({
  houses,
  streetName,
  pending,
  connected,
  now,
  select,
}: {
  houses: House[];
  streetName: string;
  pending: Set<number>;
  connected: boolean;
  now: number;
  select: (house: House) => void;
}) {
  if (!houses.length)
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        Nenhuma casa cadastrada. Use “Solicitar alteração” para informar um
        endereço.
      </p>
    );
  return (
    <section
      className="grid grid-cols-4 gap-2 min-[420px]:grid-cols-5 sm:grid-cols-8"
      aria-label={`Casas de ${streetName}`}
    >
      {houses.map((house) => {
        const action = houseAction(house, now);
        const timeLocked = action.reason === "Prazo encerrado";
        return (
          <button
            key={house.id}
            type="button"
            aria-label={`Casa ${house.number}${
              house.legend ? `, ${house.legend}` : ""
            }, ${house.status ? "concluída" : "pendente"}${
              action.reason ? `, ${action.reason.toLowerCase()}` : ""
            }`}
            aria-pressed={house.status}
            title={
              action.reason || (house.status ? "Desmarcar casa" : "Marcar casa")
            }
            disabled={(!action.allowed && !timeLocked) || pending.has(house.id) || !connected}
            aria-disabled={(!action.allowed && !timeLocked) || pending.has(house.id) || !connected}
            onClick={() => timeLocked ? toast("O prazo para desmarcar esta casa encerrou. Solicite uma correção ao responsável.", { icon: "🔒" }) : select(house)}
            className="relative flex min-h-[80px] flex-col items-center justify-center rounded-xl border-2 px-1 py-3 shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed"
            style={{
              backgroundColor: !house.hasRound || (house.registrationStatus === "pending" && !house.status)
                ? "#E2E8F0"
                : house.dontVisit
                ? "#FEE2E2"
                : house.status
                ? "var(--field-primary)"
                : "#FFFFFF",
              color:
                house.status && !house.dontVisit && !!house.hasRound
                  ? "#FFFFFF"
                  : "#334155",
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
              <Mail
                className="absolute right-1 top-1 h-3.5 w-3.5"
                aria-label="Deixar carta"
              />
            )}
            {pending.has(house.id) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span className="max-w-full break-all text-base font-semibold">
                  {house.number}
                </span>
                {legends[house.legend || ""] && (
                  <span className="text-[10px]">
                    {legends[house.legend || ""]}
                  </span>
                )}
                {action.reason && (
                  <span className="mt-1 text-[9px] leading-tight">
                    {action.reason}
                  </span>
                )}
                {house.status && !house.dontVisit && (
                  <Check size={12} className="absolute bottom-1 right-1" />
                )}
              </>
            )}
          </button>
        );
      })}
    </section>
  );
}

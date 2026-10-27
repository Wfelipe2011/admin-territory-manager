"use client";

import toast from "react-hot-toast";
import { houseAction } from "./house-permissions";
import { House } from "./types";

import { HouseTile } from "./house-tile";
export { legends } from "./house-tile";

export function HouseGrid({
  houses,
  streetName,
  pending,
  connected,
  now,
  select,
  personalHouseIds,
}: {
  houses: House[];
  streetName: string;
  pending: Set<number>;
  connected: boolean;
  now: number;
  select: (house: House) => void;
  personalHouseIds?: ReadonlySet<number>;
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
      className="flex flex-wrap gap-2"
      aria-label={`Casas de ${streetName}`}
    >
      {houses.map((house) => {
        const action = houseAction(house, now);
        const timeLocked = action.reason === "Prazo encerrado";
        const hasPersonalRecord = personalHouseIds?.has(house.id) ?? false;
        return (
          <button
            key={house.id}
            type="button"
            aria-label={`Casa ${house.number}${
              house.legend ? `, ${house.legend}` : ""
            }, ${house.status ? "concluída" : "pendente"}${
              action.reason ? `, ${action.reason.toLowerCase()}` : ""
            }${hasPersonalRecord ? ", com registro pessoal" : ""}`}
            aria-pressed={house.status}
            title={
              action.reason || (house.status ? "Desmarcar casa" : "Marcar casa")
            }
            disabled={(!action.allowed && !timeLocked) || pending.has(house.id) || !connected}
            aria-disabled={(!action.allowed && !timeLocked) || pending.has(house.id) || !connected}
            onClick={() => timeLocked ? toast("O prazo para desmarcar esta casa encerrou. Solicite uma correção ao responsável.", { icon: "🔒" }) : select(house)}
            className="w-max min-w-[calc((100%-1.5rem)/4)] max-w-full flex-none rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed min-[420px]:min-w-[calc((100%-2rem)/5)] sm:min-w-[calc((100%-3.5rem)/8)]"
          >
            <HouseTile house={house} reason={action.reason} timeLocked={timeLocked} busy={pending.has(house.id)} hasPersonalRecord={hasPersonalRecord} />
          </button>
        );
      })}
    </section>
  );
}

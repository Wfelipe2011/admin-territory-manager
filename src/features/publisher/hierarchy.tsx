"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  MessageSquarePlus,
  UserRound,
} from "lucide-react";
import { PublisherData, SavedAddress, addressLabel, quantity } from "./types";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const natural = (a: string, b: string) =>
  a.localeCompare(b, "pt-BR", { numeric: true });
function group<T>(rows: T[], key: (row: T) => string) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const id = key(row);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id)!.push(row);
  }
  return [...groups.entries()];
}
export function PublisherHierarchy({
  data,
  query,
  openPerson,
  record,
}: {
  data: PublisherData;
  query: string;
  openPerson: (id: string) => void;
  record: (addressId: string) => void;
}) {
  const [openStreet, setOpenStreet] = useState<string | null>(null);
  const peopleByAddress = useMemo(
    () =>
      new Map(
        group(
          data.interested.filter((person) => !person.deletedAt),
          (person) => person.addressId,
        ),
      ),
    [data.interested],
  );
  const conversationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of data.conversations)
      if (!note.deletedAt)
        counts.set(note.interestedId, (counts.get(note.interestedId) ?? 0) + 1);
    return counts;
  }, [data.conversations]);
  const filtered = data.addresses.filter((address) =>
    normalize(
      [
        address.congregation,
        address.city,
        address.state,
        address.territory,
        address.block,
        addressLabel(address),
        ...(peopleByAddress.get(address.id) ?? []).map((person) => person.name),
      ].join(" "),
    ).includes(normalize(query.trim())),
  );
  const territories = group(filtered, (address) =>
    JSON.stringify([address.source, address.tenantId, address.territoryId]),
  );
  if (!filtered.length)
    return (
      <p className="rounded-2xl border bg-white p-5 text-sm text-slate-600">
        {query
          ? "Nenhum interessado ou endereço encontrado."
          : "Seus endereços aparecerão aqui. Na tela de ruas e casas, use Registrar conversa ou importe um arquivo recebido."}
      </p>
    );
  return (
    <section className="space-y-4" aria-label="Endereços salvos">
      {territories
        .sort((a, b) => natural(a[1][0].territory, b[1][0].territory))
        .map(([territoryKey, addresses]) => (
          <section key={territoryKey} className="space-y-3">
            <div className="border-l-2 border-[#44783C]/40 px-3 py-1">
              <p className="break-words text-xs text-slate-600">
                {addresses[0].congregation} ·{" "}
                {[addresses[0].city, addresses[0].state]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
              <h2 className="mt-0.5 break-words text-base font-semibold">
                {addresses[0].territory}
              </h2>
            </div>
            {group(addresses, (address) => String(address.blockId))
              .sort((a, b) => natural(a[1][0].block, b[1][0].block))
              .map(([blockId, blockAddresses]) => (
                <section key={blockId} className="space-y-2">
                  <h3 className="px-1 text-sm font-semibold text-slate-700">
                    {blockAddresses[0].block} · {blockAddresses.length}{" "}
                    {blockAddresses.length === 1
                      ? "casa salva"
                      : "casas salvas"}
                  </h3>
                  <div className="grid items-start gap-3 md:grid-cols-2">
                    {group(blockAddresses, (address) =>
                      String(address.mappingId ?? `street:${address.streetId}`),
                    )
                      .sort((a, b) => natural(a[1][0].street, b[1][0].street))
                      .map(([streetId, streetAddresses]) => {
                        const streetKey = `${territoryKey}:${blockId}:${streetId}`;
                        const open = !!query || openStreet === streetKey;
                        const peopleCount = streetAddresses.reduce(
                          (count, address) =>
                            count +
                            (peopleByAddress.get(address.id)?.length ?? 0),
                          0,
                        );
                        return (
                          <section
                            key={streetKey}
                            className="min-w-0 overflow-hidden rounded-2xl border bg-white"
                          >
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-controls={`street-${streetAddresses[0].id}`}
                              className="flex min-h-14 w-full items-center gap-3 p-3 text-left"
                              onClick={() =>
                                setOpenStreet(open ? null : streetKey)
                              }
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block break-words text-sm font-semibold">
                                  {streetAddresses[0].street}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {quantity(peopleCount, "interessado")} ·{" "}
                                  {quantity(streetAddresses.length, "casa")}
                                </span>
                              </span>
                              <ChevronDown
                                size={20}
                                className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                                aria-hidden
                              />
                            </button>
                            {open && (
                              <div
                                id={`street-${streetAddresses[0].id}`}
                                className="divide-y border-t"
                              >
                                {streetAddresses
                                  .sort((a, b) => natural(a.number, b.number))
                                  .map((address: SavedAddress) => (
                                    <div
                                      key={address.id}
                                      className="space-y-2 p-3"
                                    >
                                      <p className="break-words px-1 text-sm font-medium">
                                        Casa {address.number}
                                        {address.complement
                                          ? ` · ${address.complement}`
                                          : ""}
                                      </p>
                                      {(peopleByAddress.get(address.id) ?? [])
                                        .sort((a, b) => natural(a.name, b.name))
                                        .map((person) => (
                                          <button
                                            type="button"
                                            key={person.id}
                                            className="flex min-h-14 w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-left hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800"
                                            onClick={() =>
                                              openPerson(person.id)
                                            }
                                          >
                                            <UserRound
                                              size={18}
                                              className="shrink-0 text-emerald-800"
                                            />
                                            <span className="min-w-0 flex-1">
                                              <span className="block break-words text-sm font-semibold">
                                                {person.name}
                                              </span>
                                              <span className="block text-xs text-slate-500">
                                                {quantity(
                                                  conversationCounts.get(
                                                    person.id,
                                                  ) ?? 0,
                                                  "conversa",
                                                )}
                                                {person.nextReturn
                                                  ? ` · Retorno ${person.nextReturn.split("-").reverse().join("/")}`
                                                  : ""}
                                              </span>
                                            </span>
                                            <ChevronRight
                                              size={18}
                                              className="shrink-0"
                                              aria-hidden
                                            />
                                          </button>
                                        ))}
                                      <button
                                        type="button"
                                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed p-2 text-xs text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800"
                                        onClick={() => record(address.id)}
                                      >
                                        <MessageSquarePlus size={18} />
                                        Novo interessado nesta casa
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </section>
                        );
                      })}
                  </div>
                </section>
              ))}
          </section>
        ))}
    </section>
  );
}

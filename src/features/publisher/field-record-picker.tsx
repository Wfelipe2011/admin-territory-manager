"use client";

import { useState, type CSSProperties } from "react";
import { jwtDecode } from "jwt-decode";
import { ChevronRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fieldApiUrl } from "@/features/field/api";
import type { FieldSession, House, Snapshot } from "@/features/field/types";
import { AddressDraft } from "./types";
import { RecordConversationDialog } from "./forms";

export function FieldRecordPicker({
  snapshot,
  session,
  blockId,
  close,
  saved,
  theme,
}: {
  snapshot: Snapshot;
  session: FieldSession;
  blockId: number;
  close: () => void;
  saved: () => void;
  theme: CSSProperties;
}) {
  const [streetId, setStreetId] = useState<number | null>(null);
  const [address, setAddress] = useState<AddressDraft | null>(null);
  const [error, setError] = useState("");
  const street = snapshot.streets.find((street) => street.id === streetId);
  const select = (house: House) => {
    if (!street || !street.houses.some((item) => item.id === house.id)) {
      setError("A casa não está mais disponível. Escolha novamente.");
      return;
    }
    try {
      const { tenantId } = jwtDecode<{ tenantId: number }>(session.token);
      if (!Number.isSafeInteger(tenantId) || tenantId <= 0)
        throw new Error("Escopo indisponível");
      const source = new URL(fieldApiUrl, location.origin);
      const block =
        snapshot.block ?? snapshot.blocks.find((block) => block.id === blockId);
      if (!block) throw new Error("Quadra indisponível");
      // Only address fields are copied; never persist the session or full catalog.
      setAddress({
        source: `${source.origin}${source.pathname.replace(/\/$/, "")}`,
        tenantId,
        territoryId: snapshot.territory.id,
        blockId,
        streetId: street.id,
        mappingId: street.mappingId,
        houseId: house.id,
        congregation: snapshot.tenancy.name,
        city: snapshot.tenancy.city,
        state: snapshot.tenancy.state,
        territory: snapshot.territory.name,
        block: block.name,
        street: street.name,
        number: house.number,
        complement: house.complement || "",
      });
    } catch {
      setError(
        "Não foi possível identificar este endereço. Abra novamente o link recebido e tente outra vez.",
      );
    }
  };
  if (address)
    return (
      <RecordConversationDialog
        address={address}
        close={close}
        saved={saved}
        theme={theme}
      />
    );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        style={theme}
        className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl"
      >
        <DialogTitle>Registrar conversa</DialogTitle>
        <DialogDescription>
          {street
            ? `${street.name} · Escolha a casa.`
            : "Escolha a rua e a casa do interessado."}
        </DialogDescription>
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        {streetId !== null && !street && (
          <p role="status" className="text-sm text-slate-600">
            Esta rua não está mais disponível.
          </p>
        )}
        {streetId !== null && (
          <Button
            variant="ghost"
            className="min-h-11 justify-start"
            onClick={() => {
              setStreetId(null);
              setError("");
            }}
          >
            <ArrowLeft size={18} className="mr-2" />
            Escolher outra rua
          </Button>
        )}
        {street ? (
          <div className="grid grid-cols-3 gap-2" aria-label="Escolha da casa">
            {street.houses.map((house) => (
              <button
                type="button"
                key={house.id}
                className="min-h-16 rounded-xl border bg-slate-50 p-2 text-center hover:bg-emerald-50"
                onClick={() => select(house)}
              >
                <span className="block break-words text-xl font-semibold">
                  {house.number}
                </span>
                {house.complement && (
                  <span className="block break-words text-xs text-slate-500">
                    {house.complement}
                  </span>
                )}
              </button>
            ))}
            {!street.houses.length && (
              <p className="col-span-3 text-sm text-slate-600">
                Nenhuma casa cadastrada nesta rua.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y" aria-label="Escolha da rua">
            {snapshot.streets.map((street) => (
              <button
                type="button"
                key={street.mappingId ?? -street.id}
                className="flex min-h-16 w-full items-center gap-3 rounded-xl px-2 py-3 text-left"
                onClick={() => setStreetId(street.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-medium">
                    {street.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {street.houses.length} casas
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0" />
              </button>
            ))}
            {!snapshot.streets.length && (
              <p role="status" className="py-3 text-sm text-slate-600">
                Nenhuma rua disponível nesta quadra.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

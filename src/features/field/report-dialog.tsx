"use client";

import { CSSProperties, FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fieldRequest } from "./api";
import { FieldSession, House } from "./types";

export function ReportDialog({
  session,
  houses,
  streetName,
  blockId,
  addressId,
  close,
  saved,
  theme,
}: {
  session: FieldSession;
  houses: House[];
  streetName: string;
  blockId: number;
  addressId: number;
  close: () => void;
  saved: () => void;
  theme: CSSProperties;
}) {
  const [type, setType] = useState("add");
  const [selected, setSelected] = useState("");
  const [number, setNumber] = useState("");
  const [legend, setLegend] = useState("Residência");
  const [observations, setObservations] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const house = houses.find((h) => h.id === +selected);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (type !== "add" && !house) {
      setError("Selecione uma casa.");
      return;
    }
    if (!navigator.onLine) {
      setError("Sem conexão. Aguarde a internet voltar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await fieldRequest("change-requests", session, {
        method: "POST",
        timeoutMs: 30000,
        body: JSON.stringify({
          entity: "house",
          action:
            type === "add" ? "create" : type === "remove" ? "delete" : "update",
          ...(type !== "add" ? { houseId: house!.id } : {}),
          territoryId: session.access.territoryId,
          blockId,
          addressId,
          data:
            type === "remove"
              ? {}
              : {
                  number: number.trim(),
                  legend,
                  dontVisit: legend === "Não Bater",
                },
          observations: observations.trim(),
        }),
      });
      saved();
      close();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Não foi possível enviar.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <DialogContent
        style={theme}
        className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl"
      >
        <DialogTitle>Solicitar alteração</DialogTitle>
        <DialogDescription>
          {streetName} · A solicitação será analisada pelo administrador da
          congregação.
        </DialogDescription>
        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-2 text-sm">
            O que precisa ser feito?
            <select
              aria-label="Tipo de solicitação"
              className="h-11 rounded-lg border bg-white px-3"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setSelected("");
                setNumber("");
                setLegend("Residência");
              }}
            >
              <option value="add">Adicionar casa</option>
              <option value="update">Corrigir casa</option>
              <option value="remove">Remover casa</option>
            </select>
          </label>
          {type !== "add" && (
            <label className="grid gap-2 text-sm">
              Casa
              <select
                required
                aria-label="Casa"
                className="h-11 rounded-lg border bg-white px-3"
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  const h = houses.find((h) => h.id === +e.target.value);
                  setNumber(h?.number || "");
                  setLegend(
                    h?.dontVisit ? "Não Bater" : h?.legend || "Residência",
                  );
                }}
              >
                <option value="">Selecione</option>
                {houses
                  .filter((h) => !h.pendingRequest)
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.number} · {h.legend || "Residência"}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {type !== "remove" && (
            <>
              <label className="grid gap-2 text-sm">
                Número
                <Input
                  required
                  maxLength={30}
                  className="h-11"
                  value={number}
                  onChange={(e) => setNumber(e.target.value.toUpperCase())}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Tipo / legenda
                <select
                  aria-label="Tipo / legenda"
                  className="h-11 rounded-lg border bg-white px-3"
                  value={legend}
                  onChange={(e) => setLegend(e.target.value)}
                >
                  {[
                    "Residência",
                    "Comércio",
                    "Terreno",
                    "Fundos",
                    "Apartamento",
                    "Testemunha de Jeová",
                    "Igreja",
                    "Escola",
                    "Hospital",
                    "Não Bater",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="grid gap-2 text-sm">
            Observações
            <Textarea
              required
              maxLength={1000}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Explique a alteração para o administrador"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button
            disabled={busy}
            className="h-12 bg-[var(--field-primary)] text-white hover:opacity-90"
          >
            {busy ? "Enviando…" : "Enviar solicitação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { FormEvent, useState } from "react";
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
import { FieldSession, Street } from "./types";

export type StructureAction = {
  entity: "block" | "street";
  action: "create" | "update" | "delete";
  street?: Street;
};
export function StructureDialog({
  session,
  blockId,
  request,
  close,
  saved,
}: {
  session: FieldSession;
  blockId?: number;
  request: StructureAction;
  close: () => void;
  saved: () => void;
}) {
  const [name, setName] = useState(request.street?.name ?? "");
  const [zipCode, setZipCode] = useState(request.street?.zipCode ?? "");
  const [observations, setObservations] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const title = `${
    request.action === "create"
      ? "Cadastrar"
      : request.action === "update"
      ? "Corrigir"
      : "Excluir"
  } ${request.entity === "block" ? "quadra" : "rua"}`;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fieldRequest("change-requests", session, {
        method: "POST",
        body: JSON.stringify({
          entity: request.entity,
          action: request.action,
          territoryId: session.access.territoryId,
          ...(blockId ? { blockId } : {}),
          ...(request.street
            ? {
                targetId: request.street.mappingId,
                addressId: request.street.id,
              }
            : {}),
          data:
            request.action === "delete"
              ? {}
              : {
                  name: name.trim(),
                  ...(request.entity === "street"
                    ? { zipCode: zipCode.trim() || null }
                    : {}),
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
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {request.action === "create"
            ? "Você já poderá cadastrar os endereços dentro deste cadastro. O administrador analisará o conjunto."
            : "O cadastro atual permanece disponível até a análise do administrador."}
        </DialogDescription>
        <form onSubmit={submit} className="grid gap-4">
          {request.action === "delete" ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Excluir {name}: se aprovada, esta solicitação removerá a rua, suas
              casas e o histórico de rodadas desta quadra.
            </p>
          ) : (
            <>
              <label className="grid gap-2 text-sm">
                Nome
                <Input
                  required
                  maxLength={150}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </label>
              {request.entity === "street" && (
                <label className="grid gap-2 text-sm">
                  CEP (opcional)
                  <Input
                    inputMode="numeric"
                    maxLength={9}
                    pattern="[0-9]{5}-?[0-9]{3}"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="h-11"
                  />
                </label>
              )}
            </>
          )}
          <label className="grid gap-2 text-sm">
            Justificativa
            <Textarea
              required
              maxLength={1000}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button disabled={busy} className="h-12">
            {busy ? "Enviando…" : "Enviar solicitação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

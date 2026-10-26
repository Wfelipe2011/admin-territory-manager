"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { applyImport, previewImport, recordSummary } from "./files";
import { PublisherData, PublisherFile } from "./types";
import { useLocalAction } from "./use-publisher";
import { FormError, actionClass } from "./forms";

export function ImportDialog({
  data,
  file,
  close,
  imported,
}: {
  data: PublisherData;
  file: PublisherFile;
  close: () => void;
  imported: () => void;
}) {
  // Freeze the reviewed base. If another tab changes it, applyImport refuses the
  // transaction instead of reinterpreting the user's choices against new data.
  const [base] = useState(data);
  const preview = useMemo(() => previewImport(base, file), [base, file]);
  const [choices, setChoices] = useState<Record<string, "local" | "incoming">>(
    {},
  );
  const action = useLocalAction();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !action.busy) close();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl">
        <DialogTitle>Revisar importação</DialogTitle>
        <DialogDescription>
          {file.kind === "backup"
            ? "Backup completo"
            : "Interessado compartilhado"}{" "}
          · exportado em {new Date(file.exportedAt).toLocaleString("pt-BR")}.
          Seu nome de publicador será mantido.
        </DialogDescription>
        <p className="rounded-xl bg-emerald-50 p-3 text-sm">
          {preview.added} registros novos · {preview.unchanged} já existentes ·{" "}
          {preview.conflicts.length} decisões
        </p>
        <p className="text-xs text-slate-600">
          Se um interessado ficar excluído após a revisão, suas conversas também
          ficarão excluídas. Manter o cadastro local preserva seus vínculos
          locais.
        </p>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            {file.interested.filter((person) => !person.deletedAt).length}{" "}
            interessados ·{" "}
            {file.conversations.filter((note) => !note.deletedAt).length}{" "}
            conversas · {file.addresses.length} endereços no arquivo
          </p>
          {file.interested.map((person) => (
            <p key={person.id} className="break-words">
              {person.name}
              {person.deletedAt ? " · excluído" : ""} ·{" "}
              {
                file.addresses.find(
                  (address) => address.id === person.addressId,
                )?.street
              }
            </p>
          ))}
        </div>
        {preview.conflicts.map((conflict) => (
          <fieldset
            key={conflict.key}
            className="min-w-0 space-y-3 rounded-xl border p-3"
          >
            <legend className="max-w-full break-words px-1 text-sm font-semibold">
              {conflict.label}
              {conflict.deletion
                ? " · Exclusão recebida"
                : " · Versões diferentes"}
            </legend>
            {conflict.collection === "interested" && conflict.deletion && (
              <p className="text-sm text-red-800">
                Aceitar esta exclusão também exclui as conversas deste
                interessado no aparelho.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {(["local", "incoming"] as const).map((choice) => (
                <label
                  key={choice}
                  className={`block min-w-0 cursor-pointer rounded-xl border p-3 ${choices[conflict.key] === choice ? "border-emerald-700 bg-emerald-50" : "bg-slate-50"}`}
                >
                  <span className="flex min-h-11 items-center gap-2 text-sm font-medium">
                    <input
                      type="radio"
                      name={conflict.key}
                      value={choice}
                      checked={choices[conflict.key] === choice}
                      onChange={() =>
                        setChoices((old) => ({
                          ...old,
                          [conflict.key]: choice,
                        }))
                      }
                    />
                    {choice === "local"
                      ? "Manter local"
                      : conflict.deletion
                        ? "Aceitar exclusão"
                        : "Usar importado"}
                  </span>
                  <span className="block max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-600">
                    {recordSummary(
                      choice === "local" ? conflict.local : conflict.incoming,
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <FormError error={action.error} />
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="min-h-12 rounded-xl"
            disabled={action.busy}
            onClick={close}
          >
            Cancelar
          </Button>
          <Button
            className={actionClass}
            disabled={
              action.busy ||
              preview.conflicts.some((conflict) => !choices[conflict.key])
            }
            onClick={() =>
              void action.run(() => applyImport(preview, choices), imported)
            }
          >
            {action.busy ? "Importando…" : "Confirmar importação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

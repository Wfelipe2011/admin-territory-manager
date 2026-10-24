"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminRequest } from "./api";
import { fieldLink } from "../field/api";

type CatalogLink = {
  key: string;
  overseer: string;
  expirationDate: string;
  canEditStructure: boolean;
};
export function CatalogLinkButton({ territoryId }: { territoryId: number }) {
  const [open, setOpen] = useState(false);
  const [existing, setExisting] = useState<CatalogLink | null>(null);
  const [overseer, setOverseer] = useState("");
  const [expiration, setExpiration] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    setOpen(true);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const link = await adminRequest<CatalogLink | null>(
        `territories/${territoryId}/signature`,
      );
      setExisting(link);
      setEditing(link?.canEditStructure ?? false);
      setOverseer(link?.overseer ?? "");
      setExpiration(link?.expirationDate?.slice(0, 10) ?? "");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível buscar o link.",
      );
    } finally {
      setBusy(false);
    }
  };
  const permissions = async (enabled: boolean) => {
    if (!existing) {
      setEditing(enabled);
      return;
    }
    const previous = editing;
    setEditing(enabled);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminRequest(`signature/${existing.key}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ canEditStructure: enabled }),
      });
      setEditing(enabled);
      setNotice("Permissão atualizada para este link.");
    } catch (e) {
      setEditing(previous);
      setError(
        e instanceof Error ? e.message : "Não foi possível salvar a permissão.",
      );
    } finally {
      setBusy(false);
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const link = await adminRequest<{
        signature: string;
        expirationDate: string;
      }>(`territories/${territoryId}/signature`, {
        method: "POST",
        body: JSON.stringify({
          overseer: overseer.trim(),
          expirationTime: expiration,
          canEditStructure: editing,
        }),
      });
      setExisting({
        key: link.signature,
        expirationDate: link.expirationDate,
        overseer,
        canEditStructure: editing,
      });
      setNotice("Link criado. Compartilhe com o dirigente.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível gerar o link.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button variant="outline" onClick={() => void load()}>
        Link para dirigente
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogTitle>Link do território</DialogTitle>
          <DialogDescription>
            O acesso mostra os endereços mesmo sem rodada e acompanha a última
            rodada aberta compatível.
          </DialogDescription>
          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-1 text-sm">
              Dirigente
              <Input
                required
                maxLength={100}
                disabled={!!existing || busy}
                value={overseer}
                onChange={(e) => setOverseer(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Validade
              <Input
                required
                type="date"
                disabled={!!existing || busy}
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
              />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                disabled={busy}
                checked={editing}
                onChange={(e) => void permissions(e.target.checked)}
              />
              Permitir edição de quadras e ruas
            </label>
            <p className="text-xs text-slate-500">
              Solicitações de casas são permitidas para dirigentes e
              publicadores. Todos os pedidos passam pela análise do
              administrador.
            </p>
            {existing ? (
              <>
                <Input
                  aria-label="Link para dirigente"
                  readOnly
                  value={fieldLink(existing.key)}
                />
                <Button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(fieldLink(existing.key))
                      .then(() => setNotice("Link copiado."))
                      .catch(() => setError("Selecione e copie o link acima."));
                  }}
                >
                  Copiar link
                </Button>
              </>
            ) : (
              <Button disabled={busy}>
                {busy ? "Carregando…" : "Gerar link"}
              </Button>
            )}
            {notice && (
              <p role="status" className="text-sm text-emerald-700">
                {notice}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

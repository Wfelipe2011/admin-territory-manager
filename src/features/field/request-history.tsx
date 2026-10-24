"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fieldRequest } from "./api";
import { FieldSession } from "./types";
import {
  actionLabels,
  entityLabels,
  RequestList,
  requestName,
  statusLabels,
} from "../requests/types";

export function RequestHistory({
  session,
  close,
}: {
  session: FieldSession;
  close: () => void;
}) {
  const [result, setResult] = useState<RequestList | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    void fieldRequest<RequestList>(
      `change-requests?${new URLSearchParams({
        page: String(page),
        ...(status ? { status } : {}),
      })}`,
      session,
      { signal: abort.signal },
    )
      .then(setResult)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [session, page, status]);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl">
        <DialogTitle>Solicitações do território</DialogTitle>
        <DialogDescription>
          Acompanhe a análise dos cadastros e correções deste acesso.
        </DialogDescription>
        <select
          aria-label="Situação das solicitações"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border px-3"
        >
          <option value="">Todas</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {error && <p role="alert">{error}</p>}
        <div className="space-y-3">
          {result?.items.map((row) => (
            <article key={row.id} className="rounded-xl border p-3 text-sm">
              <div className="flex justify-between gap-2">
                <strong>
                  {entityLabels[row.entity]} {requestName(row)}
                </strong>
                <span>{statusLabels[row.status]}</span>
              </div>
              <p className="text-xs text-slate-500">
                #{row.id} · {actionLabels[row.action]}
                {row.isLegacy ? " · Importada" : ""}
              </p>
              <p className="mt-2">{row.observations}</p>
              {row.reviewReason && (
                <p className="mt-2 text-red-800">{row.reviewReason}</p>
              )}
              {row.parentRequestId && (
                <p className="mt-1 text-xs text-slate-500">
                  Vinculada à solicitação #{row.parentRequestId}
                </p>
              )}
            </article>
          ))}
          {result?.total === 0 && (
            <p className="text-sm text-slate-500">
              Nenhuma solicitação encontrada.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-xs">Página {page}</span>
          <Button
            variant="outline"
            disabled={!result || page * result.limit >= result.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

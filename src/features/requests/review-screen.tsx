"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle } from "@/components/ui/PageTitle";
import { adminRequest } from "./api";
import { useRequests } from "./provider";
import {
  ChangeRequest,
  RequestDetail,
  RequestList,
  actionLabels,
  entityLabels,
  requestName,
  statusLabels,
} from "./types";

const fieldLabels: Record<string, string> = {
  number: "Número",
  name: "Nome",
  zipCode: "CEP",
  legend: "Legenda",
  dontVisit: "Não bater",
  phone: "Telefone",
  complement: "Complemento",
  order: "Ordem",
};
const display = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : typeof value === "boolean"
    ? value
      ? "Sim"
      : "Não"
    : String(value);
const context = (row: ChangeRequest) => {
  const labels = row.proposedData._context;
  return [labels?.territory, labels?.block, labels?.street]
    .filter(Boolean)
    .join(" › ");
};
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("pt-BR")
    : "Data original indisponível";

function Comparison({ row }: { row: RequestDetail }) {
  const keys = Object.keys(fieldLabels).filter(
    (key) => key in row.proposedData || key in (row.beforeData ?? {}),
  );
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2">Campo</th>
            <th className="p-2">Antes</th>
            <th className="p-2">Proposta</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key} className="border-t">
              <th className="p-2 font-medium">{fieldLabels[key]}</th>
              <td className="break-words p-2">
                {display(row.beforeData?.[key])}
              </td>
              <td className="break-words p-2">
                {row.action === "delete"
                  ? "Excluir"
                  : display(row.proposedData[key])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewDialog({
  ids,
  decision,
  close,
  saved,
}: {
  ids: number[];
  decision: "approve" | "reject";
  close: () => void;
  saved: () => void;
}) {
  const { revision } = useRequests();
  const [rows, setRows] = useState<RequestDetail[]>([]);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setConfirmed(false);
    void Promise.all(
      ids.map((id) =>
        adminRequest<RequestDetail>(`change-requests/${id}`, {
          signal: abort.signal,
        }),
      ),
    )
      .then(setRows)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [ids, revision]);
  const destructive = rows.filter((row) =>
    decision === "approve"
      ? row.action === "delete"
      : row.action === "create",
  );
  const submit = async () => {
    if (busy || loading) return;
    setBusy(true);
    setError("");
    try {
      await adminRequest("change-requests/review", {
        method: "POST",
        timeoutMs: 120000,
        body: JSON.stringify({
          decision,
          reason: reason.trim(),
          confirmDeletion: confirmed,
          items: rows.map((row) => ({
            id: row.id,
            version: row.version,
            ...(row.impact ? { impactToken: row.impact.token } : {}),
          })),
        }),
      });
      saved();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível revisar.");
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogTitle>
          {decision === "approve" ? "Aprovar" : "Rejeitar"} {ids.length}{" "}
          {ids.length === 1 ? "solicitação" : "solicitações"}
        </DialogTitle>
        <DialogDescription>
          {decision === "approve"
            ? "O conjunto será aplicado em uma única operação, na ordem dos cadastros pais."
            : "Rejeitar um cadastro novo também rejeita seus cadastros dependentes em análise."}
        </DialogDescription>
        {loading ? (
          <p role="status">Conferindo versão e impacto…</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.map((row) => (
              <li key={row.id}>
                #{row.id} · {actionLabels[row.action]} de{" "}
                {entityLabels[row.entity].toLowerCase()} {requestName(row)}
                {row.status !== "pending" && (
                  <strong className="ml-2 text-red-700">Já revisada</strong>
                )}
              </li>
            ))}
          </ul>
        )}
        {destructive.length > 0 && (
          <section className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">
              Exclusão definitiva neste território e quadra
            </p>
            {destructive.map((row) => (
              <p key={row.id}>
                #{row.id}: {row.impact?.houses ?? 0} casas e{" "}
                {row.impact?.rounds ?? 0} registros de rodadas serão removidos.
              </p>
            ))}
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Conferi o impacto e confirmo a exclusão das casas e do histórico
              indicado.
            </label>
          </section>
        )}
        {decision === "reject" && (
          <label className="grid gap-2 text-sm">
            Motivo da rejeição
            <Textarea
              required
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={close}>
            Voltar
          </Button>
          <Button
            disabled={
              busy ||
              loading ||
              rows.length !== ids.length ||
              rows.some((row) => row.status !== "pending") ||
              (destructive.length > 0 && !confirmed) ||
              (decision === "reject" && !reason.trim())
            }
            onClick={() => void submit()}
          >
            {busy
              ? "Aplicando…"
              : decision === "approve"
              ? "Confirmar aprovação"
              : "Confirmar rejeição"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewScreen() {
  const { revision, connected, refresh } = useRequests();
  const [status, setStatus] = useState("pending");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [territoryId, setTerritoryId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<RequestList | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [error, setError] = useState("");
  const [review, setReview] = useState<{
    ids: number[];
    decision: "approve" | "reject";
  } | null>(null);
  const [generation, setGeneration] = useState(0);
  const reload = useCallback(() => {
    setGeneration((n) => n + 1);
    setSelected(new Set());
    refresh();
  }, [refresh]);
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [status, entity, action, territoryId, from, to]);
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    const query = new URLSearchParams({
      page: String(page),
      limit: "25",
      ...(status ? { status } : {}),
      ...(entity ? { entity } : {}),
      ...(action ? { action } : {}),
      ...(territoryId ? { territoryId } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });
    void adminRequest<RequestList>(`change-requests?${query}`, {
      signal: abort.signal,
    })
      .then((result) => {
        setList(result);
        setSelected(
          (old) =>
            new Set(
              [...old].filter((id) =>
                result.items.some(
                  (row) => row.id === id && row.status === "pending",
                ),
              ),
            ),
        );
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [
    page,
    status,
    entity,
    action,
    territoryId,
    from,
    to,
    revision,
    generation,
  ]);
  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    const abort = new AbortController();
    setDetail(null);
    void adminRequest<RequestDetail>(`change-requests/${detailId}`, {
      signal: abort.signal,
    })
      .then(setDetail)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [detailId, revision, generation]);
  const filterClass = "h-10 rounded-lg border bg-white px-3 text-sm";
  const toggle = (id: number) =>
    setSelected((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-8">
      <PageTitle title="Solicitações de endereços" />
      <p className="text-sm text-slate-600">
        Analise cadastros de quadras, ruas e casas. Os endereços novos entram no
        trabalho após aprovação, quando houver rodada aberta compatível.
      </p>
      <section
        className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3 lg:grid-cols-6"
        aria-label="Filtros de solicitações"
      >
        <label className="grid gap-1 text-xs">
          Situação
          <select
            aria-label="Situação"
            className={filterClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          Cadastro
          <select
            aria-label="Cadastro"
            className={filterClass}
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(entityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          Operação
          <select
            aria-label="Operação"
            className={filterClass}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(actionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          Território (ID)
          <Input
            type="number"
            min={1}
            value={territoryId}
            onChange={(e) => setTerritoryId(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs">
          De
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs">
          Até
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-500">
          {list?.total ?? "…"} solicitações ·{" "}
          {connected ? "Atualizado" : "Reconectando…"}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={reload}>
            Atualizar
          </Button>
          <Button
            disabled={!selected.size}
            onClick={() =>
              setReview({ ids: [...selected], decision: "approve" })
            }
          >
            Aprovar seleção ({selected.size})
          </Button>
          <Button
            variant="destructive"
            disabled={!selected.size}
            onClick={() =>
              setReview({ ids: [...selected], decision: "reject" })
            }
          >
            Rejeitar seleção
          </Button>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="space-y-3">
        {list?.items.map((row) => (
          <article
            key={row.id}
            className="flex gap-3 rounded-xl border bg-white p-4"
            data-request-id={row.id}
          >
            {row.status === "pending" && (
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                aria-label={`Selecionar solicitação ${row.id}`}
                checked={selected.has(row.id)}
                onChange={() => toggle(row.id)}
              />
            )}
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() => setDetailId(row.id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">
                  {entityLabels[row.entity]} {requestName(row)}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                  {statusLabels[row.status]}
                </span>
              </div>
              <p className="mt-1 break-words text-xs text-slate-500">
                #{row.id} · {actionLabels[row.action]} · {context(row)}
              </p>
              <p className="my-2 text-sm">{row.observations}</p>
              <p className="text-xs text-slate-500">
                {row.requestedByName ?? "Autor não registrado"} ·{" "}
                {date(row.requestedAt)}
                {row.isLegacy ? " · Importada do fluxo anterior" : ""}
                {row.parentRequestId
                  ? ` · Depende de #${row.parentRequestId}`
                  : ""}
              </p>
            </button>
          </article>
        ))}
        {list?.total === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
            Nenhuma solicitação com esses filtros.
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
        <span className="text-sm">Página {page}</span>
        <Button
          variant="outline"
          disabled={!list || page * list.limit >= list.total}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </Button>
      </div>
      <Dialog
        open={!!detailId && !review}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>Solicitação #{detailId}</DialogTitle>
          <DialogDescription>
            {detail
              ? `${entityLabels[detail.entity]} ${requestName(detail)} · ${
                  statusLabels[detail.status]
                }`
              : "Carregando detalhes…"}
          </DialogDescription>
          {detail && (
            <>
              <p className="text-sm text-slate-500">{context(detail)}</p>
              <p className="text-sm">{detail.observations}</p>
              {detail.isLegacy && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm">
                  Solicitação importada: o fluxo anterior já aplicou a proposta
                  ao cadastro. A aprovação mantém a casa existente; a rejeição
                  restaura o backup ou exclui a inclusão legada após
                  confirmação.
                </p>
              )}
              {detail.conflict && (
                <p role="alert" className="text-sm text-red-700">
                  O cadastro atual mudou ou foi removido. Confira antes de
                  revisar.
                </p>
              )}
              <Comparison row={detail} />
              {(detail.ancestors.length > 0 ||
                detail.descendants.length > 0) && (
                <section className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <h3 className="text-sm font-semibold">
                    Cadastros vinculados
                  </h3>
                  {[...detail.ancestors, detail, ...detail.descendants].map(
                    (row) => (
                      <button
                        key={row.id}
                        className="block text-left text-sm underline-offset-4 hover:underline"
                        onClick={() => setDetailId(row.id)}
                      >
                        #{row.id} · {entityLabels[row.entity]}{" "}
                        {requestName(row)} · {statusLabels[row.status]}
                        {row.parentRequestId
                          ? ` · Pai #${row.parentRequestId}`
                          : ""}
                      </button>
                    ),
                  )}
                </section>
              )}
              {detail.impact && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
                  Impacto de exclusão: {detail.impact.houses} casas e{" "}
                  {detail.impact.rounds} registros de rodadas neste vínculo.
                </p>
              )}
              <section className="space-y-1 text-xs text-slate-500">
                <h3 className="font-semibold">Histórico</h3>
                <p>
                  Enviada: {date(detail.requestedAt)} ·{" "}
                  {detail.requestedByName ?? "Autor não registrado"}
                </p>
                {detail.history.map((event, index) => (
                  <p key={index}>
                    {date(event.at)} ·{" "}
                    {{
                      created: "Solicitação criada",
                      approve: "Aprovada",
                      reject: "Rejeitada",
                      parent_rejected: "Cadastro pai rejeitado",
                      legacy_import: "Importada",
                    }[event.event] ?? event.event}
                    {event.userId ? ` · Usuário #${event.userId}` : ""}
                    {event.reason ? ` · ${event.reason}` : ""}
                  </p>
                ))}
                {detail.reviewReason && <p>{detail.reviewReason}</p>}
              </section>
              {detail.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      setReview({ ids: [detail.id], decision: "approve" })
                    }
                  >
                    Aprovar esta
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setReview({
                        ids: [
                          ...detail.ancestors,
                          detail,
                          ...detail.descendants,
                        ]
                          .filter((row) => row.status === "pending")
                          .map((row) => row.id),
                        decision: "approve",
                      })
                    }
                  >
                    Aprovar conjunto vinculado
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      setReview({ ids: [detail.id], decision: "reject" })
                    }
                  >
                    Rejeitar
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      {review && (
        <ReviewDialog
          ids={review.ids}
          decision={review.decision}
          close={() => setReview(null)}
          saved={() => {
            setDetailId(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

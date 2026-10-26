"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Copy,
  HelpCircle,
  Link2,
  Loader2,
  MapPin,
  Share2,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";
import { navigatorShare } from "@/lib/share";
import { fieldLink, fieldRequest, normalizeCode, sessionKey } from "./api";
import { Block, FieldSession, House, ScreenScope } from "./types";
import { useFieldSync } from "./use-field-sync";
import { ReportDialog } from "./report-dialog";
import { StreetAccordion } from "./street-accordion";
import { houseAction } from "./house-permissions";
import { StructureAction, StructureDialog } from "./structure-dialog";
import { FieldEntry } from "./entry";
import { BlockCard, compareBlocks } from "./block-card";
import { FieldHelp } from "./help-dialog";
import { CarIcon, PostAddIcon } from "./legacy-icons";
import { StreetAction, StreetPicker } from "./street-picker";

const color = (value: string | null, fallback: string) =>
  value && /^#[a-f0-9]{3}([a-f0-9]{3})?$/i.test(value) ? value : fallback;

export function FieldScreen({
  code: rawCode,
  blockId: selectedBlockId,
  addressId: initialAddressId,
}: {
  code: string;
  blockId?: number;
  addressId?: number;
}) {
  const code = normalizeCode(rawCode);
  const [session, setSession] = useState<FieldSession | null>(null);
  const [needsEntry, setNeedsEntry] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(sessionKey(code));
      if (!stored) {
        setNeedsEntry(true);
        return;
      }
      const value = JSON.parse(stored) as FieldSession;
      if (
        value.access.code !== code ||
        new Date(value.access.expiresAt).getTime() <= Date.now()
      ) {
        sessionStorage.removeItem(sessionKey(code));
        setNeedsEntry(true);
        return;
      }
      setSession(value);
    } catch {
      setStorageError(
        "Não foi possível recuperar seu acesso. Abra novamente o link recebido.",
      );
    }
  }, [code]);
  const leader = session?.access.role === "overseer";
  const blockId = selectedBlockId ?? session?.access.blockId ?? undefined;
  const scope: ScreenScope = {
    scope: blockId ? "block" : "territory",
    blockId,
  };
  const sync = useFieldSync(session, scope);
  const [confirmHouse, setConfirmHouse] = useState<{
    house: House;
    streetId: number;
  } | null>(null);
  const [reportStreetId, setReportStreetId] = useState<number | null>(null);
  const [openStreets, setOpenStreets] = useState<Set<number>>(() => new Set());
  const [structure, setStructure] = useState<StructureAction | null>(null);
  const initialStreetOpened = useRef(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [streetAction, setStreetAction] = useState<StreetAction | null>(null);
  const [revokeBlock, setRevokeBlock] = useState<Pick<Block, "id" | "name"> | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [sharing, setSharing] = useState<{
    title: string;
    text: string;
    url: string;
  } | null>(null);
  const base = `/campo/${encodeURIComponent(code)}`;
  const blockPath = (id: number) => `${base}/quadra/${id}`;
  const data = sync.data;
  const palette = data?.roundInfo ?? session?.roundInfo;
  const primary = color(
    palette?.colorPrimary ?? null,
    palette?.theme === "campaign"
      ? "#39768A"
      : palette?.theme === "letters"
      ? "#A56A2E"
      : "#44783C",
  );
  const secondary = color(palette?.colorSecondary ?? null, "#E8F1E4");
  const theme = {
    "--field-primary": primary,
    "--field-secondary": secondary,
  } as CSSProperties;
  const fatal = storageError || sync.fatal;

  useEffect(() => {
    if (!data || !initialAddressId || initialStreetOpened.current) return;
    const street = data.streets.find(
      (street) => street.id === initialAddressId,
    );
    if (street) {
      initialStreetOpened.current = true;
      setOpenStreets(
        new Set([street.mappingId ?? -street.id]),
      );
    }
  }, [data, initialAddressId]);
  useEffect(() => {
    if (sync.fatal) sessionStorage.removeItem(sessionKey(code));
  }, [sync.fatal, code]);
  useEffect(() => {
    if (
      data &&
      initialAddressId &&
      !data.streets.some((street) => street.id === initialAddressId)
    )
      setStorageError("Rua indisponível para este acesso");
  }, [data, initialAddressId]);

  const share = async (id: number) => {
    if (!session || !leader || !data || actionBusy) return;
    const block = data.blocks.find((block) => block.id === id);
    if (!block) return;
    setActionBusy(true);
    setActionError("");
    setNotice("");
    try {
      let signature = block.signature;
      if (!signature || Date.parse(signature.expirationDate) <= Date.now()) {
        const generated = await fieldRequest<{ signature: string; expirationDate: string }>(
            `territories/${session.access.territoryId}/blocks/${id}/signature${
              session.access.round == null ? "" : `/${session.access.round}`
            }`,
            session,
            { method: "POST", body: "{}", timeoutMs: 30000 },
          );
        signature = { key: generated.signature, expirationDate: generated.expirationDate };
        sync.updateBlockSignature(id, signature);
        sync.refresh();
      }
      const message = {
        title: "*DESIGNAÇÃO DE TERRITÓRIO*",
        text: `*DESIGNAÇÃO DE TERRITÓRIO*\n\nPrezado(a) publicador(a),\nsegue o link para a *${block.name}*, no território *${data.territory.name}*, que você está designado(a) para trabalhar:`,
        url: fieldLink(signature.key),
      };
      try {
        await navigatorShare(message);
      } catch {
        // Also lets the user retry sharing from a fresh tap if the browser
        // requires user activation after the signature request.
        setSharing(message);
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o link.",
      );
    } finally {
      setActionBusy(false);
    }
  };
  const revoke = async () => {
    if (!session || !leader || !revokeBlock || actionBusy) return;
    setActionBusy(true);
    setActionError("");
    try {
      await fieldRequest(
        `territories/${session.access.territoryId}/blocks/${revokeBlock.id}/signature`,
        session,
        { method: "DELETE", timeoutMs: 30000 },
      );
      sync.updateBlockSignature(revokeBlock.id, null);
      setRevokeBlock(null);
      setSharing(null);
      toast.success("Acesso da quadra revogado.");
      sync.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível revogar.",
      );
    } finally {
      setActionBusy(false);
    }
  };
  const copyLink = async () => {
    if (!sharing) return;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard indisponível");
      await navigator.clipboard.writeText(`${sharing.text}\n${sharing.url}`);
      setNotice("Mensagem e link copiados.");
    } catch {
      setActionError("Selecione e copie a mensagem exibida acima.");
    }
  };
  const mark = async () => {
    if (!confirmHouse || sync.pending.has(confirmHouse.house.id)) return;
    const { house, streetId } = confirmHouse;
    const current = data?.streets
      .find((street) => street.id === streetId)
      ?.houses.find((item) => item.id === house.id);
    setConfirmHouse(null);
    setActionError("");
    setNotice("");
    if (!current || current.status !== house.status) {
      toast.error(
        "A casa foi atualizada. Confira o estado antes de confirmar novamente.",
      );
      return;
    }
    try {
      await sync.mark(current, streetId);
      toast.success(
        `Casa ${house.number} ${house.status ? "desmarcada" : "marcada"}.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    }
  };
  if (needsEntry && !session)
    return <FieldEntry code={code} blockId={selectedBlockId} addressId={initialAddressId} onReady={setSession} />;
  if (fatal)
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6">
        <section className="max-w-sm rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-semibold">Acesso indisponível</h1>
          <p role="alert" className="my-4 text-sm text-slate-600">
            {fatal}. Solicite um novo link ao responsável.
          </p>
          <Link
            className="text-sm underline"
            href={`/acesso/${encodeURIComponent(code)}`}
          >
            Verificar link novamente
          </Link>
        </section>
      </main>
    );
  if (!session || !data)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <Loader2 className="animate-spin" aria-hidden />
        <p role="status">
          {sync.status === "offline"
            ? "Sem conexão. Aguardando a internet…"
            : sync.status === "reconnecting"
            ? "Tentando conectar novamente…"
            : "Carregando sua designação…"}
        </p>
      </main>
    );
  const back = selectedBlockId && leader ? base : null;
  const mapUrl = (streetName: string, number?: string | null) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${streetName} ${number ?? ""}, ${data.tenancy.city}, ${
        data.tenancy.state
      }`,
    )}`;
  const connected = blockId
    ? sync.presence.blocks[blockId] ?? 0
    : sync.presence.total;
  const reportStreet = data.streets.find(
    (street) => street.id === reportStreetId,
  );
  const currentConfirmation =
    confirmHouse &&
    data.streets
      .find((street) => street.id === confirmHouse.streetId)
      ?.houses.find((house) => house.id === confirmHouse.house.id);
  const confirmAllowed =
    currentConfirmation &&
    currentConfirmation.status === confirmHouse?.house.status &&
    houseAction(currentConfirmation, sync.now).allowed &&
    sync.status === "live";
  const toggleStreet = (id: number) =>
    setOpenStreets((old) => old.has(id) ? new Set() : new Set([id]));

  return (
    <main style={theme} className="min-h-dvh bg-slate-50 pb-[calc(6rem_+_env(safe-area-inset-bottom))] text-slate-900">
      <Toaster position="top-center" />
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
          {back ? (
            <Button
              asChild
              variant="ghost"
              className="h-11 w-11 shrink-0 p-0"
              aria-label="Voltar"
            >
              <Link href={back}>
                <ArrowLeft size={20} />
              </Link>
            </Button>
          ) : null}
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--field-primary)] p-0.5">
            <Image src="/logo.png" alt="Território Digital" width={48} height={48} priority />
          </span>
          <div className="min-w-0 flex-1">
            {blockId ? (
              <>
                <p className="truncate text-[11px] text-slate-500">
                  {data.territory.name}
                </p>
                <h1 className="truncate text-base font-semibold">
                  {data.block?.name || "Ruas da quadra"}
                </h1>
              </>
            ) : (
              <span className="text-sm font-semibold">Território Digital</span>
            )}
          </div>
          <span
            className="flex shrink-0 flex-col items-center gap-0.5 text-center text-[10px] text-slate-500"
            role="status"
          >
            {sync.status === "live" ? (
              <Wifi size={14} className="text-emerald-700" aria-label="Conectado" data-testid="field-connection-icon" />
            ) : (
              <WifiOff size={14} aria-label="Desconectado" data-testid="field-connection-icon" />
            )}
            <span className="flex flex-col items-center leading-snug">
              {sync.lastSyncedAt && (
                <time dateTime={new Date(sync.lastSyncedAt).toISOString()} aria-label="Última sincronização">
                  <span className="block">{new Date(sync.lastSyncedAt).toLocaleDateString("pt-BR")}</span>
                  <span className="block tabular-nums">{new Date(sync.lastSyncedAt).toLocaleTimeString("pt-BR", { hour12: false })}</span>
                </time>
              )}
              {sync.status !== "live" && <span>{sync.status === "offline" ? "Sem conexão" : "Reconectando…"}</span>}
            </span>
          </span>

        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-4">
        {blockId ? (
          <section
            className="space-y-2 rounded-2xl bg-[var(--field-secondary)] px-4 py-3"
            aria-label="Resumo da quadra"
          >
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium">
                {data.roundInfo.name}
              </span>
              <span className="shrink-0 tabular-nums">
                {data.block?.completed ?? 0}/{data.block?.total ?? 0} concluídas
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-white/80"
              role="progressbar"
              aria-label="Progresso da quadra"
              aria-valuemin={0}
              aria-valuemax={data.block?.total || 1}
              aria-valuenow={data.block?.completed ?? 0}
            >
              <div
                className="h-full rounded-full bg-[var(--field-primary)] transition-[width]"
                style={{
                  width: `${
                    data.block?.total
                      ? Math.round(
                          (data.block.completed / data.block.total) * 100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>
                {data.streets.length} ruas · {data.block?.pending ?? 0} casas a
                fazer
              </span>
              <span className="flex items-center gap-1">
                <Users size={13} />
                {connected}{" "}
                {connected === 1 ? "pessoa ativa" : "pessoas ativas"}
              </span>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-[var(--field-secondary)] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">
              Olá
              {session.access.overseer
                ? `, ${session.access.overseer}`
                : ", dirigente"}
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight">
              {data.territory.name}
            </h1>
            <p className="mt-2 text-sm text-slate-700">
              Acompanhe o território e compartilhe as quadras.
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
              <Users size={14} />
              {connected} {connected === 1 ? "pessoa ativa" : "pessoas ativas"}
            </p>
          </section>
        )}
        {sync.status !== "live" && (
          <p
            role="status"
            className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
          >
            {sync.status === "offline"
              ? "Sem internet. As marcações voltam a ficar disponíveis quando a conexão retornar."
              : "Restabelecendo a conexão. Aguarde antes de registrar novas marcações."}
          </p>
        )}
        {actionError && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {actionError}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {notice}
          </p>
        )}
        {leader && data.capabilities.canEditStructure && (
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl border-dashed bg-white"
            onClick={() =>
              setStructure({
                entity: blockId ? "street" : "block",
                action: "create",
              })
            }
          >
            + {blockId ? "Cadastrar rua" : "Cadastrar quadra"}
          </Button>
        )}
        {scope.scope === "territory" && (
          <section
            className="grid gap-4 sm:grid-cols-2"
            aria-label="Quadras do território"
          >
            {[...data.blocks].sort(compareBlocks).map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                href={blockPath(block.id)}
                presence={sync.presence.blocks[block.id] ?? 0}
                busy={actionBusy}
                share={() => void share(block.id)}
                revoke={() => { setActionError(""); setRevokeBlock(block); }}
              />
            ))}
            {!data.blocks.length && (
              <p className="text-sm text-slate-500">
                Nenhuma quadra cadastrada neste território.
              </p>
            )}
          </section>
        )}

        {scope.scope === "block" && (
          <section className="space-y-3" aria-label="Ruas da quadra">
            {data.streets.map((street) => (
              <StreetAccordion
                key={street.mappingId ?? -street.id}
                street={street}
                open={openStreets.has(street.mappingId ?? -street.id)}
                toggle={() => toggleStreet(street.mappingId ?? -street.id)}
                pending={sync.pending}
                connected={sync.status === "live"}
                now={sync.now}
                select={(house) =>
                  setConfirmHouse({ house, streetId: street.id })
                }
                editStructure={
                  leader &&
                  data.capabilities.canEditStructure &&
                  street.mappingId &&
                  !street.pendingRequest
                    ? () =>
                        setStructure({
                          entity: "street",
                          action: "update",
                          street,
                        })
                    : undefined
                }
                removeStreet={
                  leader &&
                  data.capabilities.canEditStructure &&
                  street.mappingId &&
                  !street.pendingRequest
                    ? () =>
                        setStructure({
                          entity: "street",
                          action: "delete",
                          street,
                        })
                    : undefined
                }
              />
            ))}
            {!data.streets.length && (
              <p className="rounded-xl border bg-white p-4 text-sm text-slate-500">
                Nenhuma rua cadastrada nesta quadra.
              </p>
            )}
          </section>
        )}

        <footer className="pb-3 pt-4 text-center text-xs text-slate-400">
          {data.tenancy.name} · Área de campo
        </footer>
      </div>
      <Dialog
        open={!!confirmHouse}
        onOpenChange={(open) => {
          if (!open) setConfirmHouse(null);
        }}
      >
        <DialogContent
          style={theme}
          className="w-[calc(100%_-_2rem)] max-w-sm rounded-2xl"
        >
          <DialogTitle>
            {confirmHouse?.house.status ? "Desmarcar" : "Marcar"} casa{" "}
            {confirmHouse?.house.number}?
          </DialogTitle>
          <DialogDescription>
            {
              data.streets.find(
                (street) => street.id === confirmHouse?.streetId,
              )?.name
            }{" "}
            · Confirme para registrar a alteração.
          </DialogDescription>
          {!confirmAllowed && (
            <p role="alert" className="text-sm text-red-700">
              Esta ação não está mais disponível. Confira a conexão e as
              permissões da casa.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12"
              onClick={() => setConfirmHouse(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={!confirmAllowed}
              className="h-12 bg-[var(--field-primary)] text-white"
              onClick={() => void mark()}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {reportStreet && blockId && (
        <ReportDialog
          session={session}
          houses={reportStreet.houses}
          streetName={reportStreet.name}
          blockId={blockId}
          addressId={reportStreet.id}
          close={() => setReportStreetId(null)}
          saved={() => {
            toast.success("Solicitação enviada para análise.");
            sync.refresh();
          }}
          theme={theme}
        />
      )}
      {structure && (
        <StructureDialog
          session={session}
          blockId={blockId}
          request={structure}
          close={() => setStructure(null)}
          saved={() => {
            toast.success("Solicitação enviada para análise.");
            sync.refresh();
          }}
        />
      )}
      <nav aria-label="Ações da área de campo" className="fixed inset-x-0 bottom-0 z-20 border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_#00000008]">
        <div className="mx-auto flex max-w-3xl items-stretch px-1">
          {[
            { label: "Mapa", Icon: MapPin, action: () => data.territory.imageUrl ? setMapOpen(true) : toast("Mapa indisponível para este território.") },
            ...(blockId ? [{ label: "Como chegar", Icon: CarIcon, action: () => setStreetAction("directions") }] : []),
            ...(blockId && data.capabilities.canReportHouses ? [{ label: "Solicitar alteração", Icon: PostAddIcon, action: () => setStreetAction("report") }] : []),
            ...(blockId && leader ? [{ label: "Compartilhar", Icon: Share2, action: () => void share(blockId) }] : []),
            { label: "Ajuda", Icon: HelpCircle, action: () => setHelpOpen(true) },
          ].map(({ label, Icon, action }) => (
            <button key={label} type="button" onClick={action} disabled={label === "Compartilhar" && actionBusy}
              className="flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800 disabled:opacity-50">
              <Icon className="h-[21px] w-[21px] shrink-0" aria-hidden="true" /><span className="leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </nav>
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-auto rounded-2xl">
          <DialogTitle>Mapa · {data.territory.name}</DialogTitle>
          <DialogDescription>
            Consulte os limites e as ruas do território.
          </DialogDescription>
          {data.territory.imageUrl && (
            <Image
              unoptimized
              width={1200}
              height={900}
              src={data.territory.imageUrl}
              alt={`Mapa de ${data.territory.name}`}
              className="h-auto w-full rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>
      <FieldHelp open={helpOpen} onOpenChange={setHelpOpen} block={!!blockId} theme={theme} />
      {streetAction && blockId && (
        <StreetPicker
          action={streetAction}
          streets={data.streets}
          theme={theme}
          mapUrl={(street) => mapUrl(street.name, street.firstNumber)}
          close={() => setStreetAction(null)}
          select={(id) => {
            if (!data.streets.some((street) => street.id === id)) return false;
            if (streetAction === "report") setReportStreetId(id);
            setStreetAction(null);
            return true;
          }}
        />
      )}
      <Dialog open={!!revokeBlock} onOpenChange={(open) => { if (!open && !actionBusy) setRevokeBlock(null); }}>
        <DialogContent className="w-[calc(100%_-_2rem)] max-w-sm rounded-2xl">
          <DialogTitle>Revogar acesso da quadra?</DialogTitle>
          <DialogDescription>
            O link de {revokeBlock?.name} deixará de funcionar. Você poderá gerar um novo.
          </DialogDescription>
          {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
          <Button
            variant="destructive"
            className="h-12"
            disabled={actionBusy}
            onClick={() => void revoke()}
          >
            {actionBusy ? "Revogando…" : "Revogar acesso"}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!sharing}
        onOpenChange={(open) => {
          if (!open) setSharing(null);
        }}
      >
        <DialogContent className="w-[calc(100%_-_2rem)] max-w-sm rounded-2xl">
          <DialogTitle>Link da quadra pronto</DialogTitle>
          <DialogDescription>
            Compartilhe ou copie a mensagem para os publicadores designados.
          </DialogDescription>
          <p className="whitespace-pre-wrap text-sm">{sharing?.text}</p>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
            <Link2 size={18} className="shrink-0" />
            <p className="break-all text-sm" data-testid="share-link">
              {sharing?.url}
            </p>
          </div>
          <Button
            className="h-12"
            onClick={() => {
              if (sharing)
                void navigatorShare(sharing).catch(() =>
                  setActionError("Copie o link acima para compartilhar."),
                );
            }}
          >
            <Share2 />
            Compartilhar
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => void copyLink()}
          >
            <Copy />
            Copiar mensagem e link
          </Button>
          {actionError && (
            <p role="alert" className="text-sm text-red-700">
              {actionError}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-emerald-800">
              {notice}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

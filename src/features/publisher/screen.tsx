"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Download,
  FolderHeart,
  HelpCircle,
  MessageSquarePlus,
  Navigation,
  Pencil,
  Search,
  Settings2,
  Share2,
  Trash2,
  Upload,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwa } from "@/features/pwa/provider";
import {
  createPublisherFile,
  downloadFile,
  MAX_FILE_BYTES,
  parsePublisherFile,
  publisherBlob,
  readInbox,
  removeInbox,
  shareInterested,
  type InboxFile,
} from "./files";
import { deleteRecord, readPublisher } from "./store";
import {
  Conversation,
  Interested,
  PublisherFile,
  addressLabel,
  quantity,
} from "./types";
import { useLocalAction, usePublisher } from "./use-publisher";
import {
  actionClass,
  EditConversationDialog,
  EditInterestedDialog,
  FormError,
  inputClass,
  ProfileForm,
  RecordConversationDialog,
} from "./forms";
import { PublisherHierarchy } from "./hierarchy";
import { ImportDialog } from "./import-dialog";

const theme = {
  "--field-primary": "#44783C",
  "--field-secondary": "#E8F1E4",
} as CSSProperties;
const detailActionClass =
  "h-12 w-full min-w-0 justify-start gap-2 whitespace-normal rounded-xl px-3 text-left text-[13px] leading-tight shadow-none";
type LaunchWindow = Window & {
  launchQueue?: {
    setConsumer(
      consumer: (params: { files: { getFile(): Promise<File> }[] }) => void,
    ): void;
  };
};

export function PublisherScreen() {
  const { data, error, refresh } = usePublisher();
  const action = useLocalAction();
  const pwa = usePwa();
  const [area, setArea] = useState("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [record, setRecord] = useState<{
    address: string;
    interestedId?: string;
  } | null>(null);
  const [editPerson, setEditPerson] = useState<Interested | null>(null);
  const [editNote, setEditNote] = useState<Conversation | null>(null);
  const [deletion, setDeletion] = useState<{
    kind: "interested" | "conversations";
    record: Interested | Conversation;
  } | null>(null);
  const [incoming, setIncoming] = useState<{
    file: PublisherFile;
    inboxKey?: string;
    launchFile?: File;
  } | null>(null);
  const [inbox, setInbox] = useState<InboxFile[]>([]);
  const [launched, setLaunched] = useState<File[]>([]);
  const [help, setHelp] = useState(false);
  const [updateConfirm, setUpdateConfirm] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const navigate = () => {
      const hash = window.location.hash.slice(1);
      setArea(hash === "dados" ? "data" : "home");
      setSelectedId(
        /^interessado=[0-9a-f-]{36}$/i.test(hash) ? hash.slice(12) : null,
      );
    };
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    let disposed = false;
    const updateInbox = () => {
      void readInbox()
        .then((files) => {
          if (!disposed) setInbox(files);
        })
        .catch(() => {
          if (!disposed)
            action.setError(
              "Não foi possível abrir os arquivos recebidos. Importe o arquivo manualmente.",
            );
        });
    };
    updateInbox();
    window.addEventListener("focus", updateInbox);
    navigator.serviceWorker?.addEventListener("message", updateInbox);
    const queue = (window as LaunchWindow).launchQueue;
    queue?.setConsumer((params) => {
      void Promise.all(params.files.map((handle) => handle.getFile()))
        .then((files) => {
          if (!disposed) setLaunched((old) => [...old, ...files]);
        })
        .catch(() => {
          if (!disposed)
            action.setError(
              "Não foi possível abrir o arquivo recebido. Use Importar arquivo.",
            );
        });
    });
    return () => {
      disposed = true;
      window.removeEventListener("focus", updateInbox);
      navigator.serviceWorker?.removeEventListener("message", updateInbox);
    };
    // The listeners only use stable state setters and intentionally register once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = (hash = "") => {
    window.location.hash = hash;
  };
  const loadFile = (file: File, inboxKey?: string) =>
    void action.run(async () => {
      if (file.size > MAX_FILE_BYTES)
        throw new Error("O arquivo deve ter no máximo 10 MB.");
      const parsed = parsePublisherFile(await file.text());
      setIncoming({
        file: parsed,
        inboxKey,
        launchFile: launched.includes(file) ? file : undefined,
      });
    });
  const exported = () =>
    void action.run(async () => {
      downloadFile(publisherBlob(createPublisherFile(await readPublisher())));
      setNotice(
        "Backup baixado. Guarde o arquivo em um local de sua preferência.",
      );
    });
  const person = data?.interested.find(
    (person) => person.id === selectedId && !person.deletedAt,
  );
  const address = data?.addresses.find(
    (address) => address.id === person?.addressId,
  );
  const notes =
    data?.conversations
      .filter((note) => note.interestedId === person?.id && !note.deletedAt)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)) ?? [];
  const shared = () => {
    if (!data || !person) return;
    void action.run(async () => {
      const file = publisherBlob(createPublisherFile(data, person.id));
      const outcome = await shareInterested(file);
      if (outcome === "downloaded")
        setNotice(
          "Arquivo baixado. Anexe-o no WhatsApp para compartilhar este interessado.",
        );
      else if (outcome === "shared")
        setNotice("Arquivo compartilhado. Sua cópia continua neste aparelho.");
    });
  };

  return (
    <main
      style={theme}
      className="min-h-dvh bg-slate-50 pb-[calc(5rem_+_env(safe-area-inset-bottom))] text-slate-900"
    >
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-3 py-2 sm:px-5">
          {selectedId || area === "data" ? (
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              aria-label="Voltar aos endereços"
              onClick={() => navigate()}
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#44783C]">
              <Image
                unoptimized
                src="/logo.png"
                width={44}
                height={44}
                alt="Território Digital"
              />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-500">Salvo neste aparelho</p>
            <h1 className="truncate text-base font-semibold">
              Área do publicador
            </h1>
          </div>
          <div
            className="max-w-28 text-right text-[10px] leading-snug text-slate-500"
            role="status"
          >
            {!online && (
              <WifiOff
                size={16}
                className="ml-auto mb-1"
                aria-label="Sem conexão"
              />
            )}
            {pwa.ready
              ? "Pronto para uso offline"
              : "Uso offline não preparado"}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl space-y-3 px-3 pt-3 sm:space-y-4 sm:px-5 sm:pt-4">
        <FormError error={error || action.error} />
        {error && (
          <Button
            variant="outline"
            className="min-h-12"
            onClick={() => void refresh()}
          >
            Tentar novamente
          </Button>
        )}
        {notice && (
          <p
            role="status"
            className="break-words rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"
          >
            {notice}
          </p>
        )}
        {!data ? (
          !error && <p role="status">Abrindo dados locais…</p>
        ) : !data.profile ? (
          <section className="space-y-4 rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">
              Seu cadastro de publicador
            </h2>
            <ProfileForm />
            {(inbox.length > 0 || launched.length > 0) && (
              <p className="text-sm text-slate-600">
                Há arquivo recebido. Cadastre seu nome para revisar a
                importação.
              </p>
            )}
          </section>
        ) : (
          <>
            {(inbox.length > 0 || launched.length > 0) && (
              <section
                className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3"
                aria-label="Arquivos recebidos"
              >
                <h2 className="text-sm font-semibold">Arquivos recebidos</h2>
                {inbox.map((item, index) => (
                  <div
                    key={item.key}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <Button
                      variant="outline"
                      className="min-h-11 flex-1"
                      onClick={() => loadFile(item.file, item.key)}
                    >
                      Revisar arquivo {index + 1}
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-11"
                      onClick={() =>
                        void action.run(async () => {
                          await removeInbox(item.key);
                          setInbox((old) =>
                            old.filter((file) => file.key !== item.key),
                          );
                        })
                      }
                    >
                      Descartar
                    </Button>
                  </div>
                ))}
                {launched.map((file, index) => (
                  <div key={index} className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="min-h-11 flex-1"
                      onClick={() => loadFile(file)}
                    >
                      Revisar arquivo aberto {index + 1}
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-11"
                      onClick={() =>
                        setLaunched((old) =>
                          old.filter((_, at) => at !== index),
                        )
                      }
                    >
                      Descartar
                    </Button>
                  </div>
                ))}
              </section>
            )}
            {area === "data" ? (
              <section className="space-y-5" aria-label="Meus dados">
                <div className="space-y-4 rounded-2xl border bg-white p-4">
                  <h2 className="text-lg font-semibold">Meus dados</h2>
                  <ProfileForm
                    initial={data.profile.name}
                    saved={() => setNotice("Nome atualizado.")}
                  />
                </div>
                <div className="space-y-3 rounded-2xl border bg-white p-4">
                  <h2 className="font-semibold">Backup e arquivos</h2>
                  <p className="text-sm text-slate-600">
                    Limpar os dados deste navegador remove seus registros.
                    Exporte um backup para guardá-los ou levá-los a outro
                    aparelho. Navegadores, domínios e portas diferentes têm
                    dados separados.
                  </p>
                  <Button
                    variant="outline"
                    disabled={action.busy}
                    className="min-h-12 w-full rounded-xl"
                    onClick={exported}
                  >
                    <Download size={18} className="mr-2" />
                    Exportar todos os dados
                  </Button>
                  <Button
                    variant="outline"
                    disabled={action.busy}
                    className="min-h-12 w-full rounded-xl"
                    onClick={() => fileInput.current?.click()}
                  >
                    <Upload size={18} className="mr-2" />
                    Importar arquivo
                  </Button>
                  <p className="text-xs text-slate-500">
                    O arquivo contém os cadastros e as conversas. Quem o receber
                    poderá ler e importar esses dados.
                  </p>
                </div>
                <div className="space-y-3 rounded-2xl border bg-white p-4">
                  <h2 className="font-semibold">Instalar e usar offline</h2>
                  <p className="text-sm text-slate-600">
                    {pwa.ready
                      ? "A área do publicador está pronta para abrir sem internet."
                      : "Abra esta página com internet para preparar os recursos de uso offline."}
                  </p>
                  <FormError error={pwa.error} />
                  {pwa.canInstall ? (
                    <Button
                      className={`${actionClass} w-full`}
                      onClick={() => void action.run(pwa.install)}
                    >
                      Instalar Território Digital
                    </Button>
                  ) : (
                    <p className="text-sm text-slate-600">
                      No iPhone, abra no Safari e use Compartilhar → Adicionar à
                      Tela de Início. No Android ou PC, use Instalar aplicativo
                      no menu do navegador, quando disponível.
                    </p>
                  )}
                  {!pwa.ready && (
                    <Button
                      variant="outline"
                      className="min-h-12 w-full"
                      onClick={pwa.prepare}
                    >
                      Preparar uso offline
                    </Button>
                  )}
                  {pwa.updateAvailable && (
                    <Button
                      variant="outline"
                      className="min-h-12 w-full"
                      onClick={() => setUpdateConfirm(true)}
                    >
                      Atualização disponível
                    </Button>
                  )}
                </div>
                <a
                  href="/login"
                  className="flex min-h-12 items-center justify-center text-sm text-emerald-800 underline"
                >
                  Voltar ao login administrativo
                </a>
              </section>
            ) : selectedId ? (
              person && address ? (
                <>
                  <div className="grid items-start gap-3 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] md:gap-5">
                    <section
                      aria-label="Cadastro do interessado"
                      className="min-w-0 overflow-hidden rounded-2xl border bg-white md:sticky md:top-20"
                    >
                      <div className="space-y-2 border-b bg-[#E8F1E4]/60 p-4">
                        <p className="break-words text-xs leading-relaxed text-slate-600">
                          {address.territory} · {address.block}
                        </p>
                        <h2 className="break-words text-xl font-semibold leading-tight">
                          {person.name}
                        </h2>
                        <p className="break-words text-sm leading-relaxed text-slate-700">
                          {addressLabel(address)}
                        </p>
                        {person.contact && (
                          <p className="whitespace-pre-wrap break-words text-sm text-slate-600">
                            Contato: {person.contact}
                          </p>
                        )}
                        <p className="pt-1 text-xs font-medium text-emerald-900">
                          {person.nextReturn
                            ? `Próximo retorno: ${person.nextReturn.split("-").reverse().join("/")}`
                            : "Sem retorno agendado"}
                        </p>
                      </div>
                      <div
                        aria-label="Ações do interessado"
                        className="grid grid-cols-2 gap-2 p-3"
                      >
                        <Button
                          className={`${detailActionClass} bg-[#44783C] text-white hover:bg-[#386532]`}
                          onClick={() =>
                            setRecord({
                              address: address.id,
                              interestedId: person.id,
                            })
                          }
                        >
                          <MessageSquarePlus size={18} aria-hidden />
                          <span>Continuar conversa</span>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className={`${detailActionClass} text-emerald-900`}
                        >
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                              [
                                `${address.street}, ${address.number}`,
                                address.city,
                                address.state,
                              ]
                                .filter(Boolean)
                                .join(", "),
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            referrerPolicy="no-referrer"
                            title="Abrir trajeto até a casa no Google Maps"
                          >
                            <Navigation size={18} aria-hidden />
                            <span>Como chegar</span>
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          className={detailActionClass}
                          onClick={() => setEditPerson(person)}
                        >
                          <Pencil size={18} aria-hidden />
                          <span>Editar cadastro</span>
                        </Button>
                        <Button
                          variant="outline"
                          disabled={action.busy}
                          className={detailActionClass}
                          onClick={shared}
                        >
                          <Share2 size={18} aria-hidden />
                          <span>Compartilhar arquivo</span>
                        </Button>
                      </div>
                    </section>
                    <section
                      className="min-w-0 space-y-3"
                      aria-label="Histórico de conversas"
                    >
                      <h3 className="px-1 text-sm font-semibold text-slate-700">
                        Histórico · {quantity(notes.length, "conversa")}
                      </h3>
                      {notes.map((note) => (
                        <article
                          key={note.id}
                          className="overflow-hidden rounded-2xl border bg-white"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pl-4 pr-1">
                            <time
                              dateTime={note.occurredAt}
                              className="min-w-0 py-2 text-xs font-medium text-slate-600"
                            >
                              {new Date(note.occurredAt).toLocaleString(
                                "pt-BR",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )}
                            </time>
                            <div className="flex shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11 rounded-xl text-slate-600"
                                aria-label="Editar conversa"
                                title="Editar conversa"
                                onClick={() => setEditNote(note)}
                              >
                                <Pencil size={16} aria-hidden />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11 rounded-xl text-red-700"
                                aria-label="Excluir conversa"
                                title="Excluir conversa"
                                onClick={() =>
                                  setDeletion({
                                    kind: "conversations",
                                    record: note,
                                  })
                                }
                              >
                                <Trash2 size={16} aria-hidden />
                              </Button>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap break-words p-4 text-sm leading-relaxed">
                            {note.text}
                          </p>
                        </article>
                      ))}
                      {!notes.length && (
                        <p className="rounded-xl border bg-white p-4 text-sm text-slate-600">
                          Nenhuma conversa registrada.
                        </p>
                      )}
                    </section>
                  </div>
                  <Button
                    variant="ghost"
                    className="min-h-11 w-full rounded-xl text-xs text-red-700 md:w-auto"
                    onClick={() =>
                      setDeletion({ kind: "interested", record: person })
                    }
                  >
                    Excluir interessado
                  </Button>
                </>
              ) : (
                <p role="status" className="rounded-xl border bg-white p-4">
                  Este interessado não está disponível. Volte aos endereços
                  salvos.
                </p>
              )
            ) : (
              <>
                <section className="rounded-2xl bg-[#E8F1E4] p-3 sm:p-4">
                  <p className="break-words text-xs text-slate-600">
                    Olá, {data.profile.name}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    Meus interessados
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {quantity(
                      data.interested.filter((person) => !person.deletedAt)
                        .length,
                      "interessado",
                    )}{" "}
                    ·{" "}
                    {quantity(
                      data.addresses.length,
                      "casa salva",
                      "casas salvas",
                    )}{" "}
                    ·{" "}
                    {quantity(
                      data.conversations.filter((note) => !note.deletedAt)
                        .length,
                      "conversa",
                    )}
                  </p>
                </section>
                <label className="relative block">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3 top-4 text-slate-400"
                  />
                  <Input
                    aria-label="Buscar interessado ou endereço"
                    placeholder="Buscar nome ou endereço"
                    className={`${inputClass} pl-10`}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <PublisherHierarchy
                  data={data}
                  query={query}
                  openPerson={(id) => navigate(`interessado=${id}`)}
                  record={(address) => setRecord({ address })}
                />
              </>
            )}
          </>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept=".json,.tdpub,application/json"
        aria-label="Arquivo para importar"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) loadFile(file);
        }}
      />
      <nav
        aria-label="Ações do publicador"
        className="fixed inset-x-0 bottom-0 z-20 border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_#00000008]"
      >
        <div className="mx-auto flex max-w-4xl items-stretch px-1">
          {[
            { label: "Endereços", Icon: FolderHeart, click: () => navigate() },
            {
              label: "Importar",
              Icon: Upload,
              click: () =>
                data?.profile
                  ? fileInput.current?.click()
                  : setNotice("Cadastre seu nome para importar um arquivo."),
            },
            {
              label: "Meus dados",
              Icon: Settings2,
              click: () => navigate("dados"),
            },
            { label: "Ajuda", Icon: HelpCircle, click: () => setHelp(true) },
          ].map(({ label, Icon, click }) => (
            <button
              type="button"
              key={label}
              className="flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800"
              onClick={click}
            >
              <Icon size={21} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
      {record && (
        <RecordConversationDialog
          {...record}
          close={() => setRecord(null)}
          saved={() => {
            setRecord(null);
            setNotice("Conversa salva neste aparelho.");
          }}
          theme={theme}
        />
      )}
      {editPerson && (
        <EditInterestedDialog
          person={editPerson}
          close={() => setEditPerson(null)}
        />
      )}
      {editNote && (
        <EditConversationDialog
          conversation={editNote}
          close={() => setEditNote(null)}
        />
      )}
      {incoming && data?.profile && (
        <ImportDialog
          data={data}
          file={incoming.file}
          close={() => setIncoming(null)}
          imported={() => {
            if (incoming.inboxKey)
              void removeInbox(incoming.inboxKey)
                .then(() =>
                  setInbox((old) =>
                    old.filter((file) => file.key !== incoming.inboxKey),
                  ),
                )
                .catch(() =>
                  action.setError(
                    "Dados importados. Não foi possível descartar o arquivo recebido; você pode descartá-lo manualmente.",
                  ),
                );
            if (incoming.launchFile)
              setLaunched((old) =>
                old.filter((file) => file !== incoming.launchFile),
              );
            setIncoming(null);
            setNotice(
              "Importação concluída. Os dados estão salvos neste aparelho.",
            );
          }}
        />
      )}
      <Dialog
        open={!!deletion}
        onOpenChange={(open) => {
          if (!open && !action.busy) setDeletion(null);
        }}
      >
        <DialogContent className="w-[calc(100%_-_2rem)] rounded-2xl">
          <DialogTitle>
            {deletion?.kind === "interested"
              ? "Excluir interessado?"
              : "Excluir conversa?"}
          </DialogTitle>
          <DialogDescription>
            {deletion?.kind === "interested"
              ? "O cadastro e todas as conversas deste interessado serão excluídos deste aparelho. Os identificadores de exclusão serão mantidos nos backups."
              : "A conversa será excluída deste aparelho. A exclusão poderá ser revisada em futuras importações."}
          </DialogDescription>
          <FormError error={action.error} />
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="min-h-12"
              disabled={action.busy}
              onClick={() => setDeletion(null)}
            >
              Cancelar
            </Button>
            <Button
              className="min-h-12 bg-red-700 text-white hover:bg-red-800"
              disabled={action.busy}
              onClick={() =>
                deletion &&
                void action.run(
                  () =>
                    deleteRecord(
                      deletion.kind,
                      deletion.record.id,
                      deletion.record.updatedAt,
                    ),
                  () => {
                    if (deletion.kind === "interested") navigate();
                    setDeletion(null);
                    setNotice("Registro excluído deste aparelho.");
                  },
                )
              }
            >
              Confirmar exclusão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl">
          <DialogTitle>Seus interessados no aparelho</DialogTitle>
          <DialogDescription>
            Consulte os endereços e continue suas conversas, mesmo sem o link de
            campo.
          </DialogDescription>
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Para começar em uma casa nova, abra a designação recebida e use
              Registros → Registrar conversa no rodapé da tela de ruas e casas.
              Só a casa escolhida será guardada.
            </p>
            <p>
              Nos endereços salvos, abra uma rua e escolha um interessado ou
              cadastre outra pessoa na mesma casa.
            </p>
            <p>
              Em Meus dados, exporte um backup e importe arquivos recebidos. Ao
              compartilhar um interessado, todas as conversas acompanham o
              arquivo.
            </p>
            <p>
              A abertura direta do arquivo depende do celular e do navegador. No
              Android compatível, compartilhe o arquivo com o Território Digital
              instalado. No iPhone, salve o arquivo e use Importar.
            </p>
            <p>
              Os dados ficam neste navegador. Não há sincronização entre
              aparelhos. Guarde backups antes de limpar o navegador ou trocar de
              aparelho.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={updateConfirm} onOpenChange={setUpdateConfirm}>
        <DialogContent className="w-[calc(100%_-_2rem)] rounded-2xl">
          <DialogTitle>Atualizar aplicativo?</DialogTitle>
          <DialogDescription>
            A página será recarregada. Salve qualquer conversa aberta em outras
            abas antes de continuar. Seus registros locais serão preservados.
          </DialogDescription>
          <Button className={actionClass} onClick={pwa.update}>
            Atualizar agora
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

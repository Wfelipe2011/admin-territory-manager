import {
  updatePublisher,
  validateConversation,
  validateInterested,
} from "./store";
import {
  Conversation,
  Interested,
  LocalEntity,
  PublisherData,
  PublisherFile,
  SavedAddress,
  addressKey,
  addressLabel,
} from "./types";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
type Collection = "addresses" | "interested" | "conversations";
type Row = SavedAddress | Interested | Conversation;
export type ImportConflict = {
  key: string;
  collection: Collection;
  local?: Row;
  incoming: Row;
  label: string;
  deletion: boolean;
};
export type ImportPreview = {
  revision: number;
  file: PublisherFile;
  conflicts: ImportConflict[];
  added: number;
  unchanged: number;
};

const invalid = () => {
  throw new Error(
    "Arquivo inválido: confira o formato, os campos e os vínculos dos registros.",
  );
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid();
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, names: string[]) {
  if (
    Object.keys(value).length !== names.length ||
    names.some((key) => !Object.hasOwn(value, key))
  )
    invalid();
}
const string = (
  value: unknown,
  max: number,
  required = false,
): value is string =>
  typeof value === "string" &&
  value.length <= max &&
  (!required || value.trim().length > 0);
const uuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
const date = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const positive = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const entityKeys = ["id", "createdAt", "updatedAt"];
function entity(value: Record<string, unknown>) {
  if (!uuid(value.id) || !date(value.createdAt) || !date(value.updatedAt))
    invalid();
}
function deleted(value: Record<string, unknown>) {
  if (value.deletedAt !== null && !date(value.deletedAt)) invalid();
}

export function parsePublisherFile(text: string): PublisherFile {
  if (new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES)
    throw new Error("O arquivo deve ter no máximo 10 MB.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Não foi possível ler este arquivo JSON.");
  }
  const root = object(value);
  if (root.format !== "territorio-digital-publicador")
    throw new Error(
      "Este arquivo não é um backup ou interessado do Território Digital.",
    );
  if (root.version !== 1)
    throw new Error(
      "Versão de arquivo não suportada. Atualize o aplicativo antes de importar.",
    );
  keys(root, [
    "format",
    "version",
    "kind",
    "exportedAt",
    "profile",
    "addresses",
    "interested",
    "conversations",
  ]);
  if (
    !["backup", "interested"].includes(root.kind as string) ||
    !date(root.exportedAt)
  )
    invalid();
  if (root.profile !== null) {
    const profile = object(root.profile);
    keys(profile, [...entityKeys, "name"]);
    entity(profile);
    if (!string(profile.name, 200, true)) invalid();
  }
  for (const collection of [
    "addresses",
    "interested",
    "conversations",
  ] as const) {
    const rows = root[collection];
    if (!Array.isArray(rows) || rows.length > 50000) invalid();
    const ids = new Set<string>();
    for (const raw of rows as unknown[]) {
      const row = object(raw);
      entity(row);
      if (ids.has(row.id as string)) invalid();
      ids.add(row.id as string);
      if (collection === "addresses") {
        keys(row, [
          ...entityKeys,
          "source",
          "tenantId",
          "territoryId",
          "blockId",
          "streetId",
          "mappingId",
          "houseId",
          "congregation",
          "city",
          "state",
          "territory",
          "block",
          "street",
          "number",
          "complement",
        ]);
        for (const key of [
          "tenantId",
          "territoryId",
          "blockId",
          "streetId",
          "houseId",
        ])
          if (!positive(row[key])) invalid();
        if (row.mappingId !== null && !positive(row.mappingId)) invalid();
        for (const key of [
          "congregation",
          "city",
          "state",
          "territory",
          "block",
          "street",
          "number",
          "complement",
        ])
          if (
            !string(
              row[key],
              1000,
              !["complement", "city", "state"].includes(key),
            )
          )
            invalid();
        if (!string(row.source, 1000, true)) invalid();
        try {
          const source = new URL(row.source as string);
          if (
            !["http:", "https:"].includes(source.protocol) ||
            source.username ||
            source.password ||
            source.search ||
            source.hash
          )
            invalid();
        } catch {
          invalid();
        }
      } else if (collection === "interested") {
        keys(row, [
          ...entityKeys,
          "addressId",
          "name",
          "contact",
          "nextReturn",
          "deletedAt",
        ]);
        deleted(row);
        if (
          !uuid(row.addressId) ||
          !string(row.name, 200, true) ||
          !string(row.contact, 500) ||
          (row.nextReturn !== null && !string(row.nextReturn, 10))
        )
          invalid();
        validateInterested(row as unknown as Interested);
      } else {
        keys(row, [
          ...entityKeys,
          "interestedId",
          "text",
          "occurredAt",
          "deletedAt",
        ]);
        deleted(row);
        if (
          !uuid(row.interestedId) ||
          !string(row.text, 20000, true) ||
          !date(row.occurredAt)
        )
          invalid();
        validateConversation(row as unknown as Conversation);
      }
    }
  }
  const file = root as unknown as PublisherFile;
  const addresses = new Set(file.addresses.map((row) => row.id));
  const interested = new Map(file.interested.map((row) => [row.id, row]));
  if (
    file.interested.some((row) => !addresses.has(row.addressId)) ||
    file.conversations.some(
      (row) =>
        !interested.has(row.interestedId) ||
        (!row.deletedAt && interested.get(row.interestedId)?.deletedAt),
    )
  )
    invalid();
  if (new Set(file.addresses.map(addressKey)).size !== file.addresses.length)
    invalid();
  if (
    file.kind === "interested" &&
    (file.profile !== null ||
      file.interested.length !== 1 ||
      file.addresses.length !== 1)
  )
    invalid();
  return file;
}

function canonical(value: Row): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
}
function remapAddresses(
  data: PublisherData,
  original: PublisherFile,
): PublisherFile {
  const file = structuredClone(original);
  const existing = new Map(data.addresses.map((row) => [addressKey(row), row]));
  const aliases = new Map<string, string>();
  file.addresses = file.addresses.map((row) => {
    const match = existing.get(addressKey(row));
    // Same physical address imported from another person's independent local copy.
    if (!match || data.addresses.some((local) => local.id === row.id))
      return row;
    aliases.set(row.id, match.id);
    return match;
  });
  file.interested.forEach((row) => {
    row.addressId = aliases.get(row.addressId) ?? row.addressId;
  });
  return file;
}

export function previewImport(
  data: PublisherData,
  original: PublisherFile,
): ImportPreview {
  const file = remapAddresses(data, original);
  const preview: ImportPreview = {
    revision: data.revision,
    file,
    conflicts: [],
    added: 0,
    unchanged: 0,
  };
  for (const collection of [
    "addresses",
    "interested",
    "conversations",
  ] as const) {
    const local = new Map<string, Row>(
      data[collection].map((row) => [row.id, row]),
    );
    for (const incoming of file[collection]) {
      const previous = local.get(incoming.id);
      if (previous && canonical(previous) === canonical(incoming)) {
        preview.unchanged++;
        continue;
      }
      const deletion = "deletedAt" in incoming && incoming.deletedAt !== null;
      if (previous || deletion) {
        const label =
          "street" in incoming
            ? addressLabel(incoming)
            : "name" in incoming
              ? incoming.name
              : `Conversa de ${new Date(incoming.occurredAt).toLocaleString("pt-BR")}`;
        preview.conflicts.push({
          key: `${collection}:${incoming.id}`,
          collection,
          local: previous,
          incoming,
          label,
          deletion,
        });
      } else preview.added++;
    }
  }
  return preview;
}

export async function applyImport(
  preview: ImportPreview,
  choices: Record<string, "local" | "incoming">,
) {
  return updatePublisher((data) => {
    if (!data.profile) throw new Error("Cadastre seu nome antes de importar.");
    if (data.revision !== preview.revision)
      throw new Error(
        "Os dados locais mudaram durante a revisão. Feche a prévia e importe o arquivo novamente.",
      );
    if (preview.conflicts.some((conflict) => !choices[conflict.key]))
      throw new Error(
        "Revise todos os conflitos e exclusões antes de importar.",
      );
    const conflicts = new Set(
      preview.conflicts.map((conflict) => conflict.key),
    );
    for (const collection of [
      "addresses",
      "interested",
      "conversations",
    ] as const) {
      const rows: Row[] = data[collection];
      for (const incoming of preview.file[collection]) {
        const key = `${collection}:${incoming.id}`;
        if (conflicts.has(key) && choices[key] === "local") continue;
        const index = rows.findIndex((row) => row.id === incoming.id);
        if (index < 0) rows.push(structuredClone(incoming));
        else rows[index] = structuredClone(incoming);
      }
    }
    // A reviewed parent deletion includes its conversations, even when only one
    // side had those conversations. Keeping the parent keeps its local history.
    const parents = new Map(data.interested.map((row) => [row.id, row]));
    for (const note of data.conversations) {
      const parent = parents.get(note.interestedId);
      if (!parent)
        throw new Error("O arquivo contém uma conversa sem interessado.");
      if (parent.deletedAt && !note.deletedAt) {
        note.deletedAt = parent.deletedAt;
        note.updatedAt = new Date().toISOString();
      }
    }
    if (
      data.interested.some(
        (row) =>
          !data.addresses.some((address) => address.id === row.addressId),
      )
    )
      throw new Error("O arquivo contém um interessado sem endereço.");
    if (new Set(data.addresses.map(addressKey)).size !== data.addresses.length)
      throw new Error(
        "As escolhas criaram endereços duplicados. Revise as versões dos endereços antes de importar.",
      );
  });
}

export function createPublisherFile(
  data: PublisherData,
  interestedId?: string,
): PublisherFile {
  const interested = interestedId
    ? data.interested.filter((row) => row.id === interestedId && !row.deletedAt)
    : data.interested;
  if (interestedId && !interested.length)
    throw new Error("Interessado indisponível para compartilhar.");
  const ids = new Set(interested.map((row) => row.id));
  return {
    format: "territorio-digital-publicador",
    version: 1,
    kind: interestedId ? "interested" : "backup",
    exportedAt: new Date().toISOString(),
    profile: interestedId ? null : data.profile,
    addresses: interestedId
      ? data.addresses.filter((row) => row.id === interested[0].addressId)
      : data.addresses,
    interested,
    conversations: interestedId
      ? data.conversations.filter((row) => ids.has(row.interestedId))
      : data.conversations,
  };
}
export function publisherBlob(file: PublisherFile) {
  const content = JSON.stringify(file, null, 2);
  if (new TextEncoder().encode(content).byteLength > MAX_FILE_BYTES)
    throw new Error(
      "Os dados ultrapassam 10 MB. Exporte os interessados individualmente.",
    );
  return new File(
    [content],
    `${file.kind === "backup" ? "backup-publicador" : "interessado"}-${new Date().toISOString().slice(0, 10)}.tdpub.json`,
    { type: "application/json" },
  );
}
export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function shareInterested(
  file: File,
): Promise<"shared" | "cancelled" | "downloaded"> {
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Interessado · Território Digital",
      });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError")
        return "cancelled";
    }
  }
  downloadFile(file);
  return "downloaded";
}

export const INBOX_CACHE = "td-publisher-inbox-v1";
export type InboxFile = { key: string; file: File };
export async function readInbox(): Promise<InboxFile[]> {
  if (!("caches" in window)) return [];
  const cache = await caches.open(INBOX_CACHE);
  const entries = await cache.keys();
  return Promise.all(
    entries.map(async (request) => {
      const response = (await cache.match(request))!;
      return {
        key: request.url,
        file: new File([await response.blob()], "recebido.tdpub.json", {
          type: "application/json",
        }),
      };
    }),
  );
}
export async function removeInbox(key: string) {
  if ("caches" in window) await (await caches.open(INBOX_CACHE)).delete(key);
}

export function recordSummary(row?: Row): string {
  if (!row) return "Não existe neste aparelho.";
  const lines =
    "street" in row
      ? [row.congregation, row.territory, row.block, addressLabel(row)]
      : "name" in row
        ? [
            row.name,
            row.contact || "Sem contato",
            row.nextReturn
              ? `Retorno: ${row.nextReturn.split("-").reverse().join("/")}`
              : "Sem retorno agendado",
          ]
        : [new Date(row.occurredAt).toLocaleString("pt-BR"), row.text];
  return [
    ...lines,
    "deletedAt" in row && row.deletedAt ? "EXCLUÍDO" : "",
    `Alterado: ${new Date((row as LocalEntity).updatedAt).toLocaleString("pt-BR")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

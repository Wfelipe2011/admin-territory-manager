import {
  AddressDraft,
  Conversation,
  Interested,
  PublisherData,
  addressKey,
  emptyData,
} from "./types";

const DATABASE = "territorio-digital-publicador";
const STORE = "documents";
let database: Promise<IDBDatabase> | undefined;

function openDatabase() {
  if (!database)
    database = new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB)
        return reject(
          new Error(
            "Permita o armazenamento deste site para usar a área do publicador.",
          ),
        );
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("Feche as outras abas deste site e tente novamente."));
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          database = undefined;
        };
        resolve(request.result);
      };
    }).catch((error) => {
      database = undefined;
      throw error;
    });
  return database;
}

export async function readPublisher(): Promise<PublisherData> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).get("main");
    transaction.oncomplete = () => resolve(request.result ?? emptyData());
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Read/modify/write stays inside one IndexedDB transaction, including across tabs.
export async function updatePublisher(
  change: (data: PublisherData) => void,
): Promise<PublisherData> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    const request = store.get("main");
    let result: PublisherData;
    let failure: unknown;
    request.onsuccess = () => {
      try {
        result = request.result ?? emptyData();
        change(result);
        // Retain merge identities and relationships, not deleted personal text.
        for (const person of result.interested)
          if (person.deletedAt) {
            person.name = "Interessado excluído";
            person.contact = "";
            person.nextReturn = null;
          }
        for (const note of result.conversations)
          if (note.deletedAt) note.text = "Conversa excluída";
        result.revision++;
        store.put(result, "main");
      } catch (error) {
        failure = error;
        transaction.abort();
      }
    };
    transaction.onabort = () =>
      reject(
        failure ??
          transaction.error ??
          new Error("Não foi possível salvar no aparelho."),
      );
    transaction.onerror = () => {
      /* onabort reports the transaction failure */
    };
    transaction.oncomplete = () => {
      window.dispatchEvent(new Event("publisher-changed"));
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("publisher-data");
        channel.postMessage("changed");
        channel.close();
      }
      resolve(result);
    };
  });
}

export async function saveProfile(name: string) {
  if (!name.trim() || name.trim().length > 200)
    throw new Error("Informe seu nome, com até 200 caracteres.");
  const now = new Date().toISOString();
  const data = await updatePublisher((data) => {
    data.profile = data.profile
      ? { ...data.profile, name: name.trim(), updatedAt: now }
      : {
          id: crypto.randomUUID(),
          name: name.trim(),
          createdAt: now,
          updatedAt: now,
        };
  });
  void navigator.storage?.persist?.().catch(() => false);
  return data;
}

export type ConversationInput = { text: string; occurredAt: string };
export type InterestedInput = {
  name: string;
  contact: string;
  nextReturn: string | null;
};

export async function recordConversation(input: {
  address: AddressDraft | string;
  interestedId?: string;
  interested?: InterestedInput;
  nextReturn?: string | null;
  expectedInterestedUpdatedAt?: string;
  conversation: ConversationInput;
}) {
  validateConversation(input.conversation);
  const now = new Date().toISOString();
  return updatePublisher((data) => {
    if (!data.profile)
      throw new Error("Cadastre seu nome antes de registrar uma conversa.");
    let address =
      typeof input.address === "string"
        ? data.addresses.find((item) => item.id === input.address)
        : data.addresses.find(
            (item) =>
              addressKey(item) === addressKey(input.address as AddressDraft),
          );
    if (!address) {
      if (typeof input.address === "string")
        throw new Error("Endereço não encontrado no aparelho.");
      address = {
        ...input.address,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      data.addresses.push(address);
    }
    let interested = data.interested.find(
      (item) => item.id === input.interestedId && !item.deletedAt,
    );
    if (
      input.interestedId &&
      (!interested || interested.addressId !== address.id)
    )
      throw new Error(
        "Este interessado não está mais disponível. Abra o cadastro novamente.",
      );
    if (interested && input.nextReturn !== undefined) {
      if (input.expectedInterestedUpdatedAt !== interested.updatedAt)
        throw new Error(
          "O cadastro mudou em outra aba. Abra novamente antes de registrar o retorno.",
        );
      validateInterested({ ...interested, nextReturn: input.nextReturn });
      interested.nextReturn = input.nextReturn;
      interested.updatedAt = now;
    }
    if (!interested) {
      if (!input.interested)
        throw new Error("Informe os dados do interessado.");
      validateInterested(input.interested);
      interested = {
        ...input.interested,
        name: input.interested.name.trim(),
        contact: input.interested.contact.trim(),
        id: crypto.randomUUID(),
        addressId: address.id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      data.interested.push(interested);
    }
    data.conversations.push({
      ...input.conversation,
      text: input.conversation.text.trim(),
      occurredAt: new Date(input.conversation.occurredAt).toISOString(),
      id: crypto.randomUUID(),
      interestedId: interested.id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  });
}

export function validateInterested(input: InterestedInput) {
  if (
    !input.name.trim() ||
    input.name.length > 200 ||
    input.contact.length > 500
  )
    throw new Error(
      "Informe um nome de até 200 caracteres e contato de até 500.",
    );
  if (
    input.nextReturn &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(input.nextReturn) ||
      !Number.isFinite(Date.parse(input.nextReturn)) ||
      new Date(input.nextReturn).toISOString().slice(0, 10) !==
        input.nextReturn)
  )
    throw new Error("Data de retorno inválida.");
}
export function validateConversation(input: ConversationInput) {
  if (!input.text.trim() || input.text.length > 20000)
    throw new Error("Informe a conversa, com até 20.000 caracteres.");
  if (!Number.isFinite(Date.parse(input.occurredAt)))
    throw new Error("Informe uma data e hora válidas para a conversa.");
}

export async function editInterested(
  id: string,
  input: InterestedInput,
  expected: string,
) {
  validateInterested(input);
  return updatePublisher((data) => {
    const item = data.interested.find(
      (item) => item.id === id && !item.deletedAt,
    );
    if (!item || item.updatedAt !== expected)
      throw new Error(
        "O cadastro mudou em outra aba. Abra novamente para editar.",
      );
    Object.assign(item, input, {
      name: input.name.trim(),
      contact: input.contact.trim(),
      updatedAt: new Date().toISOString(),
    });
  });
}
export async function editConversation(
  id: string,
  input: ConversationInput,
  expected: string,
) {
  validateConversation(input);
  return updatePublisher((data) => {
    const item = data.conversations.find(
      (item) => item.id === id && !item.deletedAt,
    );
    if (!item || item.updatedAt !== expected)
      throw new Error(
        "A conversa mudou em outra aba. Abra novamente para editar.",
      );
    Object.assign(item, {
      text: input.text.trim(),
      occurredAt: new Date(input.occurredAt).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
}
export async function deleteRecord(
  kind: "interested" | "conversations",
  id: string,
  expected: string,
) {
  return updatePublisher((data) => {
    const item: Interested | Conversation | undefined = data[kind].find(
      (item) => item.id === id && !item.deletedAt,
    );
    if (!item || item.updatedAt !== expected)
      throw new Error("O registro mudou. Confira novamente antes de excluir.");
    const now = new Date().toISOString();
    item.deletedAt = now;
    item.updatedAt = now;
    if (kind === "interested")
      data.conversations
        .filter((note) => note.interestedId === id && !note.deletedAt)
        .forEach((note) => {
          note.deletedAt = now;
          note.updatedAt = now;
        });
  });
}

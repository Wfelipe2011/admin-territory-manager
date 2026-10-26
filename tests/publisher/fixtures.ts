import { randomUUID } from "node:crypto";
import { expect, type Page, type BrowserContext } from "@playwright/test";
import type {
  PublisherData,
  PublisherFile,
} from "../../src/features/publisher/types";

export function sampleFile(): PublisherFile {
  const now = "2026-10-26T15:00:00.000Z";
  const base = () => ({ id: randomUUID(), createdAt: now, updatedAt: now });
  const address = {
    ...base(),
    source: "http://localhost:3001/v1",
    tenantId: 999,
    territoryId: 11,
    blockId: 22,
    streetId: 33,
    mappingId: 44,
    houseId: 55,
    congregation: "Congregação QA local",
    city: "Sorocaba",
    state: "SP",
    territory: "Território QA",
    block: "Quadra QA",
    street: "Rua QA",
    number: "123",
    complement: "Fundos",
  };
  const interested = {
    ...base(),
    addressId: address.id,
    name: "Interessado QA",
    contact: "Contato QA privado",
    nextReturn: "2026-11-01",
    deletedAt: null,
  };
  return {
    format: "territorio-digital-publicador",
    version: 1,
    kind: "interested",
    exportedAt: now,
    profile: null,
    addresses: [address],
    interested: [interested],
    conversations: [
      {
        ...base(),
        interestedId: interested.id,
        text: "Conversa QA privada",
        occurredAt: now,
        deletedAt: null,
      },
    ],
  };
}
export async function register(page: Page, name = "Publicador QA") {
  await page.goto("/publicador");
  await page.getByLabel("Seu nome", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Meus interessados" }),
  ).toBeVisible();
}
export async function upload(page: Page, file: unknown) {
  await page
    .getByLabel("Arquivo para importar")
    .setInputFiles({
      name: "qa.tdpub.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(file)),
    });
}
export async function importSample(page: Page, file = sampleFile()) {
  await upload(page, file);
  await expect(
    page.getByRole("dialog", { name: "Revisar importação" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar importação", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  return file;
}
export async function state(page: Page): Promise<PublisherData> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("territorio-digital-publicador", 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction("documents", "readonly");
          const request = transaction.objectStore("documents").get("main");
          transaction.oncomplete = () => {
            db.close();
            resolve(request.result);
          };
        };
      }),
  );
}
export async function openPerson(page: Page, name = "Interessado QA") {
  await page.getByRole("button", { name: /^Rua QA / }).click();
  await page.getByRole("button", { name: new RegExp(`^${name} `) }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}
export async function mockField(context: BrowserContext) {
  const token = `qa.${Buffer.from(JSON.stringify({ tenantId: 999 })).toString("base64url")}.qa`;
  const access = {
    code: "QAPUBL",
    role: "publisher",
    territoryId: 11,
    blockId: 22,
    round: 1,
    canEditStructure: false,
    expiresAt: "2031-01-01T00:00:00.000Z",
    overseer: "QA",
  };
  const roundInfo = {
    name: "Rodada QA",
    theme: "default",
    colorPrimary: null,
    colorSecondary: null,
  };
  const house = {
    id: 55,
    number: "123",
    legend: null,
    hasRound: true,
    status: false,
    leaveLetter: false,
    dontVisit: false,
    reportType: null,
    readOnly: false,
    complement: "Fundos",
    canMark: true,
    canUnmark: false,
    canUnmarkUntil: null,
    blockedReason: null,
    registrationStatus: "approved",
    pendingRequest: null,
  };
  const block = {
    id: 22,
    name: "Quadra QA",
    total: 2,
    catalogTotal: 2,
    completed: 0,
    pending: 2,
    withoutRound: 0,
    lastWorkedAt: null,
    suggestedPairs: 0,
    suggestion: "",
    signature: null,
    registrationStatus: "approved",
    pendingRequest: null,
  };
  const data = {
    workRoundNumber: 1,
    capabilities: { canEditStructure: false, canReportHouses: true },
    territory: { id: 11, name: "Território QA", imageUrl: null },
    tenancy: {
      name: "Congregação QA local",
      city: "Sorocaba",
      state: "SP",
      phone: null,
    },
    roundInfo,
    block,
    streets: [
      {
        id: 33,
        mappingId: 44,
        name: "Rua QA",
        zipCode: null,
        total: 2,
        catalogTotal: 2,
        completed: 0,
        pending: 2,
        withoutRound: 0,
        firstNumber: "123",
        lastNumber: "124",
        houses: [house, { ...house, id: 56, number: "124" }],
        registrationStatus: "approved",
        pendingRequest: null,
      },
    ],
  };
  const writes: string[] = [];
  await context.route(/\/v1\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (["POST", "PATCH", "PUT"].includes(request.method()))
      writes.push(request.url());
    if (url.pathname.endsWith("/signature/QAPUBL"))
      return route.fulfill({ json: { token, access, roundInfo } });
    if (request.method() === "DELETE")
      return route.fulfill({ json: { ok: true } });
    if (url.searchParams.has("cursor")) return; // long poll held until navigation/context close
    return route.fulfill({
      json: {
        changed: true,
        cursor: "qa:1",
        data,
        presence: { total: 1, blocks: {}, streets: {} },
      },
    });
  });
  return { writes, token };
}

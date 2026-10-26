import {
  test,
  expect,
  chromium,
  devices,
  type Request,
} from "@playwright/test";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  importSample,
  mockField,
  openPerson,
  register,
  sampleFile,
  state,
  upload,
} from "./fixtures";

test("perfil e PWA persistem após encerrar o navegador e reabrir offline", async ({
  browserName,
  baseURL,
}) => {
  test.skip(
    browserName !== "chromium",
    "Persistência em disco exercitada com perfil Chromium isolado.",
  );
  const directory = await mkdtemp(join(tmpdir(), "td-publisher-qa-"));
  const options = {
    ...devices["Pixel 7"],
    baseURL,
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  };
  let context = await chromium.launchPersistentContext(directory, options);
  try {
    const first = context.pages()[0] || (await context.newPage());
    await register(first);
    await importSample(first);
    await expect(first.locator("header")).toContainText(
      "Pronto para uso offline",
      { timeout: 45000 },
    );
    await context.close();
    context = await chromium.launchPersistentContext(directory, {
      ...options,
      offline: true,
    });
    const second = context.pages()[0] || (await context.newPage());
    await second.goto("/publicador");
    await openPerson(second);
    await expect(
      second.getByRole("region", { name: "Histórico de conversas" }),
    ).toContainText("Conversa QA privada");
    expect((await state(second)).profile?.name).toBe("Publicador QA");
  } finally {
    await context.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("login oferece área local e cadastro não faz requisições com dados pessoais", async ({
  page,
}) => {
  const leaked: string[] = [];
  page.on("request", (request) => {
    if (
      `${request.url()} ${request.postData() || ""}`.includes(
        "Publicador QA privado",
      )
    )
      leaked.push(request.url());
  });
  await page.goto("/login");
  await page
    .getByRole("link", { name: "Área do publicador", exact: true })
    .click();
  await page
    .getByLabel("Seu nome", { exact: true })
    .fill("Publicador QA privado");
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await expect(page.getByText("Olá, Publicador QA privado")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Olá, Publicador QA privado")).toBeVisible();
  expect(leaked).toEqual([]);
});

test.describe("integração local com campo", () => {
  // Keep API mocks effective in every tab. Offline/SW behavior has separate tests.
  test.use({ serviceWorkers: "block" });

  test("campo preserva casa no cadastro, guarda só um endereço e não altera marcações", async ({
    page,
    context,
  }) => {
    const { writes, token } = await mockField(context);
    await page.goto("/acesso/QAPUBL");
    await page.getByRole("button", { name: "Registros", exact: true }).click();
    await page
      .getByRole("button", { name: "Registrar conversa", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Rua QA 2 casas" })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "123 Fundos", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Rua QA, 123 · Fundos",
    );
    await page.getByLabel("Seu nome", { exact: true }).fill("Publicador QA");
    await page.getByRole("button", { name: "Começar", exact: true }).click();
    await page.getByLabel("Nome ou apelido").fill("Interessado QA privado");
    await page.getByLabel("Contato (opcional)").fill("Contato QA privado");
    await page
      .getByLabel("Anotações da conversa")
      .fill("Primeira conversa QA privada");
    await page.getByLabel("Próximo retorno (opcional)").fill("2026-11-01");
    await page
      .getByRole("button", { name: "Salvar conversa", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const saved = await state(page);
    await page.getByRole("button", { name: /^Rua QA / }).click();
    const localHouse = page.getByRole("button", { name: /^Casa 123,/ });
    await expect(localHouse).toHaveAccessibleName(/com registro pessoal/);
    await expect(
      localHouse.getByLabel("Registro pessoal neste aparelho"),
    ).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: /^Casa 124,/ })
        .getByLabel("Registro pessoal neste aparelho"),
    ).toHaveCount(0);
    expect(saved.addresses).toHaveLength(1);
    expect(saved.addresses[0].houseId).toBe(55);
    expect(saved.interested).toHaveLength(1);
    expect(saved.conversations).toHaveLength(1);
    expect(JSON.stringify(saved)).not.toContain(token);
    expect(JSON.stringify(saved)).not.toContain("QAPUBL");
    expect(writes).toEqual([]);
    await page
      .getByRole("navigation", { name: "Ações da área de campo" })
      .getByRole("button", { name: "Registros", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "Registros", exact: true })
      .getByRole("link", { name: "Meus registros", exact: true })
      .click();
    await expect(page).toHaveURL(/\/publicador$/);
    await openPerson(page, "Interessado QA privado");
    await expect(
      page.getByRole("region", { name: "Histórico de conversas" }),
    ).toContainText("Primeira conversa QA privada");
    const field = await context.newPage();
    await field.goto("/acesso/QAPUBL");
    await field.getByRole("button", { name: /^Rua QA / }).click();
    const indicator = field
      .getByRole("button", { name: /^Casa 123,/ })
      .getByLabel("Registro pessoal neste aparelho");
    await expect(indicator).toBeVisible();
    await page
      .getByRole("button", { name: "Excluir interessado", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar exclusão", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(indicator).toHaveCount(0);
    await expect(
      field.getByRole("button", { name: /^Casa 123,/ }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(writes).toEqual([]);
    await field.close();
  });
});

test("conversas e interessados podem ser criados, corrigidos e excluídos localmente", async ({
  page,
}) => {
  await register(page);
  await importSample(page);
  await openPerson(page);
  const directions = page.getByRole("link", {
    name: "Como chegar",
    exact: true,
  });
  const mapsUrl = new URL((await directions.getAttribute("href"))!);
  expect(mapsUrl.origin).toBe("https://www.google.com");
  expect(mapsUrl.pathname).toBe("/maps/dir/");
  expect([...mapsUrl.searchParams]).toEqual([
    ["api", "1"],
    ["destination", "Rua QA, 123, Sorocaba, SP"],
  ]);
  await expect(directions).toHaveAttribute("target", "_blank");
  await expect(directions).toHaveAttribute("rel", "noopener noreferrer");
  await page.getByRole("button", { name: "Continuar conversa" }).click();
  await page.getByLabel("Data e hora da conversa").fill("2026-10-27T10:30");
  await page.getByLabel("Anotações da conversa").fill("Continuação QA");
  await page.getByLabel("Próximo retorno (opcional)").fill("2026-11-04");
  await page
    .getByRole("button", { name: "Salvar conversa", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Histórico · 2 conversas" }),
  ).toBeVisible();
  await page
    .getByRole("article")
    .filter({ hasText: "Continuação QA" })
    .getByRole("button", { name: "Editar conversa" })
    .click();
  await page
    .getByLabel("Anotações da conversa")
    .fill("Continuação QA corrigida");
  await page
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("article").filter({ hasText: "Continuação QA corrigida" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Editar cadastro" }).click();
  await page.getByLabel("Nome ou apelido").fill("Interessada QA");
  await page
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Interessada QA", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("article")
    .filter({ hasText: "Continuação QA corrigida" })
    .getByRole("button", { name: "Excluir conversa" })
    .click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Histórico · 1 conversa" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar aos endereços" }).click();
  await page.getByRole("button", { name: /^Rua QA / }).click();
  await page
    .getByRole("button", { name: "Novo interessado nesta casa" })
    .click();
  await page.getByLabel("Nome ou apelido").fill("Segundo interessado QA");
  await page
    .getByLabel("Anotações da conversa")
    .fill("Outra pessoa na mesma casa");
  await page
    .getByRole("button", { name: "Salvar conversa", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await state(page)).addresses).toHaveLength(1);
  expect(
    (await state(page)).interested.filter((person) => !person.deletedAt),
  ).toHaveLength(2);
  await page.getByRole("button", { name: /^Interessada QA / }).click();
  await page
    .getByRole("button", { name: "Excluir interessado", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const saved = await state(page);
  expect(saved.interested[0].deletedAt).toBeTruthy();
  expect(saved.interested[0].name).toBe("Interessado excluído");
  expect(saved.interested[0].contact).toBe("");
  expect(
    saved.conversations
      .filter((note) => note.interestedId === saved.interested[0].id)
      .every((note) => note.deletedAt),
  ).toBe(true);
  expect(
    saved.conversations
      .filter((note) => note.interestedId === saved.interested[0].id)
      .every((note) => note.text === "Conversa excluída"),
  ).toBe(true);
});

test("backup restaura em navegador vazio, preserva perfil e não duplica importações", async ({
  page,
  browser,
}) => {
  await register(page);
  const file = await importSample(page);
  await importSample(page, file);
  expect((await state(page)).interested).toHaveLength(1);
  await page.getByRole("button", { name: "Meus dados", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar todos os dados" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.tdpub\.json$/);
  const backup = JSON.parse(await readFile((await download.path())!, "utf8"));
  const other = await browser.newContext();
  const receiver = await other.newPage();
  await register(receiver, "Outro publicador QA");
  await importSample(receiver, backup);
  const restored = await state(receiver);
  expect(restored.profile?.name).toBe("Outro publicador QA");
  expect(restored.interested).toEqual(file.interested);
  expect(restored.conversations).toEqual(file.conversations);
  await other.close();
});

test("importação exige revisão de alterações e exclusões e rejeita arquivos inválidos", async ({
  page,
}) => {
  await register(page);
  const file = await importSample(page);
  const before = await state(page);
  for (const invalid of [
    { ...file, version: 999 },
    { ...file, token: "nao-aceitar" },
    {
      ...file,
      conversations: [
        { ...file.conversations[0], interestedId: crypto.randomUUID() },
      ],
    },
  ]) {
    await upload(page, invalid);
    await expect(page.locator("main").getByRole("alert")).toBeVisible();
    expect(await state(page)).toEqual(before);
  }
  const edited = structuredClone(file);
  edited.interested[0].name = "Nome recebido QA";
  await upload(page, edited);
  await expect(
    page.getByRole("button", { name: "Confirmar importação" }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: /^Usar importado/ }).check();
  await page.getByRole("button", { name: "Confirmar importação" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await state(page)).interested[0].name).toBe("Nome recebido QA");
  const removed = structuredClone(edited);
  removed.interested[0].deletedAt = "2026-10-27T15:00:00.000Z";
  removed.conversations[0].deletedAt = "2026-10-27T15:00:00.000Z";
  await upload(page, removed);
  await expect(
    page.getByRole("button", { name: "Confirmar importação" }),
  ).toBeDisabled();
  for (const radio of await page
    .getByRole("radio", { name: /^Aceitar exclusão/ })
    .all())
    await radio.check();
  await page.getByRole("button", { name: "Confirmar importação" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await state(page)).interested[0].deletedAt).toBeTruthy();
});

test("importação detecta edição concorrente e grava tudo ou nada", async ({
  page,
  context,
}) => {
  await register(page);
  await importSample(page);
  const incoming = sampleFile();
  await upload(page, incoming);
  const other = await context.newPage();
  await other.goto("/publicador#dados");
  await other.getByLabel("Seu nome", { exact: true }).fill("Nome alterado QA");
  await other.getByRole("button", { name: "Salvar nome", exact: true }).click();
  await expect(
    other.getByText("Nome atualizado.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmar importação" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "mudaram durante a revisão",
  );
  expect((await state(page)).interested).toHaveLength(1);
});

test("arquivos abertos pelo sistema usam a mesma revisão e preservam os demais arquivos pendentes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "launchQueue", {
      configurable: true,
      value: {
        setConsumer(consumer: unknown) {
          (window as Window & { qaLaunchConsumer?: unknown }).qaLaunchConsumer =
            consumer;
        },
      },
    });
  });
  await register(page);
  const first = sampleFile(),
    second = sampleFile();
  second.interested[0].name = "Outro interessado recebido QA";
  await page.evaluate(
    async (files) => {
      const consumer = (
        window as Window & {
          qaLaunchConsumer?: (params: {
            files: { getFile(): Promise<File> }[];
          }) => void;
        }
      ).qaLaunchConsumer!;
      consumer({
        files: files.map((data) => ({
          getFile: async () =>
            new File([JSON.stringify(data)], "aberto.tdpub.json", {
              type: "application/json",
            }),
        })),
      });
    },
    [first, second],
  );
  await page
    .getByRole("button", { name: "Revisar arquivo aberto 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar importação", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Revisar arquivo aberto 1", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Revisar arquivo aberto 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar importação", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await state(page)).interested).toHaveLength(2);
});

test("atualização do PWA aguarda confirmação e preserva formulário e dados", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "A instalação de uma segunda versão é simulada pelo Chromium.",
  );
  await register(page);
  await importSample(page);
  await openPerson(page);
  await expect(page.locator("header")).toContainText(
    "Pronto para uso offline",
    { timeout: 45000 },
  );
  await page.getByRole("button", { name: "Continuar conversa" }).click();
  await page.getByLabel("Anotações da conversa").fill("Rascunho preservado QA");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js?qa-update=1", {
      scope: "/",
      updateViaCache: "none",
    });
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          async () =>
            !!(await navigator.serviceWorker.getRegistration())?.waiting,
        ),
      { timeout: 45000 },
    )
    .toBe(true);
  await expect(page.getByLabel("Anotações da conversa")).toHaveValue(
    "Rascunho preservado QA",
  );
  await page
    .getByRole("button", { name: "Salvar conversa", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Meus dados", exact: true }).click();
  await page
    .getByRole("button", { name: "Atualização disponível", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Atualizar aplicativo?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Atualizar agora", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Meus dados", exact: true }),
  ).toBeVisible();
  expect((await state(page)).conversations).toHaveLength(2);
});

test("compartilhar mantém cópia, envia histórico completo e cancelamento não baixa arquivo", async ({
  page,
}) => {
  await register(page);
  const file = await importSample(page);
  await openPerson(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        (window as Window & { shared?: string }).shared =
          await data.files![0].text();
      },
    });
  });
  await page.getByRole("button", { name: "Compartilhar arquivo" }).click();
  await expect(
    page.getByText(
      "Arquivo compartilhado. Sua cópia continua neste aparelho.",
      { exact: true },
    ),
  ).toBeVisible();
  const sent = await page.evaluate(() =>
    JSON.parse((window as Window & { shared?: string }).shared!),
  );
  expect(sent.interested).toEqual(file.interested);
  expect(sent.conversations).toEqual(file.conversations);
  expect(sent.profile).toBeNull();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        throw new DOMException("Cancelado", "AbortError");
      },
    }),
  );
  let downloads = 0;
  page.on("download", () => downloads++);
  await page.getByRole("button", { name: "Compartilhar arquivo" }).click();
  await expect(
    page.getByRole("button", { name: "Compartilhar arquivo" }),
  ).toBeEnabled();
  expect(downloads).toBe(0);
  expect((await state(page)).interested).toHaveLength(1);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => false,
    }),
  );
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Compartilhar arquivo" }).click();
  await downloaded;
});

test("mobile e desktop não apresentam overflow e mantêm ações acessíveis", async ({
  page,
}, testInfo) => {
  await register(page);
  await importSample(page);
  for (const width of [360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByLabel("Buscar interessado ou endereço").fill("QA");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const button of await page
      .getByRole("navigation")
      .getByRole("button")
      .all())
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({
      path: testInfo.outputPath(`publicador-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: /^Interessado QA / }).click();
  for (const width of [360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const actions = page
      .getByLabel("Ações do interessado")
      .locator("button, a");
    await expect(actions).toHaveCount(4);
    const boxes = await Promise.all(
      (await actions.all()).map((action) => action.boundingBox()),
    );
    for (const box of boxes) {
      expect(box!.height).toBe(48);
      expect(Math.abs(box!.width - boxes[0]!.width)).toBeLessThanOrEqual(1);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const name of ["Editar conversa", "Excluir conversa"])
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`interessado-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Continuar conversa" }).click();
  await page.setViewportSize({ width: 360, height: 640 });
  expect(
    await page
      .getByRole("dialog")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.getByLabel("Anotações da conversa").fill("QA por teclado");
  await page
    .getByRole("button", { name: "Salvar conversa", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await state(page)).conversations).toHaveLength(2);
});

test("PWA reabre offline em outra aba e importa sem enviar dados à rede", async ({
  page,
  context,
  browserName,
}) => {
  await register(page);
  await importSample(page);
  await expect(page.locator("header")).toContainText(
    "Pronto para uso offline",
    { timeout: 45000 },
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Meus interessados" }),
  ).toBeVisible();
  const personalRequests: Request[] = [];
  context.on("request", (request) => {
    if (
      /QA privada|QA privado/.test(
        `${request.url()} ${request.postData() || ""}`,
      )
    )
      personalRequests.push(request);
  });
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/login");
  await reopened
    .getByRole("link", { name: "Área do publicador", exact: true })
    .click();
  await openPerson(reopened);
  await reopened.getByRole("button", { name: "Continuar conversa" }).click();
  await reopened
    .getByLabel("Anotações da conversa")
    .fill("Continuação offline QA privada");
  await reopened
    .getByRole("button", { name: "Salvar conversa", exact: true })
    .click();
  await expect(reopened.getByRole("dialog")).toHaveCount(0);
  expect((await state(reopened)).conversations).toHaveLength(2);
  // Simulate the OS share-target POST under the active service worker. The
  // browser must intercept it locally even when the server is unreachable.
  if (browserName === "chromium") {
    const incoming = sampleFile();
    await reopened.evaluate(async (file) => {
      const form = new FormData();
      form.append(
        "files",
        new File([JSON.stringify(file)], "qa.tdpub.json", {
          type: "application/json",
        }),
      );
      const result = await fetch("/publicador/receber", {
        method: "POST",
        body: form,
      });
      if (!result.ok) throw new Error("Recebimento offline falhou");
    }, incoming);
    await reopened.reload();
    await reopened
      .getByRole("button", { name: "Revisar arquivo 1", exact: true })
      .click();
    await reopened
      .getByRole("button", { name: "Confirmar importação", exact: true })
      .click();
    await expect(reopened.getByRole("dialog")).toHaveCount(0);
    expect((await state(reopened)).interested).toHaveLength(2);
  }
  for (const request of personalRequests) {
    expect(new URL(request.url()).pathname).toBe("/publicador/receber");
    expect((await request.response())?.fromServiceWorker()).toBe(true);
  }
  const cacheKeys = await reopened.evaluate(async () => {
    const names = (await caches.keys()).filter((name) =>
      name.startsWith("td-pwa-"),
    );
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map(
            (request) => new URL(request.url).pathname,
          ),
        ),
      )
    ).flat();
  });
  expect(
    cacheKeys.some((path) =>
      /^\/(dashboard|gestao|campo|acesso|v1)(\/|$)/.test(path),
    ),
  ).toBe(false);
  await context.setOffline(false);
});

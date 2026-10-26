import { test, expect, type Page, type Route } from "@playwright/test";
import type { Block, FieldSession, House, Snapshot } from "../../src/features/field/types";
import { captureShares } from "./sharing";

const api = process.env.FIELD_API_URL || "http://localhost:3001/v1";
const instant = new Date("2030-01-01T12:00:00Z");
const block = (id: number, name = `Quadra ${id}`, lastWorkedAt: string | null = null): Block => ({
  id, name, lastWorkedAt, registrationStatus: "approved", pendingRequest: null,
  total: 2, catalogTotal: 2, withoutRound: 0, completed: 1, pending: 1,
  suggestedPairs: 1, suggestion: "+1 quadra", signature: null,
});
const house: House = {
  id: 1, number: "12345-A", hasRound: true, status: false, leaveLetter: false, dontVisit: false,
  reportType: null, readOnly: false, complement: null, canMark: true, canUnmark: false,
  canUnmarkUntil: null, blockedReason: null, registrationStatus: "approved", pendingRequest: null, legend: null,
};
async function setup(page: Page, options: { role?: "overseer" | "publisher"; theme?: "default" | "campaign" | "letters"; code?: string } = {}) {
  const { role = "overseer", theme = "default", code = "QATEST" } = options;
  const palette = { name: "Rodada QA", theme, colorPrimary: null, colorSecondary: null };
  const session: FieldSession = {
    token: "qa-only", access: { code, role, territoryId: 1, blockId: role === "publisher" ? 1 : null,
      round: 1, canEditStructure: false, expiresAt: "2031-01-01T00:00:00Z", overseer: "Dirigente QA" }, roundInfo: palette,
  };
  const data: Snapshot = {
    workRoundNumber: 1, capabilities: { canEditStructure: false, canReportHouses: true },
    territory: { id: 1, name: "Território QA de apresentação", imageUrl: "/logo.png" },
    tenancy: { name: "Congregação QA", city: "Sorocaba", state: "SP", phone: null }, roundInfo: palette,
    blocks: [block(1)], block: role === "publisher" ? block(1) : null,
    streets: [11, 12].map((id) => ({
      id, mappingId: id + 100, name: `Rua QA ${id}`, zipCode: null, total: 1, catalogTotal: 1,
      withoutRound: 0, completed: 0, pending: 1, firstNumber: house.number, lastNumber: house.number,
      houses: [{ ...house, id }], registrationStatus: "approved", pendingRequest: null,
    })),
  };
  const waiting: Route[] = [];
  let reads = 0;
  await page.route(`${api}/signature/${code}`, (route) => route.fulfill({ json: session }));
  await page.route(`${api}/field/session?**`, (route) => route.fulfill({ json: { ok: true } }));
  await page.route(`${api}/field/**`, (route) => {
    if (route.request().method() === "DELETE") return route.fulfill({ json: { ok: true } });
    reads++;
    if (new URL(route.request().url()).searchParams.has("cursor")) { waiting.push(route); return; }
    return route.fulfill({ json: { changed: true, cursor: `qa:${reads}`, data: new URL(route.request().url()).pathname.includes("/blocks/") ? { ...data, block: data.blocks[0] } : data, presence: { total: 1, blocks: { 1: 1 }, streets: {} } } });
  });
  await captureShares(page);
  return { data, session, waiting, reads: () => reads };
}
const card = (page: Page, name = "Quadra 1") => page.getByRole("article", { name, exact: true });
const street = (page: Page, id: number) => page.getByRole("button", { name: new RegExp(`^Rua QA ${id} `) });
async function openFieldHelp(page: Page) {
  await expect(page.getByRole("navigation")).toBeVisible();
  const more = page.getByRole("button", { name: "Mais", exact: true });
  if (await more.count()) await more.click();
  await page.getByRole("button", { name: "Ajuda", exact: true }).click();
}


test("entrada automática e sessões de campo preservam cookie administrativo", async ({ page, context }) => {
  await context.addCookies([{ name: "token", value: "admin-session-qa", url: "http://localhost:4800" }]);
  await setup(page);
  await page.goto("/acesso/qatest");
  await expect(page).toHaveURL(/\/campo\/QATEST$/);
  await expect(card(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar na designação" })).toHaveCount(0);
  expect((await context.cookies()).find((item) => item.name === "token")?.value).toBe("admin-session-qa");
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("field:QATEST")!).access.role)).toBe("overseer");
});

test("publicador entra diretamente nas ruas e link interno mantém a rua alvo sem sessão anterior", async ({ page }) => {
  await setup(page, { role: "publisher" });
  await page.goto("/campo/QATEST/quadra/1/rua/12");
  await expect(street(page, 12)).toHaveAttribute("aria-expanded", "true");
  await expect(street(page, 11)).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/\/campo\/QATEST\/quadra\/1\/rua\/12$/);
  await street(page, 11).click();
  await expect(street(page, 12)).toHaveAttribute("aria-expanded", "false");
  await expect(street(page, 11)).toHaveAttribute("aria-expanded", "true");
  await street(page, 11).click();
  await expect(street(page, 11)).toHaveAttribute("aria-expanded", "false");
  await page.goto("/acesso/QATEST");
  await expect(page).toHaveURL(/\/campo\/QATEST$/);
  await expect(page.getByRole("heading", { name: "Quadra 1", exact: true })).toBeVisible();
});

test("UUID legado entra automaticamente e ignora destino externo do parâmetro p", async ({ page }) => {
  const code = "12345678-1234-1234-1234-123456789abc";
  await setup(page, { code });
  await page.goto(`/home?s=${code}&p=https://example.invalid`);
  await expect(page).toHaveURL(`/campo/${code}`);
  await expect(card(page)).toBeVisible();
});

test("erro de validação permite tentar novamente; armazenamento bloqueado é explicado", async ({ page }) => {
  const { session } = await setup(page);
  let attempts = 0;
  await page.route(`${api}/signature/QATEST`, (route) => {
    attempts++;
    return attempts === 1 ? route.fulfill({ status: 410, json: { message: "Link expirado QA" } }) : route.fulfill({ json: session });
  });
  await page.goto("/acesso/QATEST");
  await expect(page.locator("main").getByRole("alert")).toHaveText("Link expirado QA");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(card(page)).toBeVisible();
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("blocked"); }; });
  await page.goto("/acesso/QATEST");
  await expect(page.locator("main").getByRole("alert")).toHaveText("Permita o armazenamento deste site para entrar.");
});

test("ordena quadras pelo histórico e nome natural, sem modificar a resposta", async ({ page }) => {
  const { data } = await setup(page);
  data.blocks = [block(10), block(2), block(4, "Quadra 4", "2029-12-12"), block(3, "Quadra 3", "2029-01-01")];
  await page.goto("/acesso/QATEST");
  await expect(page.getByRole("article")).toHaveCount(4);
  expect(await page.getByRole("article").evaluateAll((elements) => elements.map((el) => el.getAttribute("aria-label"))))
    .toEqual(["Quadra 2", "Quadra 10", "Quadra 3", "Quadra 4"]);
  expect(data.blocks.map((item) => item.id)).toEqual([10, 2, 4, 3]);
});

test("gerar, cancelar envio, reenviar, expirar e revogar reutiliza o link e a validade recebidos", async ({ page }) => {
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(new Date(instant.getTime() + 100));
  const { data } = await setup(page);
  let generated = 0, revoked = 0;
  await page.route(`${api}/territories/1/blocks/1/signature**`, async (route) => {
    if (route.request().method() === "POST") {
      generated++;
      data.blocks[0].signature = { key: generated === 1 ? "LINK01" : "LINK02", expirationDate: new Date(instant.getTime() + (generated === 1 ? 86402000 : 172800000)).toISOString() };
      return route.fulfill({ json: { signature: data.blocks[0].signature.key, expirationDate: data.blocks[0].signature.expirationDate } });
    }
    revoked++;
    data.blocks[0].signature = null;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/acesso/QATEST");
  await page.evaluate(() => { (window as Window & { qaCancelShare?: boolean }).qaCancelShare = true; });
  const share = page.getByRole("button", { name: "Compartilhar Quadra 1", exact: true });
  await share.click();
  await expect(card(page).getByLabel("Validade do link de Quadra 1")).toContainText("1d 00:00:02");
  await expect(share).toBeEnabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await share.click();
  await expect.poll(() => page.evaluate(() => (window as Window & { qaShares?: ShareData[] }).qaShares?.length)).toBe(2);
  const shares = await page.evaluate(() => (window as Window & { qaShares?: ShareData[] }).qaShares!);
  expect(shares[0]).toEqual(shares[1]);
  expect(shares[0].url).toMatch(/\/acesso\/LINK01$/);
  expect(shares[0].text).toBe("*DESIGNAÇÃO DE TERRITÓRIO*\n\nPrezado(a) publicador(a),\nsegue o link para a *Quadra 1*, no território *Território QA de apresentação*, que você está designado(a) para trabalhar:");
  expect(generated).toBe(1);
  await page.clock.fastForward(86403000);
  await expect(card(page).getByLabel("Validade do link de Quadra 1")).toHaveText("Link vencido · 00:00:00");
  await share.click();
  await expect.poll(() => generated).toBe(2);
  await expect(share).toBeEnabled();
  await card(page).getByRole("button", { name: "Revogar acesso", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("O link de Quadra 1 deixará de funcionar");
  expect(revoked).toBe(0);
  await page.getByRole("dialog").getByRole("button", { name: "Revogar acesso", exact: true }).click();
  await expect(card(page).getByText("Link ainda não gerado")).toBeVisible();
  await expect(card(page).getByRole("button", { name: "Revogar acesso", exact: true })).toHaveCount(0);
  expect(revoked).toBe(1);
});

test("compartilhamento indisponível copia mensagem completa e oferece alternativa manual quando necessário", async ({ page }) => {
  const { data } = await setup(page);
  data.blocks[0].signature = { key: "LINK01", expirationDate: "2031-01-01T00:00:00Z" };
  await page.goto("/acesso/QATEST");
  await page.evaluate(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));
  await page.getByRole("button", { name: "Compartilhar Quadra 1", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { qaCopied?: string }).qaCopied)).toMatch(/\*DESIGNAÇÃO DE TERRITÓRIO\*[\s\S]+\nhttp.*\/acesso\/LINK01$/);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }));
  await page.getByRole("button", { name: "Compartilhar Quadra 1", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Prezado(a) publicador(a)");
  await expect(page.getByTestId("share-link")).toContainText("/acesso/LINK01");
});

test("header acompanha sincronizações sem alterações e mantém o último horário offline", async ({ page, context }) => {
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(new Date(instant.getTime() + 100));
  const { waiting } = await setup(page);
  await page.goto("/acesso/QATEST");
  const updated = page.getByLabel("Última sincronização");
  await expect(updated).toHaveAttribute("datetime", new Date(instant.getTime() + 100).toISOString());
  await expect.poll(() => waiting.length).toBe(1);
  await page.clock.fastForward(2000);
  await waiting.shift()!.fulfill({ json: { changed: false, cursor: "qa:2", presence: { total: 1, blocks: {}, streets: {} } } });
  const latest = new Date(instant.getTime() + 2100).toISOString();
  await expect(updated).toHaveAttribute("datetime", latest);
  await context.setOffline(true);
  await expect(page.locator("header")).toContainText("Sem conexão");
  await page.clock.fastForward(5000);
  await expect(updated).toHaveAttribute("datetime", latest);
  await context.setOffline(false);
});

test("rodapé escolhe rua recolhida e envia o formulário existente para essa rua", async ({ page }) => {
  const { reads } = await setup(page, { role: "publisher" });
  let payload: Record<string, unknown> | undefined;
  await page.route(`${api}/change-requests`, (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { id: 1 } });
  });
  await page.goto("/acesso/QATEST");
  const nav = page.getByRole("navigation");
  await expect(nav.getByRole("button")).toHaveText(["Mapa", "Como chegar", "Registros", "Mais"]);
  await nav.getByRole("button", { name: "Registros", exact: true }).click();
  const records = page.getByRole("dialog", { name: "Registros", exact: true });
  await expect(records.getByRole("link", { name: "Meus registros", exact: true })).toHaveAttribute("href", "/publicador");
  await expect(records.getByRole("link", { name: "Meus registros", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(nav.getByRole("button", { name: "Registros", exact: true })).toBeFocused();
  await expect(street(page, 12)).toHaveAttribute("aria-expanded", "false");
  const before = reads();
  await nav.getByRole("button", { name: "Mais", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Mais opções" }).getByRole("button")).toHaveText(["Solicitar alteração", "Ajuda"]);
  await page.getByRole("button", { name: "Solicitar alteração", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Solicitar alteração", exact: true });
  await expect(dialog.getByRole("button", { name: /^Rua QA / })).toHaveCount(2);
  await dialog.getByRole("button", { name: "Rua QA 12", exact: true }).click();
  await expect(dialog).toContainText("Rua QA 12 ·");
  await expect(dialog.getByLabel("Tipo de solicitação")).toBeFocused();
  expect(reads()).toBe(before);
  expect(payload).toBeUndefined();
  await dialog.getByLabel("Número", { exact: true }).fill("150");
  await dialog.getByLabel("Observações", { exact: true }).fill("Exemplo QA");
  await dialog.getByRole("button", { name: "Enviar solicitação", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(payload).toMatchObject({ entity: "house", action: "create", territoryId: 1, blockId: 1, addressId: 12, data: { number: "150" } });
});

test("como chegar pede seleção mesmo com uma rua e abre seu endereço no mapa", async ({ page, context }) => {
  const { data, reads, waiting } = await setup(page, { role: "publisher" });
  data.streets = [data.streets[1]];
  await context.route("https://www.google.com/maps/**", (route) => route.fulfill({ contentType: "text/html", body: "<title>Mapa QA</title>" }));
  await page.goto("/acesso/QATEST");
  await expect(street(page, 12)).toBeVisible();
  await expect.poll(() => waiting.length).toBe(1);
  const before = reads();
  await page.getByRole("button", { name: "Como chegar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Como chegar", exact: true });
  const choice = dialog.getByRole("link", { name: "Rua QA 12", exact: true });
  await expect(choice).toBeVisible();
  expect(new URL((await choice.getAttribute("href"))!).searchParams.get("destination")).toContain("Rua QA 12");
  const popupPromise = page.waitForEvent("popup");
  await choice.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/google\.com\/maps\/dir/);
  expect(new URL(popup.url()).searchParams.get("destination")).toBe("Rua QA 12 12345-A, Sorocaba, SP");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Como chegar", exact: true })).toBeFocused();
  expect(reads()).toBe(before);
  await popup.close();
});

test("seleção acompanha remoção de ruas pela sincronização e explica quadra vazia", async ({ page }) => {
  const { data, waiting } = await setup(page, { role: "publisher" });
  await page.goto("/acesso/QATEST");
  await page.getByRole("button", { name: "Mais", exact: true }).click();
  await page.getByRole("button", { name: "Solicitar alteração", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Solicitar alteração", exact: true });
  await expect(dialog.getByRole("button", { name: "Rua QA 12", exact: true })).toBeVisible();
  await expect.poll(() => waiting.length).toBe(1);
  data.streets = [];
  await waiting.shift()!.fulfill({ json: { changed: true, cursor: "qa:removed", data, presence: { total: 1, blocks: { 1: 1 }, streets: {} } } });
  await expect(dialog.getByRole("button", { name: /^Rua QA / })).toHaveCount(0);
  await expect(dialog.getByRole("status")).toHaveText("Nenhuma rua disponível nesta quadra.");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Como chegar", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText("Nenhuma rua disponível nesta quadra.");
});

test("ajuda demonstra casas sem marcações e recolhe as oito siglas", async ({ page }) => {
  await setup(page, { role: "publisher", theme: "campaign" });
  const writes: string[] = [];
  page.on("request", (request) => { if (["POST", "PATCH", "PUT"].includes(request.method())) writes.push(request.url()); });
  await page.goto("/acesso/QATEST");
  await openFieldHelp(page);
  const dialog = page.getByRole("dialog", { name: "Entenda as casas" });
  await expect(dialog.getByRole("figure")).toHaveCount(6);
  await expect(dialog.getByRole("button")).toHaveCount(1); // Only close; examples are inert.
  await dialog.getByRole("figure", { name: "Concluída", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Cadastro em análise", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Comércio", { exact: true })).toBeHidden();
  await dialog.locator("summary").click();
  await expect(dialog.locator("dt")).toHaveCount(8);
  await expect(dialog.getByText("Comércio", { exact: true })).toBeVisible();
  expect(writes).toEqual([]);
});

test("ajuda do dirigente explica indicadores e rodapé preserva compartilhamento só na quadra", async ({ page }) => {
  await setup(page);
  await page.goto("/acesso/QATEST");
  const nav = page.getByRole("navigation");
  await expect(nav.getByRole("button")).toHaveText(["Mapa", "Ajuda"]);
  await nav.getByRole("button", { name: "Ajuda", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Ajuda das quadras" });
  for (const text of ["Gráfico", "Compartilhar", "Pessoas ativas", "Validade"]) await expect(dialog.getByText(text, { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("link", { name: "Ver ruas", exact: true }).click();
  await expect(nav.getByRole("button")).toHaveText(["Mapa", "Como chegar", "Registros", "Mais"]);
  await nav.getByRole("button", { name: "Mais", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Mais opções" }).getByRole("button")).toHaveText(["Solicitar alteração", "Compartilhar", "Ajuda"]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^Atualizar/ })).toHaveCount(0);
});

for (const theme of ["default", "campaign", "letters"] as const) {
  test(`layout responsivo, logo e ações no tema ${theme}`, async ({ page }, testInfo) => {
    const { data } = await setup(page, { theme });
    data.blocks[0].signature = { key: "PREVIA", expirationDate: new Date(Date.now() + 5 * 3600000).toISOString() };
    data.blocks.push(block(2, "Quadra 2 com identificação muito longa para conferir a leitura no celular"));
    await page.goto("/acesso/QATEST");
    await expect(card(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Ver mapa", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Solicitações", exact: true })).toHaveCount(0);
    const logo = page.locator("header").getByRole("img", { name: "Território Digital" });
    const logoStyle = await logo.evaluate((element) => {
      const style = getComputedStyle(element.parentElement!);
      return { color: style.backgroundColor, radius: style.borderRadius };
    });
    expect(logoStyle.color).toBe({ default: "rgb(68, 120, 60)", campaign: "rgb(57, 118, 138)", letters: "rgb(165, 106, 46)" }[theme]);
    expect(logoStyle.radius).toBe("9999px");
    for (const width of [360, 390, 430, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const columns = await page.getByRole("region", { name: "Quadras do território" }).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
      expect(columns).toBe(width < 640 ? 1 : 2);
      const chart = await card(page).getByRole("img", { name: "Progresso de Quadra 1: 50% concluído" }).boundingBox();
      const indicators = await card(page).getByTestId("block-indicators").boundingBox();
      expect(chart!.x + chart!.width).toBeLessThanOrEqual(indicators!.x);
      expect(chart!.width).toBeGreaterThan(120);
      expect(chart!.y).toBeLessThan(indicators!.y + indicators!.height);
      const revoke = card(page).getByRole("button", { name: "Revogar acesso", exact: true });
      await expect(revoke).toBeVisible();
      expect((await revoke.boundingBox())!.height).toBe(44);
      expect((await revoke.locator("span").boundingBox())!.height).toBe(32);
      expect(await revoke.evaluate(el => getComputedStyle(el).fontSize)).toBe("12px");
      const connection = await page.getByTestId("field-connection-icon").boundingBox();
      const date = await page.getByLabel("Última sincronização").boundingBox();
      expect(connection!.y + connection!.height).toBeLessThanOrEqual(date!.y);
      expect(Math.abs(connection!.x + connection!.width / 2 - date!.x - date!.width / 2)).toBeLessThan(2);
      await page.evaluate(() => scrollTo(0, 0));
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await page.screenshot({ path: testInfo.outputPath(`quadras-${width}.png`) });
    }
    await page.getByRole("button", { name: "Mapa", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("img", { name: "Mapa de Território QA de apresentação" })).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await openFieldHelp(page);
    await page.screenshot({ path: testInfo.outputPath("ajuda-quadras.png") });
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("link", { name: "Ver ruas", exact: true }).first().click();
    await street(page, 11).click();
    const houseButton = page.getByRole("button", { name: /^Casa 12345-A,/ });
    expect(await houseButton.getByText("12345-A", { exact: true }).evaluate((el) => getComputedStyle(el).fontSize)).toBe("20px");
    await expect(page.getByRole("button", { name: "Como chegar", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button")).toHaveText(["Mapa", "Como chegar", "Registros", "Mais"]);
    for (const width of [360, 390, 430, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`casas-${width}.png`) });
      for (const button of await page.getByRole("navigation").getByRole("button").all()) {
        const bounds = (await button.boundingBox())!;
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
      }
      await page.getByRole("button", { name: "Registros", exact: true }).click();
      const records = page.getByRole("dialog", { name: "Registros", exact: true });
      const recordsBounds = (await records.boundingBox())!;
      expect(recordsBounds.x).toBeGreaterThanOrEqual(0);
      expect(recordsBounds.x + recordsBounds.width).toBeLessThanOrEqual(width);
      await page.screenshot({ path: testInfo.outputPath(`registros-${width}.png`) });
      await page.keyboard.press("Escape");
      await openFieldHelp(page);
      const help = page.getByRole("dialog", { name: "Entenda as casas" });
      await expect(help.getByRole("figure")).toHaveCount(6);
      expect(await help.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`ajuda-${width}.png`) });
      await help.getByRole("button", { name: "Close", exact: true }).click();
      await page.getByRole("button", { name: "Como chegar", exact: true }).click();
      const picker = page.getByRole("dialog", { name: "Como chegar", exact: true });
      await expect(picker.getByRole("link")).toHaveCount(2);
      expect(await picker.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`escolher-rua-${width}.png`) });
      await picker.getByRole("button", { name: "Close", exact: true }).click();
    }
    await openFieldHelp(page);
    await expect(page.getByRole("dialog")).not.toContainText("Abra uma rua por vez");
    await expect(page.getByRole("dialog")).not.toContainText("Toque na casa e confirme");
  });
}

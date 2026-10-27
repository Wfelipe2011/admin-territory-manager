import { test, expect, type Page, type Route } from "@playwright/test";
import type { Round, Territories } from "../../src/types/territories";

const api = process.env.FIELD_API_URL || "http://localhost:3001/v1";
const instant = new Date("2030-01-01T12:00:00Z");
const round = (id: number, status: Round["status"] = "open"): Round => ({
  id, round_number: id, name: `Rodada QA ${id}`, status, theme: "default", type: "Residencial", tenant_id: 1,
  color_primary: "#7AAD58", color_secondary: "#CBE6BA", start_date: "2029-12-01T12:00:00Z", end_date: status === "closed" ? "2029-12-31" : null,
  completed: 60, not_completed: 40,
});
const territory = (id: number, name: string, hours: number | null, pending = 10): Territories => ({
  territoryId: id, name, typeId: 1, overseer: hours === null ? null : "Dirigente QA", hasRounds: true,
  signature: { key: hours === null ? null : `LINK0${id}`, expirationDate: hours === null ? null : new Date(instant.getTime() + hours * 3600000).toISOString() },
  negativeCompleted: pending, positiveCompleted: [{ date: "2029-12-31", period: "morning" }],
});
async function setup(page: Page) {
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(new Date(instant.getTime() + 100));
  const payload = Buffer.from(JSON.stringify({ roles: ["admin"], exp: 1956528000, tenantId: 1 })).toString("base64url");
  await page.context().addCookies([{ name: "token", value: `qa.${payload}.qa`, url: process.env.FIELD_BASE_URL || "http://localhost:4800" }]);
  const state = {
    rounds: [round(9, "closed"), round(3), round(5)],
    rows: {
      5: [territory(1, "Sem link QA", null, 15), territory(2, "Link vencido QA", -1), territory(3, "Vence em 24h QA", 24), territory(4, "Vence em 48h QA", 48), territory(5, "Vence depois QA", 49), territory(6, "Concluído sem link QA", null, 0)],
      3: [territory(7, "Outra rodada QA", 12)],
    } as Record<number, Territories[]>,
    failRounds: false, failHouses: false, failTerritories: false, failHistory: false, failRequests: false,
    history: [{ date: "2029-12-31", Residência: 12, Comércio: 3 }] as { date: string; [key: string]: string | number }[],
    territoryReads: [] as number[], historyReads: 0, pendingPolls: [] as Route[],
  };
  await page.route(`${api}/rounds/info`, route => route.fulfill(state.failRounds ? { status: 503, json: { message: "Indisponível" } } : { json: state.rounds }));
  await page.route(`${api}/dashboard/territory-details`, route => route.fulfill(state.failHouses ? { status: 503, json: {} } : { json: { total: 1200 } }));
  await page.route(`${api}/territories?**`, route => {
    const id = Number(new URL(route.request().url()).searchParams.get("round"));
    state.territoryReads.push(id);
    return route.fulfill(state.failTerritories ? { status: 503, json: {} } : { json: state.rows[id] ?? [] });
  });
  await page.route(`${api}/dashboard/marked-houses`, route => {
    state.historyReads++;
    return route.fulfill(state.failHistory ? { status: 503, json: {} } : { json: state.history });
  });
  await page.route(`${api}/change-requests/sync**`, route => {
    if (state.failRequests) return route.fulfill({ status: 503, json: {} });
    if (new URL(route.request().url()).searchParams.has("cursor")) { state.pendingPolls.push(route); return; }
    return route.fulfill({ json: { cursor: "qa:1", pending: 7 } });
  });
  return state;
}
const section = (page: Page, label: string) => page.getByRole("region", { name: label, exact: true });

test("Início separa totais da congregação e progresso da rodada mais recente, com alertas acionáveis", async ({ page }, testInfo) => {
  const state = await setup(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/dashboard");
  await expect(page.getByLabel("Rodada em andamento", { exact: true })).toHaveValue("5");
  await expect(section(page, "Resumo da congregação")).toContainText("1.200");
  await expect(section(page, "Resumo da congregação")).toContainText("7");
  await expect(page.getByRole("img", { name: "Progresso da rodada: 60% concluído" })).toBeVisible();
  await expect(section(page, "Operação da rodada")).toContainText("3designações ativas");
  await expect(section(page, "Operação da rodada")).toContainText("60casas concluídas");
  const unassigned = page.getByLabel("Sem designação ativa", { exact: true });
  await expect(unassigned).toContainText("Sem link QA");
  await expect(unassigned).toContainText("Link vencido QA");
  await expect(unassigned).not.toContainText("Concluído sem link QA");
  const expiring = page.getByLabel("Vencem em até 48 horas", { exact: true });
  await expect(expiring).toContainText("Vence em 24h QA");
  await expect(expiring).toContainText("Vence em 48h QA");
  await expect(expiring).not.toContainText("Vence depois QA");
  await expect(expiring.getByRole("link", { name: "Abrir gestão de Vence em 24h QA" })).toHaveAttribute("href", "/territories/5");
  expect(state.territoryReads).toEqual([5]);
  expect(state.historyReads).toBe(0);
  await page.setViewportSize({ width: 1280, height: 1000 });
  const links = page.locator('[data-sidebar="content"]').getByRole("link");
  await expect(links).toHaveCount(7);
  expect(await links.evaluateAll(els => els.map(el => el.textContent?.trim()))).toEqual(["Início", "Gestão de Territórios", "Solicitações", "Integrações", "Cadastros", "Usuários", "Configurações"]);
  for (const width of [360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = page.getByTestId("round-chart-and-data");
    const chart = await box.getByRole("img").boundingBox();
    const data = await box.locator(":scope > div").nth(1).boundingBox();
    expect(chart!.x + chart!.width).toBeLessThanOrEqual(data!.x);
    expect(Math.abs(chart!.y - data!.y)).toBeLessThan(60);
    await page.evaluate(() => scrollTo(0, 0));
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});

test("troca de rodada cancela a consulta anterior e não mostra dados de outra seleção", async ({ page }) => {
  const state = await setup(page);
  let delayed: Route | undefined;
  await page.route(`${api}/territories?round=5`, route => { delayed = route; });
  await page.goto("/dashboard");
  await expect.poll(() => !!delayed).toBe(true);
  await page.getByLabel("Rodada em andamento", { exact: true }).selectOption("3");
  await expect(page.getByLabel("Vencem em até 48 horas", { exact: true })).toContainText("Outra rodada QA");
  await delayed!.fulfill({ json: state.rows[5] }).catch(() => {});
  await expect(section(page, "Operação da rodada")).not.toContainText("Vence em 24h QA");
  await expect(section(page, "Operação da rodada")).toContainText("1designações ativas");
});

test("rodada vazia e rodada concluída exibem zero e cem por cento sem gerar alertas falsos", async ({ page }) => {
  const state = await setup(page);
  state.rounds = [{ ...round(5), completed: 0, not_completed: 0 }, { ...round(3), completed: 10, not_completed: 0 }];
  state.rows = { 5: [], 3: [territory(1, "Concluído QA", null, 0)] };
  await page.goto("/dashboard");
  await expect(page.getByText("Sem casas nesta rodada.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Progresso da rodada: 0% concluído" })).toBeVisible();
  await expect(page.getByLabel("Sem designação ativa", { exact: true })).toContainText("Nenhum território");
  await page.getByLabel("Rodada em andamento", { exact: true }).selectOption("3");
  await expect(page.getByRole("img", { name: "Progresso da rodada: 100% concluído" })).toBeVisible();
  await expect(page.getByLabel("Sem designação ativa", { exact: true })).not.toContainText("Concluído QA");
});

test("sem rodada aberta mantém resumo da congregação e acesso à gestão", async ({ page }) => {
  const state = await setup(page);
  state.rounds = [round(9, "closed"), round(1, "uninitialized")];
  await page.goto("/dashboard");
  await expect(page.getByText("Nenhuma rodada em andamento", { exact: true })).toBeVisible();
  await expect(section(page, "Resumo da congregação")).toContainText("1.200");
  await expect(page.getByRole("link", { name: "Abrir gestão de territórios" })).toHaveAttribute("href", "/gestao");
  expect(state.territoryReads).toEqual([]);
});

test("falhas são independentes, permitem nova tentativa e não viram indicadores zerados", async ({ page }) => {
  const state = await setup(page);
  state.failHouses = true;
  state.failTerritories = true;
  state.failRequests = true;
  await page.goto("/dashboard");
  const houses = page.getByLabel("Casas cadastradas", { exact: true });
  await expect(houses.getByRole("alert")).toBeVisible();
  await expect(houses).not.toContainText("1.200");
  await expect(houses.getByText("0", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Solicitações pendentes", { exact: true }).getByRole("alert")).toBeVisible();
  await expect(section(page, "Operação da rodada").getByRole("alert")).toBeVisible();
  await expect(page.getByRole("img", { name: "Progresso da rodada: 60% concluído" })).toBeVisible();
  state.failHouses = false; state.failTerritories = false; state.failRequests = false;
  await houses.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(houses).toContainText("1.200");
  await section(page, "Operação da rodada").getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByLabel("Sem designação ativa", { exact: true })).toContainText("Sem link QA");
  await page.getByLabel("Solicitações pendentes", { exact: true }).getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByLabel("Solicitações pendentes", { exact: true })).toContainText("7");
});

test("falha de rodadas preserva outras métricas e a recuperação seleciona a rodada mais recente", async ({ page }) => {
  const state = await setup(page); state.failRounds = true;
  await page.goto("/dashboard");
  await expect(page.getByLabel("Rodadas abertas", { exact: true }).getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Casas cadastradas", { exact: true })).toContainText("1.200");
  expect(state.territoryReads).toEqual([]);
  state.failRounds = false;
  await page.getByLabel("Rodadas abertas", { exact: true }).getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByLabel("Rodada em andamento", { exact: true })).toHaveValue("5");
  await expect(page.getByLabel("Vencem em até 48 horas", { exact: true })).toContainText("Vence em 24h QA");
});

test("histórico é secundário, carrega sob demanda e permite recuperar falha e ausência de dados", async ({ page }) => {
  const state = await setup(page); state.failHistory = true;
  await page.goto("/dashboard");
  const toggle = page.getByRole("button", { name: "Histórico de marcações por categoria" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(state.historyReads).toBe(0);
  await toggle.click();
  const history = section(page, "Histórico de marcações");
  await expect(history.getByRole("alert")).toBeVisible();
  state.failHistory = false; state.history = [];
  await history.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(history).toContainText("Nenhuma marcação disponível");
  state.history = [{ date: "2029-12-31", Residência: 12 }];
  await page.getByRole("button", { name: "Atualizar painel" }).click();
  await page.clock.resume();
  await expect(history.getByText("Marcações por categoria", { exact: true })).toBeVisible();
  await expect(history).toContainText("não representa o total geral");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("validade dos links e contador de solicitações acompanham atualização sem duplicar o polling", async ({ page }) => {
  const state = await setup(page);
  state.rows[5] = [territory(1, "Quase vencido QA", 0.005)];
  await page.goto("/dashboard");
  await expect(page.getByLabel("Vencem em até 48 horas", { exact: true })).toContainText("Quase vencido QA");
  await expect.poll(() => state.pendingPolls.length).toBe(1);
  await state.pendingPolls.shift()!.fulfill({ json: { cursor: "qa:2", pending: 4 } });
  await expect(page.getByLabel("Solicitações pendentes", { exact: true })).toContainText("4");
  await expect(page.getByRole("link", { name: "Solicitações, 4 pendentes" })).toBeVisible();
  await page.clock.fastForward(31000);
  await expect(page.getByLabel("Sem designação ativa", { exact: true })).toContainText("Quase vencido QA");
  await expect(page.getByLabel("Vencem em até 48 horas", { exact: true })).not.toContainText("Quase vencido QA");
});

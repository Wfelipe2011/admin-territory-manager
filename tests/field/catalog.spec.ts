import { test, expect, Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const fixture = process.env.FIELD_DEMO_FILE
  ? (JSON.parse(readFileSync(process.env.FIELD_DEMO_FILE, "utf8")) as {
      email: string;
      tenantId: number;
      blankTerritoryId: number;
      blankTypeId: number;
      blankName: string;
    })
  : null;
test.use({ actionTimeout: 10000 });
const api = process.env.FIELD_API_URL || "http://localhost:3001/v1";
const enter = async (page: Page, url: string) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Entrar na designação" }).click();
  await expect(page.locator("header")).toBeVisible();
};
async function login(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("E-mail").fill(fixture!.email);
  await page.getByPlaceholder("Senha", { exact: true }).fill("admin123");
  await page.getByRole("button", { name: "ENTRAR", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test("território vazio: link editável, árvore provisória, revisão no Admin, rodada e exclusão de rua", async ({
  page,
  browser,
  request,
}) => {
  test.skip(!fixture, "Execute dev/test-field.sh com a congregação QA local.");
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await page.goto(`/cadastro/territorio/${fixture!.blankTerritoryId}`);
  await page.getByRole("button", { name: "Link para dirigente" }).click();
  await page
    .getByLabel("Dirigente", { exact: true })
    .fill("Dirigente de cadastros QA");
  await page.getByLabel("Validade", { exact: true }).fill("2099-12-31");
  await expect(
    page.getByLabel("Permitir edição de quadras e ruas"),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "Gerar link", exact: true }).click();
  const linkInput = page.getByRole("textbox", { name: "Link para dirigente" });
  await expect(linkInput).toBeVisible();
  const leaderUrl = await linkInput.inputValue();
  expect(leaderUrl).toMatch(/acesso\/[A-Z0-9]{6}$/);
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const field = await mobile.newPage();
  field.on("pageerror", (e) => errors.push(e.message));
  const publisherContext = await browser.newContext({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    await enter(field, leaderUrl);
    await expect(
      field.getByRole("button", { name: "+ Cadastrar quadra", exact: true }),
    ).toHaveCount(0);
    await page.getByLabel("Permitir edição de quadras e ruas").check();
    await expect(
      page.getByText("Permissão atualizada para este link."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await field
      .getByRole("button", { name: "+ Cadastrar quadra", exact: true })
      .click();
    await field.getByLabel("Nome", { exact: true }).fill("Quadra nova QA");
    await field
      .getByLabel("Justificativa", { exact: true })
      .fill("Mapeamento de território vazio");
    await field
      .getByRole("button", { name: "Enviar solicitação", exact: true })
      .click();
    await expect(
      field.getByText(
        "Cadastro em análise · Você já pode cadastrar ruas e casas",
      ),
    ).toBeVisible();
    await field.getByRole("link", { name: "Ver ruas", exact: true }).click();
    await field
      .getByRole("button", { name: "+ Cadastrar rua", exact: true })
      .click();
    await field.getByLabel("Nome", { exact: true }).fill("Rua nova QA");
    await field
      .getByLabel("Justificativa", { exact: true })
      .fill("Rua vinculada à quadra provisória");
    await field
      .getByRole("button", { name: "Enviar solicitação", exact: true })
      .click();
    await field
      .getByRole("button", { name: "Compartilhar", exact: true })
      .click();
    const publisherUrl = (
      await field.getByTestId("share-link").innerText()
    ).trim();
    await field.getByRole("button", { name: "Close", exact: true }).click();
    const publisher = await publisherContext.newPage();
    await enter(publisher, publisherUrl);
    await expect(
      publisher.getByRole("button", { name: "+ Cadastrar rua", exact: true }),
    ).toHaveCount(0);
    await publisher.getByRole("button", { name: /^Rua nova QA / }).click();
    await publisher
      .getByRole("button", { name: "Solicitar alteração", exact: true })
      .click();
    await publisher.getByLabel("Número", { exact: true }).fill("10");
    await publisher
      .getByLabel("Observações", { exact: true })
      .fill("Casa cadastrada pelo publicador");
    await publisher
      .getByRole("button", { name: "Enviar solicitação", exact: true })
      .click();
    let house = publisher.getByRole("button", { name: /^Casa 10,/ });
    await expect(house).toBeEnabled();
    await expect(house.getByLabel("Cadastro em análise")).toBeVisible();
    await house.click();
    await publisher.getByRole("button", { name: "Confirmar", exact: true }).click();
    await expect(house).toHaveAttribute("aria-pressed", "true");
    await page.goto("/gestao/solicitacoes");
    await page
      .getByLabel("Território (ID)", { exact: true })
      .fill(String(fixture!.blankTerritoryId));
    await page.getByRole("heading", { name: "Casa 10", exact: true }).click();
    await page
      .getByRole("button", { name: "Aprovar esta", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar aprovação", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("Aprove primeiro");
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await page
      .getByRole("button", { name: "Aprovar conjunto vinculado", exact: true })
      .click();
    await expect(
      page.getByText("Aprovar 3 solicitações", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Confirmar aprovação", exact: true })
      .click();
    await expect(house).toBeEnabled();
    await expect(house).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await publisher.screenshot({
      path: "../dev/screenshots/catalog-approved-mobile.png",
      fullPage: true,
    });
    await publisher
      .getByRole("button", { name: "Solicitar alteração", exact: true })
      .click();
    await publisher.getByLabel("Tipo de solicitação").selectOption("update");
    await publisher
      .getByLabel("Casa", { exact: true })
      .selectOption({ label: "10 · Residência" });
    await publisher.getByLabel("Número", { exact: true }).fill("12");
    await publisher
      .getByLabel("Observações", { exact: true })
      .fill("Número corrigido em campo");
    await publisher
      .getByRole("button", { name: "Enviar solicitação", exact: true })
      .click();
    await expect(house).toBeEnabled();
    await expect(house).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: "Casa 12", exact: true }),
    ).toBeVisible();
    await page.getByRole("heading", { name: "Casa 12", exact: true }).click();
    await page
      .getByRole("button", { name: "Aprovar esta", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar aprovação", exact: true })
      .click();
    house = publisher.getByRole("button", { name: /^Casa 12,/ });
    await expect(house).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await field.getByRole("button", { name: /^Rua nova QA / }).click();
    await field
      .getByRole("button", { name: "Corrigir rua", exact: true })
      .click();
    await field.getByLabel("Nome", { exact: true }).fill("Rua corrigida QA");
    await field
      .getByLabel("Justificativa", { exact: true })
      .fill("Nome confirmado pela equipe");
    await field
      .getByRole("button", { name: "Enviar solicitação", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Rua Rua corrigida QA", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Aprovar esta", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar aprovação", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Confirmar aprovação", exact: true }),
    ).toHaveCount(0);

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      field.getByRole("button", { name: /^Rua corrigida QA / }),
    ).toHaveAttribute("aria-expanded", "true");
    await field
      .getByRole("button", { name: "Excluir rua", exact: true })
      .click();
    await field
      .getByLabel("Justificativa", { exact: true })
      .fill("Exclusão de fixture QA");
    await field
      .getByRole("button", { name: "Enviar solicitação", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Rua Rua corrigida QA", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Aprovar esta", exact: true })
      .click();
    await expect(
      page.getByText(/1 casas e 1 registros de rodadas serão removidos/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Confirmar aprovação", exact: true }),
    ).toBeDisabled();
    await page
      .getByLabel(
        "Conferi o impacto e confirmo a exclusão das casas e do histórico indicado.",
      )
      .check();
    await page.screenshot({
      path: "../dev/screenshots/request-delete-confirmation.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Confirmar aprovação", exact: true })
      .click();
    await expect(
      publisher.getByRole("button", { name: /^Casa 12,/ }),
    ).toHaveCount(0);
    await expect(
      field.getByText("Nenhuma rua cadastrada nesta quadra."),
    ).toBeVisible();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByLabel("Situação", { exact: true }).selectOption("approved");
    await expect(
      page.getByRole("heading", { name: "Quadra Quadra nova QA", exact: true }),
    ).toBeVisible();
    for (const width of [360, 390, 430, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: "../dev/screenshots/requests-admin-desktop.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
  } finally {
    await mobile.close();
    await publisherContext.close();
  }
});

import { test, expect, Page, Request } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { captureShares, sharedUrl } from './sharing';

const fixture = process.env.FIELD_DEMO_FILE ? JSON.parse(readFileSync(process.env.FIELD_DEMO_FILE, 'utf8')) as {
  tenantId: number; territoryId: number; legacyCode: string; email: string;
} : null;
const api = process.env.FIELD_API_URL || 'http://localhost:3001/v1';
let leaderUrl = '', publisherUrl = '', otherBlockId = 0;
const firstStreet = 'Rua de demonstração 1.1';
const secondStreet = 'Rua de demonstração 1.2';
const streetButton = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} `) });
const streetHouses = (page: Page, name = firstStreet) => page.getByRole('region', { name: `Casas de ${name}`, exact: true });

async function enter(page: Page, url: string) {
  await page.goto(url);
  await expect(page).toHaveURL(/\/campo\//);
  await expect(page.locator('header')).toBeVisible();
}

test.describe.serial('Frontend unificado · ambiente QA local', () => {
  test.beforeEach(async ({ page }) => captureShares(page));
  test.skip(!fixture, 'Execute o seed local e informe FIELD_DEMO_FILE; nunca utilizar uma congregação real.');

  test('administrador gera link curto e mantém sua sessão ao abrir a área de campo', async ({ page, context }) => {
    await page.goto('/login');
    await page.getByPlaceholder('E-mail').fill(fixture!.email);
    await page.getByPlaceholder('Senha', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'ENTRAR', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    const before = (await context.cookies()).find(cookie => cookie.name === 'token')?.value;
    expect(before).toBeTruthy();
    await page.goto('/territories/1');
    await expect(page.getByText('Território de demonstração', { exact: true })).toBeVisible();
    if (await page.getByRole('button', { name: 'Revogar', exact: true }).count()) {
      await page.getByRole('button', { name: 'Revogar', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Revogar', exact: true })).toHaveCount(0);
    }
    await page.getByPlaceholder('Dirigente').fill('Dirigente QA');
    const expires = new Date(); expires.setDate(expires.getDate() + 7);
    await page.locator('input[type="date"]').fill(expires.toISOString().slice(0, 10));
    await page.getByRole('button', { name: 'Gerar link de Território de demonstração' }).click();
    await expect.poll(() => page.evaluate(() => (window as Window & { qaShare?: ShareData }).qaShare?.url)).toMatch(/\/acesso\/[A-Z0-9]{6}$/);
    leaderUrl = await page.evaluate(() => (window as Window & { qaShare?: ShareData }).qaShare!.url!);
    const leader = await context.newPage();
    await enter(leader, leaderUrl);
    await expect(leader.getByRole('heading', { name: 'Território de demonstração', exact: true })).toBeVisible();
    const otherLink = leader.getByRole('article', { name: 'Quadra 2', exact: true }).getByRole('link', { name: 'Ver ruas' });
    otherBlockId = Number((await otherLink.getAttribute('href'))!.split('/').pop());
    expect((await context.cookies()).find(cookie => cookie.name === 'token')?.value).toBe(before);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await leader.close();
  });

  test('dirigente compartilha quadra e interface funciona nas larguras mobile', async ({ page }, testInfo) => {
    await enter(page, leaderUrl);
    await page.getByRole('button', { name: 'Compartilhar Quadra 1', exact: true }).click();
    publisherUrl = await sharedUrl(page);
    expect(publisherUrl).toMatch(/\/acesso\/[A-Z0-9]{6}$/);
    for (const width of [360, 390, 430, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`quadras-qa-${width}.png`), fullPage: true });
    }
    await page.getByRole('button', { name: 'Mapa', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('img', { name: 'Mapa de Território de demonstração' })).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('article', { name: 'Quadra 1', exact: true }).getByRole('link', { name: 'Ver ruas' }).click();
    await expect(page).toHaveURL(/\/quadra\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Quadra 1', exact: true, level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
    expect(await sharedUrl(page)).toBe(publisherUrl);
  });

  test('accordion não faz consultas extras e dois publicadores sincronizam sem perder ruas abertas', async ({ browser }) => {
    const mobile = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
    const contexts = await Promise.all([browser.newContext(mobile), browser.newContext(mobile)]);
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    const polls: string[] = [], active = new Set<Request>(); let maximumActive = 0;
    const syncUpstreams: (string | undefined)[] = [];
    const isPoll = (url: string) => /\/field\/blocks\/\d+\/sync/.test(url);
    pages[0].on('request', req => { if (isPoll(req.url())) { polls.push(req.url()); active.add(req); maximumActive = Math.max(maximumActive, active.size); } });
    pages[0].on('requestfinished', req => active.delete(req));
    pages[0].on('requestfailed', req => active.delete(req));
    pages[0].on('response', response => { if (isPoll(response.url())) syncUpstreams.push(response.headers()['x-territory-upstream']); });
    try {
      await Promise.all(pages.map(async page => {
        await enter(page, publisherUrl);
        await expect(streetButton(page, firstStreet)).toHaveAttribute('aria-expanded', 'false');
        await expect(streetButton(page, secondStreet)).toHaveAttribute('aria-expanded', 'false');
      }));
      const [one, two] = pages;
      await expect.poll(() => polls.length).toBe(2);
      const initialUrl = one.url();
      await streetButton(one, firstStreet).click();
      await streetButton(one, secondStreet).click();
      await streetButton(two, firstStreet).click();
      await expect(streetHouses(one)).toHaveCount(0);
      await expect(streetHouses(one, secondStreet)).toBeVisible();
      await streetButton(one, firstStreet).click();
      await expect(streetHouses(one)).toBeVisible();
      await expect(streetHouses(one, secondStreet)).toHaveCount(0);
      expect(polls).toHaveLength(2);
      expect(one.url()).toBe(initialUrl);
      const columns = await streetHouses(one).evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
      expect(columns).toBe(4);
      const house = streetHouses(one).getByRole('button', { name: /^Casa 102,/ });
      const prior = await house.getAttribute('aria-pressed');
      await expect(streetHouses(one).getByRole('button', { name: /^Casa 104,/ })).toBeDisabled();
      await expect(streetHouses(one).getByLabel('Deixar carta')).toBeVisible();
      const sockets: string[] = [];
      one.on('websocket', socket => { if (socket.url().includes('/socket.io')) sockets.push(socket.url()); });
      const markResponse = one.waitForResponse(response => response.request().method() === 'PATCH' && /\/houses\/\d+$/.test(new URL(response.url()).pathname));
      await house.click(); await one.getByRole('button', { name: 'Confirmar', exact: true }).click();
      // With the local proxy enabled, prove that mutations still reach NestJS.
      // Optional so the same suite remains usable against a direct API endpoint.
      if (process.env.FIELD_EXPECT_PROXY === '1') {
        expect((await markResponse).headers()['x-territory-upstream']).toBe('api');
        expect(syncUpstreams.length).toBeGreaterThan(0);
        expect(syncUpstreams.every(upstream => upstream === 'field-worker')).toBe(true);
      } else {
        await markResponse;
      }
      await expect(streetHouses(two).getByRole('button', { name: /^Casa 102,/ })).toHaveAttribute('aria-pressed', prior === 'true' ? 'false' : 'true');
      await expect(streetButton(one, firstStreet)).toHaveAttribute('aria-expanded', 'true');
      await expect(streetButton(one, secondStreet)).toHaveAttribute('aria-expanded', 'false');
      expect(sockets).toEqual([]);
      await contexts[0].setOffline(true);
      await expect(streetHouses(one).getByRole('button', { name: /^Casa 106,/ })).toBeDisabled();
      await contexts[0].setOffline(false);
      await expect(streetHouses(one).getByRole('button', { name: /^Casa 106,/ })).toBeEnabled();
      await expect(streetHouses(one)).toBeVisible();
      expect(maximumActive).toBe(1);
      for (const width of [360, 390, 430, 1280]) {
        await one.setViewportSize({ width, height: 844 });
        expect(await one.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    } finally { await Promise.all(contexts.map(ctx => ctx.close())); }
  });

  test('publicador solicita inclusão e aprovação administrativa atualiza a rua', async ({ page, request }) => {
    await enter(page, publisherUrl);
    await page.getByRole('button', { name: 'Solicitar alteração' }).click();
    await page.getByRole('dialog', { name: 'Solicitar alteração', exact: true }).getByRole('button', { name: firstStreet, exact: true }).click();
    const number = `QA${Date.now()}`;
    await page.getByLabel('Número', { exact: true }).fill(number);
    await page.getByLabel('Observações', { exact: true }).fill('QA: solicitação automatizada isolada');
    await page.getByRole('button', { name: 'Enviar solicitação', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await streetButton(page, firstStreet).click();
    const house = page.getByRole('button', { name: new RegExp(`^Casa ${number},`) });
    await expect(house).toBeEnabled();
    await expect(house.getByLabel('Cadastro em análise')).toBeVisible();
    const login = await request.post(`${api}/login`, { data: { email: fixture!.email, password: 'admin123' } });
    expect(login.ok()).toBe(true);
    const headers = { Authorization: `Bearer ${(await login.json()).token}` };
    const reports = await (await request.get(`${api}/reports`, { headers })).json() as { id: number; houseId: number; number: string; tenantId: number }[];
    const report = reports.find(report => report.number === number && report.tenantId === fixture!.tenantId);
    expect(report).toBeTruthy();
    expect((await request.post(`${api}/reports/approve/${report!.id}`, { headers })).ok()).toBe(true);
    await expect(house).toBeEnabled();
    expect((await request.delete(`${api}/houses/${report!.houseId}`, { headers })).ok()).toBe(true);
    await expect(house).toHaveCount(0);
  });

  test('preserva UUIDs, rejeita mudança de quadra e encerra acesso revogado', async ({ page, request }) => {
    await page.goto(`/home?s=${fixture!.legacyCode}&p=https://example.invalid`);
    await expect(page).toHaveURL(new RegExp(`/campo/${fixture!.legacyCode}$`));
    await expect(page.getByRole('heading', { name: 'Território de demonstração', exact: true })).toBeVisible();
    await enter(page, publisherUrl);
    const code = new URL(publisherUrl).pathname.split('/').pop()!;
    await page.goto(`/campo/${code}/quadra/${otherBlockId}`);
    await expect(page.getByRole('heading', { name: 'Acesso indisponível' })).toBeVisible();
    await enter(page, publisherUrl);
    const resolved = await request.get(`${api}/signature/${new URL(leaderUrl).pathname.split('/').pop()}`);
    const access = await resolved.json();
    const publisher = await (await request.get(`${api}/signature/${code}`)).json();
    const blockId = publisher.access.blockId;
    const addressId = await page.locator('[data-street-id]').first().getAttribute('data-street-id');
    await page.goto(`/campo/${code}/quadra/${blockId}/rua/${addressId}`);
    await expect(streetButton(page, firstStreet)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('heading', { name: 'Quadra 1', exact: true })).toBeVisible();
    const revoked = await request.delete(`${api}/territories/${fixture!.territoryId}/blocks/${blockId}/signature`, { headers: { Authorization: `Bearer ${access.token}` } });
    expect(revoked.ok()).toBe(true);
    await expect(page.getByRole('heading', { name: 'Acesso indisponível' })).toBeVisible();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { captureShares, sharedUrl } from './sharing';
const fixture = process.env.BLOCK_SIGNATURES_DEMO_FILE ? JSON.parse(readFileSync(process.env.BLOCK_SIGNATURES_DEMO_FILE, 'utf8')) as {
  territoryId: number; blockId: number; blockName: string; rounds: number[]; leaderCodes: string[]; oldCode: string; oldExpirationDate: string;
} : null;
const api = process.env.FIELD_API_URL || 'http://localhost:3001/v1';

test('compartilha nova rodada sem bloquear ou substituir o UUID da rodada anterior', async ({ page, request }, testInfo) => {
  test.skip(!fixture, 'Requer fixture local QA de scripts/seed-block-signatures-demo.ts.');
  await captureShares(page);
  const upstreams: (string | undefined)[] = [];
  page.on('response', response => { if (response.url().includes('/field/sync')) upstreams.push(response.headers()['x-territory-upstream']); });
  await page.goto(`/acesso/${fixture!.leaderCodes[1]}`);
  const card = page.getByRole('article', { name: fixture!.blockName, exact: true });
  await expect(card.getByText('Link ainda não gerado')).toBeVisible();
  const created = page.waitForResponse(response => response.request().method()==='POST' && response.url().includes('/signature'));
  await card.getByRole('button', { name: `Compartilhar ${fixture!.blockName}`, exact: true }).click();
  expect((await created).status()).toBe(201);
  if (process.env.FIELD_EXPECT_PROXY === '1') {
    expect((await created).headers()['x-territory-upstream']).toBe('api');
    expect(upstreams).toContain('field-worker');
  }
  const publisherUrl = await sharedUrl(page);
  const code = new URL(publisherUrl).pathname.split('/').pop()!;
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  expect(code).not.toBe(fixture!.oldCode);
  await expect(card.getByLabel(`Validade do link de ${fixture!.blockName}`)).toContainText('Expira em');
  const posts: string[] = [];
  page.on('request', req => { if (req.method()==='POST' && req.url().includes('/signature')) posts.push(req.url()); });
  await card.getByRole('button', { name: `Compartilhar ${fixture!.blockName}`, exact: true }).click();
  expect(await sharedUrl(page)).toBe(publisherUrl);
  expect(posts).toEqual([]);
  for (const width of [360,390,1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath('links-por-rodada.png'), fullPage: true });
  const old = await request.get(`${api}/signature/${fixture!.oldCode}`);
  expect(old.ok()).toBe(true);
  expect((await old.json()).access).toMatchObject({ round: fixture!.rounds[0], expiresAt: fixture!.oldExpirationDate });
  const current = await request.get(`${api}/signature/${code}`);
  expect((await current.json()).access.round).toBe(fixture!.rounds[1]);
  await page.reload();
  await expect(card.getByLabel(`Validade do link de ${fixture!.blockName}`)).toBeVisible();
  await card.getByRole('button', { name: 'Revogar acesso', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Revogar/, exact: false }).click();
  await expect(card.getByText('Link ainda não gerado')).toBeVisible();
  expect((await request.get(`${api}/signature/${code}`)).status()).toBe(404);
  expect((await request.get(`${api}/signature/${fixture!.oldCode}`)).status()).toBe(200);
});

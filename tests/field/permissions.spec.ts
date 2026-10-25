import { test, expect, Page, Route } from '@playwright/test';
import type { BlockSnapshot, House } from '../../src/features/field/types';

const code = 'QATEST';
const api = process.env.FIELD_API_URL || 'http://localhost:3001/v1';
const instant = new Date('2030-01-01T12:00:00Z');
const house: House = { hasRound: true, registrationStatus: 'approved', pendingRequest: null, id: 1, number: '102', legend: 'Residência', status: false, leaveLetter: false, dontVisit: false, reportType: null, readOnly: false, complement: null, canMark: true, canUnmark: false, blockedReason: null, canUnmarkUntil: null };
function snapshot(houses: House[]): BlockSnapshot {
  const completed = houses.filter(h => h.status).length;
  return {
    workRoundNumber: 1, capabilities: { canEditStructure: false, canReportHouses: true },
    territory: { id: 1, name: 'Território QA de permissões', imageUrl: null },
    roundInfo: { name: 'Rodada QA', theme: 'default', colorPrimary: null, colorSecondary: null },
    tenancy: { name: 'QA', city: 'Sorocaba', state: 'SP', phone: null },
    block: { registrationStatus: 'approved', pendingRequest: null, catalogTotal: houses.length, withoutRound: 0, id: 1, name: 'Quadra QA', completed, pending: houses.length - completed, total: houses.length, lastWorkedAt: null, suggestedPairs: 0, suggestion: '+1 quadra', signature: null },
    streets: [{ registrationStatus: 'approved', pendingRequest: null, mappingId: 1, zipCode: null, total: houses.length, catalogTotal: houses.length, withoutRound: 0, id: 1, name: 'Rua QA', completed, pending: houses.length - completed, firstNumber: houses[0]?.number ?? null, lastNumber: houses.at(-1)?.number ?? null, houses }],
  };
}
const response = (data: BlockSnapshot, cursor = 'qa:1') => ({ cursor, changed: true, data, presence: { total: 1, blocks: { '1': 1 }, streets: {} } });
async function entry(page: Page) {
  await page.route(`${api}/signature/${code}`, route => route.fulfill({ json: { token: 'qa-only', access: { code, role: 'publisher', territoryId: 1, blockId: 1, round: 1, overseer: '', expiresAt: '2031-01-01T00:00:00Z' }, roundInfo: { name: 'Rodada QA', theme: 'default', colorPrimary: null, colorSecondary: null } } }));
  await page.route(`${api}/field/session?**`, route => route.fulfill({ json: { ok: true } }));
  await page.goto(`/acesso/${code}`);
  await page.getByRole('button', { name: /^Rua QA / }).click();
}

test('frontend obedece às permissões recebidas e bloqueia confirmação quando o polling muda a casa', async ({ page }) => {
  await page.clock.install({ time: instant });
  const data = snapshot([{ ...house, canMark: false, blockedReason: 'closed_round' }, { ...house, id: 2, number: '104' }]);
  const waiting: Route[] = []; let writes = 0;
  await page.route(`${api}/field/blocks/1/sync?**`, route => {
    if (new URL(route.request().url()).searchParams.has('cursor')) { waiting.push(route); return; }
    return route.fulfill({ json: response(data) });
  });
  await page.route(`${api}/territories/**`, route => { writes++; return route.fulfill({ status: 403, json: { message: 'Casa indisponível' } }); });
  await entry(page);
  await expect(page.getByRole('button', { name: /^Casa 102,/ })).toBeDisabled();
  await expect(page.getByText('Rodada encerrada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Casa 104,/ }).click();
  await expect(page.getByRole('button', { name: 'Confirmar', exact: true })).toBeEnabled();
  await expect.poll(() => waiting.length).toBe(1);
  const changed = snapshot(data.streets[0].houses.map(h => ({ ...h, canMark: false, blockedReason: 'closed_round' })));
  await waiting.shift()!.fulfill({ json: response(changed, 'qa:2') });
  await expect(page.getByRole('button', { name: 'Confirmar', exact: true })).toBeDisabled();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  expect(writes).toBe(0);
});

test('prazo para desmarcar vence com a tela aberta e atualiza permissões sem alteração de casa', async ({ page }) => {
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(new Date(instant.getTime() + 100));
  let snapshots = 0;
  await page.route(`${api}/field/blocks/1/sync?**`, route => {
    if (new URL(route.request().url()).searchParams.has('cursor')) return;
    snapshots++;
    return route.fulfill({ json: response(snapshot([{ ...house, status: true, canMark: false, canUnmark: snapshots === 1, canUnmarkUntil: new Date(instant.getTime() + 3000).toISOString(), blockedReason: snapshots === 1 ? null : 'unmark_window_expired' }]), `qa:${snapshots}`) });
  });
  await entry(page);
  const button = page.getByRole('button', { name: /^Casa 102,/ });
  await expect(button).toBeEnabled();
  await page.clock.fastForward(4000);
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByText(/O prazo para desmarcar esta casa encerrou/)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Prazo encerrado', { exact: true })).toHaveCount(0);
  await expect(button.getByLabel('Prazo para desmarcar encerrado')).toBeVisible();
  await expect.poll(() => snapshots).toBe(2);
  await expect(page.getByRole('button', { name: /^Rua QA / })).toHaveAttribute('aria-expanded', 'true');
});

test('quadra com 174 casas mantém grade mobile e carrega tudo antes de expandir', async ({ page }) => {
  await page.clock.install({ time: instant });
  const data = snapshot(Array.from({ length: 174 }, (_, index) => ({ ...house, id: index + 1, number: String(index + 1) })));
  let requests = 0; const waiting: Route[] = [];
  await page.route(`${api}/field/blocks/1/sync?**`, route => {
    requests++;
    if (new URL(route.request().url()).searchParams.has('cursor')) { waiting.push(route); return; }
    return route.fulfill({ json: response(data) });
  });
  await entry(page);
  await expect(page.getByRole('region', { name: 'Casas de Rua QA', exact: true }).getByRole('button')).toHaveCount(174);
  await expect.poll(() => requests).toBe(2);
  await page.getByRole('button', { name: /^Rua QA / }).click();
  await page.getByRole('button', { name: /^Rua QA / }).click();
  expect(requests).toBe(2);
  expect(Buffer.byteLength(JSON.stringify(response(data)))).toBeLessThan(128 * 1024);
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => scrollTo(0, 1500));
  const position = await page.evaluate(() => scrollY);
  await expect.poll(() => waiting.length).toBe(1);
  await waiting.shift()!.fulfill({ json: response(snapshot(data.streets[0].houses.map((h, index) => index ? h : { ...h, status: true, canMark: false, canUnmark: true })), 'qa:2') });
  await expect(page.getByRole('button', { name: /^Casa 1,/ })).toHaveAttribute('aria-pressed', 'true');
  expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(2);
  await expect(page.getByRole('button', { name: /^Rua QA / })).toHaveAttribute('aria-expanded', 'true');
});

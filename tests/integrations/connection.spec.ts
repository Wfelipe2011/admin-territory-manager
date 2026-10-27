import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';

const demo = process.env.AGENT_DEMO_FILE ? (JSON.parse(readFileSync(process.env.AGENT_DEMO_FILE, 'utf8')) as { email: string; password: string; congregation: string }[])[0] : null;
const api = process.env.AGENT_API_ORIGIN || 'http://localhost:3001';
test.use({ trace: 'off' }); // OAuth credentials must not enter a recorded network trace.

test('autoriza no navegador, usa MCP e revoga no Admin mantendo as sessões separadas', async ({ page, request }, testInfo) => {
  test.skip(!demo, 'Informe somente a fixture sintética local em AGENT_DEMO_FILE.');
  await expect.poll(async () => (await request.get(`${api}/api`)).status(), { timeout: 30000 }).toBe(200);
  await page.goto('/login');
  await page.getByPlaceholder('E-mail').fill(demo!.email);
  await page.getByPlaceholder('Senha', { exact: true }).fill(demo!.password);
  await page.getByRole('button', { name: 'ENTRAR', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
  const adminToken = (await page.context().cookies()).find(cookie => cookie.name === 'token')!.value;
  const headers = { Authorization: `Bearer ${adminToken}` };
  const before = await (await request.get(`${api}/v1/agent-integrations`, { headers })).json();
  await page.goto('/gestao/integracoes');
  await expect(page.getByRole('heading', { name: 'Integrações com agentes' })).toBeVisible();
  await expect(page.locator('code')).toHaveText(`${api}/mcp`);

  const verifier = randomBytes(32).toString('base64url');
  const callback = 'http://localhost:9191/callback';
  const params = new URLSearchParams({ client_id: 'territorio-digital-dev', response_type: 'code', redirect_uri: callback, scope: 'catalog:read catalog:write offline_access', resource: `${api}/mcp`, state: 'browser-test', code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
  await page.route(`${callback}**`, route => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<h1>Conexão de demonstração autorizada</h1>' }));
  await page.goto(`${api}/oauth/auth?${params}`);
  await page.getByLabel('E-mail', { exact: false }).fill(demo!.email);
  await page.getByLabel('Senha', { exact: false }).fill(demo!.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Autorizar', exact: true })).toBeVisible();
  await expect(page.locator('main')).toContainText(demo!.congregation);
  await page.getByRole('button', { name: 'Autorizar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Conexão de demonstração autorizada' })).toBeVisible();
  const redirect = new URL(page.url());
  expect(redirect.searchParams.get('state')).toBe('browser-test');
  const tokensResponse = await request.post(`${api}/oauth/token`, { form: { grant_type: 'authorization_code', client_id: 'territorio-digital-dev', code: redirect.searchParams.get('code')!, code_verifier: verifier, redirect_uri: callback, resource: `${api}/mcp` } });
  expect(tokensResponse.status()).toBe(200);
  const tokens = await tokensResponse.json();
  const mcpHeaders = { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json, text/event-stream' };
  const context = await request.post(`${api}/mcp`, { headers: mcpHeaders, data: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'connection_context', arguments: {} } } });
  expect(context.status()).toBe(200);
  expect((await context.json()).result.structuredContent.result.congregation).toBe(demo!.congregation);
  expect((await page.context().cookies()).find(cookie => cookie.name === 'token')?.value).toBe(adminToken);

  const after = await (await request.get(`${api}/v1/agent-integrations`, { headers })).json();
  const connection = after.connections.find((row: { id: string }) => !before.connections.some((old: { id: string }) => old.id === row.id));
  expect(connection).toBeTruthy();
  await page.goto('/gestao/integracoes');
  const card = page.locator(`[data-connection-id="${connection.id}"]`);
  await expect(card.getByRole('button', { name: 'Revogar acesso' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('gestao-integracoes.png'), fullPage: true });
  await card.getByRole('button', { name: 'Revogar acesso' }).click();
  await expect(card.getByText('Revogada', { exact: true })).toBeVisible();
  expect((await request.post(`${api}/mcp`, { headers: mcpHeaders, data: {} })).status()).toBe(401);
});

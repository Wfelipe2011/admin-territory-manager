import { test, expect } from '@playwright/test';
import { setup, api, token, instant } from './superadmin-fixture';

test('login encaminha superadmin para visão global e admin comum não acessa a área', async ({ page }) => {
  await setup(page);
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByPlaceholder('E-mail').fill('superadmin@qa.test');
  await page.getByPlaceholder('Senha', { exact: true }).fill('qa-password');
  await page.getByRole('button', { name: 'ENTRAR', exact: true }).click();
  await expect(page).toHaveURL('/superadmin');
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible();
  await page.context().addCookies([{ name: 'token', value: token(false), url: 'http://localhost:4800' }]);
  await page.goto('/superadmin/saude');
  await expect(page).toHaveURL(/\/dashboard\?error=forbidden$/);
});

test('visão geral separa escopos e não inicia polling de solicitações da congregação', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/superadmin');
  await expect(page.getByLabel('Período', { exact: true })).toHaveValue('7d');
  await expect(page.getByLabel('Congregações com atividade', { exact: true })).toContainText('9');
  await expect(page.getByLabel('Solicitações pendentes', { exact: true })).toContainText('24');
  await expect(page.getByLabel('Dispositivos online agora', { exact: true })).toContainText('8');
  await expect(page.getByLabel('Solicitações para revisar', { exact: true }).locator('li')).toHaveCount(5);
  await expect(page.getByLabel('Sem atividade registrada', { exact: true })).not.toContainText('Congregação QA 4');
  const originalCookie = (await page.context().cookies()).find(cookie => cookie.name === 'token')!.value;
  await page.getByLabel('Congregação', { exact: true }).selectOption('2');
  await expect(page.getByLabel('Casas aprovadas', { exact: true })).toContainText('1.200');
  await expect(page.getByLabel('Congregações com atividade', { exact: true })).toContainText('de 1');
  expect((await page.context().cookies()).find(cookie => cookie.name === 'token')!.value).toBe(originalCookie);
  expect(state.writes).toEqual([]);
  expect(state.unexpected).toEqual([]);
});

test('filtros cancelam consultas anteriores e falhas conservam os valores da mesma seleção', async ({ page }) => {
  const state = await setup(page);
  let delayed: import('@playwright/test').Route | undefined;
  await page.route(`${api}/dashboard/usage?**`, route => {
    if (new URL(route.request().url()).searchParams.get('tenantId') === '2') { delayed = route; return; }
    return route.fallback();
  });
  await page.goto('/superadmin');
  await expect(page.getByLabel('Casas aprovadas', { exact: true })).toContainText('21.600');
  await page.getByLabel('Congregação', { exact: true }).selectOption('2');
  await expect.poll(() => !!delayed).toBe(true);
  await expect(page.getByLabel('Casas aprovadas', { exact: true })).toHaveCount(0);
  await page.getByLabel('Congregação', { exact: true }).selectOption('1');
  await expect(page.getByLabel('Casas aprovadas', { exact: true })).toContainText('1.200');
  await delayed!.fulfill({ json: {} }).catch(() => {});
  state.failUsage = true;
  await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Últimos valores preservados');
  await expect(page.getByLabel('Casas aprovadas', { exact: true })).toContainText('1.200');
  await expect(page.getByLabel('Saúde do sistema', { exact: true })).toContainText('Operacional');
});

test('pausa não consulta e retomada atualiza; datas inválidas não consultam a API', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/superadmin');
  await expect(page.getByLabel('Casas aprovadas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const before = state.usageReads;
  await page.clock.fastForward(61000);
  expect(state.usageReads).toBe(before);
  await page.getByRole('button', { name: 'Retomar', exact: true }).click();
  await expect.poll(() => state.usageReads).toBeGreaterThan(before);
  await page.getByLabel('Período', { exact: true }).selectOption('custom');
  const custom = state.usageReads;
  await expect(page.locator('main').getByRole('alert')).toContainText('Informe início e fim válidos');
  await page.getByLabel('De', { exact: true }).fill('2030-01-02T10:00');
  await page.getByLabel('Até', { exact: true }).fill('2030-01-01T10:00');
  expect(state.usageReads).toBe(custom);
});

test('lista pagina e filtra sem nova consulta; formulário salva cadastro e exibe erros', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/superadmin/congregacoes');
  const list = page.getByLabel('Lista de congregações', { exact: true });
  await expect(list.getByRole('article')).toHaveCount(15);
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await expect(list.getByRole('article')).toHaveCount(3);
  await page.getByLabel('Buscar nome ou localidade', { exact: true }).fill('Congregação QA 1');
  await page.getByLabel('UF', { exact: true }).selectOption('SP');
  const before = state.usageReads;
  await page.getByLabel('Ordenar', { exact: true }).selectOption('name');
  expect(state.usageReads).toBe(before);
  await list.getByRole('button', { name: 'Editar Congregação QA 1', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Editar congregação' });
  await dialog.getByLabel('Nome', { exact: true }).fill('Congregação QA editada');
  state.failedSave = true;
  await dialog.getByRole('button', { name: 'Salvar cadastro', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Cadastro inválido QA');
  state.failedSave = false;
  await dialog.getByRole('button', { name: 'Salvar cadastro', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.writes.at(-1)).toMatchObject({ method: 'PATCH', path: 'admin/tenants/1', body: { name: 'Congregação QA editada' } });
});

test('acessar usa o POST existente, substitui token e recarrega a gestão selecionada', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/superadmin/congregacoes');
  await page.getByLabel('Lista de congregações', { exact: true }).getByRole('button', { name: 'Acessar Congregação QA 2', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Gestão de', { exact: false }).first()).toContainText('Congregação QA 2');
  expect(state.writes).toEqual([{ method: 'POST', path: 'admin/tenants/switch', body: { tenantId: 2 } }]);
  expect((await page.context().cookies()).find(cookie => cookie.name === 'token')!.value).toBe(token(true, 2));
});

test('saúde separa polling e preserva histórico quando a consulta técnica falha', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/superadmin/saude');
  await expect(page.getByLabel('Latência p95', { exact: true })).toContainText('250 ms');
  await expect(page.getByLabel('Long polling', { exact: true })).toContainText('24,9 s');
  state.monitor.collection.error = 'Histórico indisponível QA';
  state.monitor.summary = { ...state.monitor.summary, requests: 0, p95Ms: null };
  state.monitor.services.worker.state = 'degraded'; state.monitor.services.worker.detail = 'Listener desconectado';
  await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Histórico indisponível QA');
  await expect(page.getByLabel('Latência p95', { exact: true })).toContainText('250 ms');
  await expect(page.getByLabel('Worker Bun', { exact: true })).toContainText('Degradado');
  state.failMonitoring = true;
  await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
  await expect(page.locator('main').getByRole('alert').first()).toContainText('Servidor indisponível');
  await expect(page.getByLabel('Estado dos serviços', { exact: true })).toContainText('Sem medição');
});

test('três telas responsivas em cinco larguras, com capturas e sem erros de execução', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await setup(page, 5);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const [path, name] of [['/superadmin', 'visao-geral'], ['/superadmin/congregacoes', 'congregacoes'], ['/superadmin/saude', 'saude-tecnica']]) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: 'Atualizar', exact: true })).toBeEnabled();
    await expect(page.getByText('Carregando indicadores…')).toHaveCount(0);
    await page.addStyleTag({ content: 'nextjs-portal {display:none!important}' });
    for (const width of [360, 390, 430, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath(`${name}-${width}.png`), fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});

import { test, expect } from '@playwright/test';

test('informações públicas abrem sem sessão e os links navegam entre as páginas', async ({ page }) => {
  await page.goto('/integracoes');
  await expect(page.getByRole('heading', { name: 'Seu cadastro de territórios, conectado ao seu agente.' })).toBeVisible();
  for (const [link, title] of [['Privacidade', 'Privacidade da integração'], ['Termos de uso', 'Termos de uso da integração'], ['Suporte', 'Suporte da integração']]) {
    await page.getByRole('navigation', { name: 'Informações da integração' }).getByRole('link', { name: link, exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByText('Wilson Felipe da Silva', { exact: false }).first()).toBeVisible();
    expect(new URL(page.url()).pathname).not.toBe('/login');
  }
  await expect(page.getByRole('link', { name: 'Entrar em contato pelo WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa.me\/5515981785706/);
});

test('mantém gestão privada e páginas informativas públicas mesmo com cookie inválido', async ({ page, context }) => {
  await context.addCookies([{ name: 'token', value: 'invalid-token', url: 'http://localhost:4800' }]);
  await page.goto('/integracoes/privacidade');
  await expect(page.getByRole('heading', { name: 'Privacidade da integração' })).toBeVisible();
  await page.goto('/gestao/integracoes');
  await expect(page).toHaveURL(/\/login/);
});

for (const width of [360, 1280]) {
  test(`páginas públicas permanecem legíveis em ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/integracoes', '/integracoes/privacidade', '/integracoes/termos', '/integracoes/suporte']) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.goto('/integracoes');
    await page.screenshot({ path: testInfo.outputPath(`integracoes-${width}.png`), fullPage: true });
  });
}

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/field', fullyParallel: false, workers: 1, timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.FIELD_BASE_URL || 'http://localhost:4800',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] },
  },
});

import { defineConfig } from '@playwright/test';
export default defineConfig({
  outputDir: './test-results-integrations',
  testDir: './tests/integrations', workers: 1, timeout: 45000,
  use: { baseURL: process.env.INTEGRATIONS_BASE_URL || 'http://localhost:4800', trace: 'retain-on-failure', screenshot: 'only-on-failure', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] } },
});

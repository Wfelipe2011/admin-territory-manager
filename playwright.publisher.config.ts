import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/publisher",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  outputDir: "test-results/publisher",
  expect: { timeout: 12000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/publisher" }],
  ],
  webServer: process.env.PUBLISHER_BASE_URL
    ? undefined
    : {
        command: "npx next start -p 4815",
        url: "http://localhost:4815/publicador",
        reuseExistingServer: false,
        timeout: 60000,
      },
  use: {
    baseURL: process.env.PUBLISHER_BASE_URL || "http://localhost:4815",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "android-chromium",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium",
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
            "/usr/bin/google-chrome",
          args: ["--no-sandbox"],
        },
      },
    },
    {
      name: "iphone-webkit",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
  ],
});

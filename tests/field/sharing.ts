import { expect, type Page } from "@playwright/test";

export async function captureShares(page: Page) {
  await page.addInitScript(() => {
    const state = window as Window & {
      qaShare?: ShareData;
      qaShares?: ShareData[];
      qaCancelShare?: boolean;
      qaCopied?: string;
    };
    Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (input: ShareData) => {
        state.qaShare = input;
        (state.qaShares ??= []).push(input);
        if (state.qaCancelShare) throw new DOMException("Cancelado", "AbortError");
      },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => { state.qaCopied = text; } },
    });
  });
}

export async function sharedUrl(page: Page) {
  await expect.poll(() => page.evaluate(() => (window as Window & { qaShare?: ShareData }).qaShare?.url)).toMatch(/\/acesso\/[A-Z0-9]{6}$/);
  return page.evaluate(() => (window as Window & { qaShare?: ShareData }).qaShare!.url!);
}

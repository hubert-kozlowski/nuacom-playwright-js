import { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const BASE_URL = 'https://nuacom.ie/';

/**
 * Block the HubSpot chat widget iframe at the network level before navigation.
 * In WebKit especially, the chat iframe renders over clickable elements and
 * intercepts pointer events — blocking it prevents that entirely.
 */
export async function blockChatWidget(page: Page): Promise<void> {
  await page.route('**hubspot-conversations-iframe**', route => route.abort()).catch(() => {});
  await page.route('**/conversations-visitor/**', route => route.abort()).catch(() => {});
}

/**
 * Dismiss cookie banners and HubSpot overlays so they never intercept clicks.
 * Safe to call multiple times — all operations are guarded.
 */
export async function dismissOverlays(page: Page): Promise<void> {
  if (page.isClosed()) return;

  // Cookie banner — try each label in order of preference
  for (const text of ['Reject All', 'Accept All', 'Accept']) {
    const btn = page.locator(`button:has-text("${text}")`).first();
    if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.locator('.onetrust-pc-dark-filter')
        .waitFor({ state: 'hidden', timeout: 5_000 })
        .catch(() => {});
      break;
    }
  }

  // Nuke all known overlays via JS — belt and braces
  await page.evaluate(() => {
    [
      '.onetrust-pc-dark-filter',
      '#onetrust-consent-sdk',
      '#hubspot-messages-iframe-container',
      '#hubspot-conversations-iframe',
      '[data-test-id="chat-widget-iframe"]',
    ].forEach(sel =>
      document.querySelectorAll(sel).forEach(el => {
        (el as HTMLElement).style.cssText += ';display:none!important;pointer-events:none!important;';
      })
    );
    if ((window as any).HubSpotConversations?.widget) {
      try { (window as any).HubSpotConversations.widget.close(); } catch {}
    }
  }).catch(() => {});
}

/**
 * Navigate to a URL and wait until the page is ready for interaction.
 * Blocks the HubSpot chat widget at the network level before navigating,
 * then dismisses any remaining overlays after load.
 */
export async function gotoReady(page: Page, url: string, options: { timeout?: number } = {}): Promise<void> {
  const { timeout = 60_000 } = options;
  await blockChatWidget(page);
  await page.goto(url, { waitUntil: 'commit', timeout });

  // Wait for the page to stop firing network requests rather than using
  // domcontentloaded — on JS-heavy sites domcontentloaded fires long before
  // third-party scripts have settled, which is when overlay races happen
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await expect(page).toHaveTitle(/Nuacom/i, { timeout: 10_000 });
  await dismissOverlays(page);
}

/**
 * Click the "Get a Quote" button and wait for the HubSpot modal to open.
 *
 * The button has an href="/pricing" as a no-JS fallback — we abort that
 * route to prevent the page navigating away before HubSpot's JS handler fires.
 * Retries up to 6 times with overlay dismissal between each attempt.
 */
export async function openQuoteModal(page: Page): Promise<void> {
  await page.waitForFunction(
    () => typeof (window as any).hbspt !== 'undefined',
    { timeout: 20_000 }
  ).catch(() => {});

  const freeQuoteButton = page.locator('a.cta_new[title="Get a Quote"]');
  await freeQuoteButton.scrollIntoViewIfNeeded().catch(() => {});
  await dismissOverlays(page);

  // Abort the /pricing fallback so a pre-JS-ready click doesn't navigate away
  await page.route('**/pricing**', route => route.abort()).catch(() => {});

  const modal = page.locator('.modal.show, .modal.hs-form-modal.show');
  let opened = false;

  for (let attempt = 1; attempt <= 6; attempt++) {
    if (page.isClosed()) break;
    await dismissOverlays(page);
    await freeQuoteButton.click({ force: true }).catch(() => {});

    opened = await modal.first()
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (opened) break;
    if (!page.isClosed()) await page.waitForTimeout(2_000);
  }

  expect(opened, 'HubSpot quote modal did not open after 6 click attempts').toBe(true);
  await expect(modal.first()).toBeVisible({ timeout: 5_000 });
}
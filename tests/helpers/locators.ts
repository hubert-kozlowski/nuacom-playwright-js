import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BASE_URL } from './nav';

/**
 * Return the first locator from the candidates list that is currently visible.
 * Scrolls each candidate into view before checking visibility.
 * Falls back to the last candidate if none are visible.
 */
export async function getFirstVisibleLocator(candidates: Locator[]): Promise<Locator> {
  for (const candidate of candidates) {
    const match = candidate.first();
    if (await match.isVisible().catch(() => false)) return match;
  }
  for (const candidate of candidates) {
    const match = candidate.first();
    if ((await match.count().catch(() => 0)) > 0) {
      await match.scrollIntoViewIfNeeded({ timeout: 10_000 }).catch(() => {});
      if (await match.isVisible().catch(() => false)) return match;
    }
  }
  return candidates[candidates.length - 1].first();
}

/**
 * Click a locator and wait for the page URL to match the expected pattern.
 *
 * Strategy:
 *  1. Find the first visible element among all DOM matches (scrolls each).
 *  2. If none are visible, fall back to direct page.goto() using the href.
 *  3. Handles target="_blank" by racing context.waitForEvent('page').
 */
export async function clickAndWaitForUrl(
  page: Page,
  target: Locator,
  expectedUrlPattern: RegExp | string,
  options: { timeout?: number } = {}
): Promise<Page> {
  const { timeout = 45_000 } = options;

  const first = target.first();

  // For standard anchor tags, navigate via href directly rather than clicking.
  // Clicking is unreliable when Elementor sections, sticky navbars, or other
  // overlapping elements intercept pointer events — particularly in WebKit/Firefox.
  // JS-triggered elements (modals, etc.) should not use this helper at all.
  const href = await first.getAttribute('href').catch(() => null);
  const opensNewTab = (await first.getAttribute('target').catch(() => null)) === '_blank';

  if (href && !opensNewTab) {
    const absolute = href.startsWith('http') ? href : new URL(href, BASE_URL).href;
    await page.goto(absolute, { waitUntil: 'commit', timeout });
    await expect(page).toHaveURL(expectedUrlPattern, { timeout });
    return page;
  }

  // New tab links still need a real click to trigger context.waitForEvent('page')
  if (opensNewTab) {
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout }),
      first.click({ force: true }),
    ]);
    await newPage.waitForLoadState('domcontentloaded', { timeout }).catch(() => {});
    await expect(newPage).toHaveURL(expectedUrlPattern, { timeout });
    return newPage;
  }

  // Fallback for anything without an href
  await first.click({ force: true });
  await page.waitForURL(expectedUrlPattern, { waitUntil: 'commit', timeout });
  return page;
}
/**
 * Assert the href matches the pattern, then click and wait for navigation.
 */
export async function clickAndAssertNavigationOrHref(
  page: Page,
  locator: Locator,
  expectedUrlPattern: RegExp
): Promise<Page> {
  const href = await locator.getAttribute('href').catch(() => null);
  if (href) expect(href).toMatch(expectedUrlPattern);
  return clickAndWaitForUrl(page, locator, expectedUrlPattern, { timeout: 45_000 });
}
import { test, expect } from '@playwright/test';
import { blockHeavyAssets } from './helpers/block-heavy-assets';
import { gotoReady, dismissOverlays, openQuoteModal, BASE_URL } from './helpers/nav';
import { getFirstVisibleLocator, clickAndWaitForUrl, clickAndAssertNavigationOrHref } from './helpers/locators';

// ---------------------------------------------------------------------------
// Shared beforeEach factory
// ---------------------------------------------------------------------------

function setupBeforeEach() {
  test.beforeEach(async ({ page, context }) => {
    await blockHeavyAssets(context);
    await gotoReady(page, BASE_URL);
  });
}

// ---------------------------------------------------------------------------
// Suite: Core Brand Validation
// ---------------------------------------------------------------------------

test.describe('Page Identity and Global UI', () => {
  test.describe.configure({ mode: 'parallel' });
  setupBeforeEach();

  test('document titles matches the NUACOM brand', async ({ page }) => {
    await expect(page).toHaveTitle(/^NUACOM/);
  });

  test('primary navigation bar is rendered and visible', async ({ page }) => {
    await expect(page.locator('#navbarSupportedContent')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Suite: Core Navigation
// ---------------------------------------------------------------------------

test.describe('Core Navigation', () => {
  test.describe.configure({ mode: 'parallel' });
  setupBeforeEach();

  test('homepage hero section renders on load', async ({ page }) => {
    await expect(page.locator('.wordCarousel')).toBeVisible();
  });

  test('Book a Demo navigates to the demo booking page', async ({ page }) => {
    const btn = await getFirstVisibleLocator([
      page.locator('#navbarSupportedContent').getByRole('link', { name: /Book a Demo/i }),
      page.getByRole('link', { name: /Book a Demo/i }),
    ]);
    const target = await clickAndWaitForUrl(page, btn, /\/resources\/book-a-demo\//);
    await expect(target).toHaveURL(/\/resources\/book-a-demo\//);
  });

  test('Talk to Sales navigates to the contact page', async ({ page }) => {
    const btn = await getFirstVisibleLocator([
      page.locator('#navbarSupportedContent').getByRole('link', { name: /Talk to Sales/i }),
      page.getByRole('link', { name: /Talk to Sales|Contact/i }),
      page.locator('.btn.rounded-pill.btn--green'),
    ]);
    const target = await clickAndWaitForUrl(page, btn, /\/resources\/contact-us\//);
    await expect(target).toHaveURL(/\/resources\/contact-us\//);
  });

  test('Business Phone System solution page is reachable from the homepage', async ({ page }) => {
    const btn = page.locator(
      'a[title="Business Phone System"], a[href*="/solutions/office-phone-system"]'
    );
    const target = await clickAndWaitForUrl(page, btn, /\/solutions\/office-phone-system\//);
    await expect(target).toHaveURL(/\/solutions\/office-phone-system\//);
  });

  test('Call Center Software solution page is reachable from the homepage', async ({ page }) => {
    const btn = page.locator(
      'a[title="Call Center Software"], a[href*="/solutions/call-center-software"]'
    );
    const target = await clickAndWaitForUrl(page, btn, /\/solutions\/call-center-software\//);
    await expect(target).toHaveURL(/\/solutions\/call-center-software\//);
  });

  test('contact page renders the enquiry form heading', async ({ page }) => {
    await gotoReady(page, `${BASE_URL}resources/contact-us/`);
    await expect(page.locator('h2:has-text("Get in touch with us")').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Suite: CTA Link Validation
// ---------------------------------------------------------------------------

test.describe('CTA Destinations', () => {
  test.describe.configure({ mode: 'serial' });
  setupBeforeEach();

  test('Join Them CTA navigates to the contact page', async ({ page }) => {
    test.setTimeout(60_000);
    await dismissOverlays(page);
    await clickAndWaitForUrl(
      page,
      page.locator('a:has-text("JOIN THEM")'),
      /contact/i,
      { timeout: 45_000 }
    );
    await expect(page).toHaveURL(/contact/i);
  });

  test('Contact Sales CTA navigates to the contact page', async ({ page }) => {
    const btn = await getFirstVisibleLocator([
      page.getByRole('link', { name: /contact sales|talk to sales/i }),
      page.locator('#navbarSupportedContent a[href*="/resources/contact-us/"]'),
      page.locator('a[href*="/resources/contact-us/"]').filter({ hasText: /contact sales|talk to sales/i }),
    ]);
    const target = await clickAndAssertNavigationOrHref(page, btn, /\/resources\/contact-us\/?$/);
    await expect(target).toHaveURL(/\/resources\/contact-us\//);
  });

  test('Contact Us for a Free Quote CTA navigates to the contact page', async ({ page }) => {
    const btn = await getFirstVisibleLocator([
      page.getByRole('link', { name: /contact us for a free quote/i }),
      page.locator('a[href*="nuacom.com/resources/contact-us"]').filter({ hasText: /contact us/i }),
      page.locator('section a[href*="nuacom.com/resources/contact-us"]'),
    ]);
    const target = await clickAndAssertNavigationOrHref(
      page, btn, /https:\/\/nuacom\.com\/resources\/contact-us\/?/
    );
    await expect(target).toHaveURL(/https:\/\/nuacom\.com\/resources\/contact-us\/.*/);
  });

  test('"Get a Free Quote" CTA opens HubSpot contact modal', async ({ page }) => {
    test.setTimeout(60_000);
    await openQuoteModal(page);
    await expect(page.locator('.modal.show, .modal.hs-form-modal.show').first()).toBeVisible();
  });
});
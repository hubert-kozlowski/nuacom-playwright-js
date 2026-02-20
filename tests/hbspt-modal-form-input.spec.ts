import { test, expect } from '@playwright/test';
import { blockHeavyAssets } from './helpers/block-heavy-assets';
import { gotoReady, openQuoteModal, BASE_URL } from './helpers/nav';

test.setTimeout(90_000);

test.describe('HubSpot Contact Modal - Form Field Input', () => {
  test.beforeEach(async ({ page, context }) => {
    await blockHeavyAssets(context);
    await gotoReady(page, BASE_URL);
  });

  test('all required fields accept and retain valid user input', async ({ page }) => {
    await openQuoteModal(page);

    // All fields live inside iframe#hs-form-iframe-1 — not in the main DOM.
    // page.evaluate() or page.locator() will never find them.
    const frame = page.frameLocator('iframe#hs-form-iframe-1');

    // Wait for the iframe to finish rendering before touching anything
    await frame.locator('input[name="firstname"]').waitFor({ state: 'visible', timeout: 20_000 });

    // Name
    await frame.locator('input[name="firstname"]').fill('Jane');
    await expect(frame.locator('input[name="firstname"]')).toHaveValue('Jane');
    await expect(frame.locator('input[name="firstname"]')).toHaveJSProperty('value', 'Jane');

    // Last name
    await frame.locator('input[name="lastname"]').fill('Smith');
    await expect(frame.locator('input[name="lastname"]')).toHaveValue('Smith');
    await expect(frame.locator('input[name="lastname"]')).toHaveJSProperty('value', 'Smith');

    // Phone number — +353 prefix is pre-set by the Ireland country selector
    await frame.locator('input[type="tel"]').fill('+353 871234567');
    await expect(frame.locator('input[type="tel"]')).toHaveValue('+353 871234567');
    await expect(frame.locator('input[type="tel"]')).toHaveJSProperty('value', '+353 871234567');

    // Business email
    await frame.locator('input[type="email"]').fill('jane.smith@gmail.com');
    await expect(frame.locator('input[type="email"]')).toHaveValue('jane.smith@gmail.com');
    await expect(frame.locator('input[type="email"]')).toHaveJSProperty('value', 'jane.smith@gmail.com');

    // Number of users needed — native <select>
    await frame.locator('select[name="projected_users"]').selectOption('6 to 10');
    await expect(frame.locator('select[name="projected_users"]')).toHaveValue('6 to 10');

    // Company name
    await frame.locator('input[name="company"]').fill('Smith Enterprises');
    await expect(frame.locator('input[name="company"]')).toHaveValue('Smith Enterprises');
    await expect(frame.locator('input[name="company"]')).toHaveJSProperty('value', 'Smith Enterprises');
  });
});
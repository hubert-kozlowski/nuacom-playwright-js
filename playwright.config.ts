import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const AUTH_DIR = path.resolve(__dirname, 'playwright/.auth');

function storageState(browserName: string): string {
  return path.join(AUTH_DIR, `nuacom-storage.${browserName}.json`);
}

export default defineConfig({
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : undefined, // 3, one per browser, to avoid contention on the storage state files
  reporter: 'html',

  use: {
    baseURL: 'https://nuacom.ie/',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // ── Setup projects (one per browser) ───────────────────────────────────
    // Each runs auth.setup.ts and writes its own storage state file.
    {
      name: 'chromium-setup',
      testMatch: /auth\.setup\.[jt]s/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-setup',
      testMatch: /auth\.setup\.[jt]s/,
      use: { ...devices['Desktop Firefox'] },
    },
     {
       name: 'webkit-setup',
       testMatch: /auth\.setup\.[jt]s/,
       use: { ...devices['Desktop Safari'] },
     },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: storageState('chromium'),
      },
      dependencies: ['chromium-setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: storageState('firefox'),
      },
      dependencies: ['firefox-setup'],
    },
     {
       name: 'webkit',
       use: {
         ...devices['Desktop Safari'],
         storageState: storageState('webkit'),
       },
       dependencies: ['webkit-setup'],
     },
  ],
});
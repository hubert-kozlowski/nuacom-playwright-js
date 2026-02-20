import * as fs from 'fs';
import * as path from 'path';
import { test } from '@playwright/test';
import { blockHeavyAssets } from './helpers/block-heavy-assets';
import { gotoReady, BASE_URL } from './helpers/nav';

const AUTH_DIR = path.resolve(__dirname, '../playwright/.auth');

function storageStatePath(browserName: string): string {
  return path.join(AUTH_DIR, `nuacom-storage.${browserName}.json`);
}

test('captures consent storage state for NUACOM session readiness', async ({
  page,
  context,
  browserName,
}) => {
  test.setTimeout(90_000);
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await blockHeavyAssets(context);
  await gotoReady(page, BASE_URL);
  const outputPath = storageStatePath(browserName);
  await context.storageState({ path: outputPath });
  console.log(`Storage state saved for [${browserName}] → ${outputPath}`);
});
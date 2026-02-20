import * as path from 'path';
import * as fs from 'fs';
import { BrowserContext } from '@playwright/test';

const HAR_DIR = path.resolve(__dirname, '../../playwright/.har-cache');

/**
 * Call once per context, before page.goto().
 * On first run it records to a HAR file; on subsequent runs it replays from it.
 */
export async function useNetworkCache(context: BrowserContext, name: string): Promise<void> {
  fs.mkdirSync(HAR_DIR, { recursive: true });
  const harPath = path.join(HAR_DIR, `${name}.har`);
  const exists = fs.existsSync(harPath);

  if (exists) {
    // Replay from cache — no real network needed for cached routes
    await context.routeFromHAR(harPath, {
      notFound: 'fallback', // fall through to network for anything not cached
      update: false,
    });
  } else {
    // Record mode — save everything to HAR for future replays
    await context.routeFromHAR(harPath, {
      notFound: 'fallback',
      update: true,  // record new responses
    });
  }
}

/**
 * Force re-record by deleting the HAR file for a given name.
 */
export function invalidateCache(name: string): void {
  const harPath = path.join(HAR_DIR, `${name}.har`);
  if (fs.existsSync(harPath)) fs.unlinkSync(harPath);
}
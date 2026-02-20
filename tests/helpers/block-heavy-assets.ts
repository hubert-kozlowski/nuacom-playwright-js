import { BrowserContext } from 'playwright';

export async function blockHeavyAssets(context: BrowserContext): Promise<void> {

  // Block all third-party JS that isn't needed for the tests to function.
  // This is the primary fix for timing inconsistency — these scripts fire
  // unpredictably and race against clicks, navigation, and overlay dismissal.
  await context.route(
    new RegExp(
      '^https?:\\/\\/(www\\.)?(' +
        [
          'googletagmanager\\.com',
          'google-analytics\\.com',
          'googlesyndication\\.com',
          'doubleclick\\.net',
          'connect\\.facebook\\.net',
          'px\\.ads\\.linkedin\\.com',
          'snap\\.licdn\\.com',
          'bat\\.bing\\.com',
          'hotjar\\.com',
          'clarity\\.ms',
          'cdn\\.segment\\.com',
          'cdn\\.amplitude\\.com',
          'sentry\\.io',
          'fullstory\\.com',
          'mouseflow\\.com',
          'tr\\.snapchat\\.com',
          'cdn\\.cookielaw\\.org',
          'cdn\\.onetrust\\.com',
          'geolocation\\.onetrust\\.com',
          'tawk\\.to',
          'livechatinc\\.com',
          'crisp\\.chat',
          'drift\\.com',
          'static\\.zdassets\\.com'
        ].join('|') +
      ')',
      'i'
    ),
    (route: any) => route.abort()
  );

  // Block static assets that add load time without affecting test assertions
  await context.route(
    /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?|mp4|webm|ogg|avi|mov|wmv|flv|mkv|mp3|wav|flac|aac|woff2?|ttf|eot|otf|pdf)(\?.*)?$/i,
    route => {
      const hostname = new URL(route.request().url()).hostname;
      const isHubSpotForm = ['forms.hsforms.com', 'js.hs-forms.com', 'js.hsforms.net', 'js.hs-scripts.com']
        .some(h => hostname === h || hostname.endsWith(`.${h}`));
      return isHubSpotForm ? route.continue() : route.abort();
    }
  );
}
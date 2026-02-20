# Playwright Test Suite

### NUACOM Website · End-to-End Testing

---

## Overview

This document covers the key decisions, problems encountered, and solutions applied during the development of the NUACOM Playwright test suite. It is intended to serve as a reference for anyone working on or reviewing this codebase, and as a record of the reasoning behind non-obvious implementation choices.

The suite covers homepage identity, core navigation, CTA destinations, and HubSpot contact modal form input — across Chromium, Firefox, and WebKit.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [HubSpot iframe — The Core Challenge](#2-hubspot-iframe--the-core-challenge)
3. [The Pricing Fallback Navigation Problem](#3-the-pricing-fallback-navigation-problem)
4. [HubSpot Chat Widget Intercepting Clicks](#4-hubspot-chat-widget-intercepting-clicks)
5. [Cross-Browser Timing Differences](#5-cross-browser-timing-differences)
6. [Test Timeouts and Trace Recording Overhead](#6-test-timeouts-and-trace-recording-overhead)
7. [blockHeavyAssets and the HubSpot Whitelist Conflict](#7-blockheavyassets-and-the-hubspot-whitelist-conflict)
8. [Helper Consolidation and Code Architecture](#8-helper-consolidation-and-code-architecture)
9. [Test Naming Conventions](#9-test-naming-conventions)
10. [When to Split Test Files](#10-when-to-split-test-files)

---

## 1. Project Structure

```
tests/
  nuacom.spec.ts                    # Core navigation and CTA tests
  hbspt-modal-form-input.spec.ts    # HubSpot modal form field input tests
  auth.setup.ts                     # Storage state capture (cookies/consent)
  helpers/
    nav.ts                          # gotoReady, dismissOverlays, openQuoteModal
    locators.ts                     # getFirstVisibleLocator, clickAndWaitForUrl
    block-heavy-assets.ts           # Network-level blocking of heavy third parties
    network-cache.ts                # HAR-based request caching utility
```

The helper separation is intentional — any function used across more than one spec file lives in a helper. Spec files contain only test logic.

---

## 2. HubSpot iframe — The Core Challenge

### What happened

The initial implementation tried to interact with the HubSpot contact modal form fields using `page.evaluate()` and `page.locator()` — querying the main document. Every field check returned empty or failed silently. No fields could be found, filled, or asserted against.

### Why it failed

HubSpot renders its forms inside an `<iframe>`:

```html
<iframe id="hs-form-iframe-1" class="hs-form-iframe" ...></iframe>
```

Iframes are isolated browsing contexts. The main page DOM and the iframe DOM are completely separate. `page.locator()` only searches the top-level document — it has no visibility into any iframe's contents. `page.evaluate()` similarly runs in the main frame.

This is a fundamental browser security boundary, not a Playwright limitation.

### The fix

Playwright provides `page.frameLocator()` to scope all locator queries to a specific iframe:

```typescript
const frame = page.frameLocator("iframe#hs-form-iframe-1");

// This now correctly targets the input inside the iframe
await frame.locator('input[name="firstname"]').fill("Jane");
```

Every single field interaction in the modal spec goes through `frame`, never through `page` directly.

### Key lesson

Whenever a form or component doesn't respond to locators as expected, inspect the DOM to check whether it is rendered inside an iframe. This is common with third-party embeds — HubSpot, Intercom, Typeform, Stripe, and similar services all use iframes.

---

## 3. The Pricing Fallback Navigation Problem

### What happened

The "Get a Quote" button has two behaviours depending on whether JavaScript has fully initialised:

- **If HubSpot's JS is ready:** clicking the button opens the contact modal
- **If HubSpot's JS is not yet ready:** the browser follows the `href="/pricing"` attribute and navigates away from the homepage entirely

During the retry loop, early clicks (before HubSpot was initialised) were causing the page to navigate to `/pricing`. This closed the original page context, and subsequent calls to `page.waitForTimeout()` threw:

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

### The fix

Block the `/pricing` route at the network level before any click attempts. This aborts the fallback navigation while still allowing HubSpot's JS handler to fire normally when it's ready:

```typescript
await page.route("**/pricing**", (route) => route.abort()).catch(() => {});
```

Additionally, guard every `waitForTimeout` call with an `isClosed()` check to fail gracefully rather than throwing if the page does close:

```typescript
if (!page.isClosed()) await page.waitForTimeout(2_000);
```

### Key lesson

Any button that has both a JavaScript handler and an `href` fallback is a race condition waiting to happen in tests. Always identify these and abort the fallback route before clicking. Never assume the JS handler will win the race.

---

## 4. HubSpot Chat Widget Intercepting Clicks

### What happened

Several tests were failing in WebKit with a specific error:

```
<iframe id="hubspot-conversations-iframe"> subtree intercepts pointer events
```

The HubSpot chat widget was rendering on top of page elements and absorbing clicks before they could reach the intended target. The tests passed in Chromium and Firefox but consistently failed in WebKit.

### Why WebKit specifically

WebKit enforces pointer event interception more strictly than Chromium or Firefox. The other browsers would sometimes click through overlapping elements where WebKit refuses. This is correct browser behaviour — WebKit is not broken, it is simply stricter.

The `dismissOverlays` function was already attempting to hide the chat widget via JavaScript after page load, but this was a race condition — the widget sometimes loaded after `dismissOverlays` ran.

### The fix

Block the chat widget at the network level, before navigation even begins. This prevents the iframe from loading at all, which means it can never overlap anything:

```typescript
await page
  .route("**hubspot-conversations-iframe**", (route) => route.abort())
  .catch(() => {});
await page
  .route("**/conversations-visitor/**", (route) => route.abort())
  .catch(() => {});
```

This runs inside `gotoReady()` so it applies to every test automatically.

The `dismissOverlays` JS manipulation is kept as a secondary defence for any residual HubSpot elements that load through other paths, but the network block is the primary protection.

### Key lesson

JavaScript-based overlay removal is always a race condition. Network-level blocking is deterministic — if the request is aborted, the resource never loads. Prefer route interception over DOM manipulation for reliable overlay suppression.

---

## 5. Cross-Browser Timing Differences

### What happened

Two categories of cross-browser failures appeared throughout development:

**Firefox:** Navigation tests sporadically timed out with `page.waitForURL` at the default 30 second limit. Firefox is genuinely slower than Chromium at resolving navigations, particularly with DOM-heavy pages.

**WebKit:** Click interactions failed due to the chat widget overlay (covered in section 4), and some `beforeEach` hooks timed out because the full setup sequence — navigation, title assertion, overlay dismissal — took longer in WebKit than the default allowed.

### The fixes

Raise timeouts for known slow operations rather than assuming all browsers behave identically:

```typescript
// Per-test where Firefox/WebKit need more room
test.setTimeout(60_000);

// Per-action in clickAndWaitForUrl
const { timeout = 45_000 } = options; // raised from the 30s default
```

For the `beforeEach` timeout, raising the global test timeout covers hook execution too — Playwright's `beforeEach` shares the test's timeout budget.

### Key lesson

Never write tests that only pass on one browser engine. WebKit and Firefox have different rendering and JS execution timelines. Always test across all three engines and accommodate the slowest one. If a test only ever runs on Chromium, it is not a cross-browser test.

---

## 6. Test Timeouts and Trace Recording Overhead

### What happened

The final test run was configured with traces, video, and screenshots forced on for all tests regardless of pass/fail status. Tests that had been passing consistently began timing out at the 30 second global limit.

### Why

Recording video and traces adds non-trivial overhead per test:

- **Video:** The browser encodes frames continuously throughout the test. This adds CPU load and slows down the browser's own rendering and event processing.
- **Traces:** Every network request, DOM mutation, screenshot, and action is recorded to disk. This is I/O-intensive.
- **Screenshots:** Captured at test start, end, and on failure — each capture pauses execution briefly.

Combined, these can add several seconds to tests that previously had no headroom to spare at 30 seconds.

### The fix

Raise the global timeout in `playwright.config.ts` to accommodate recording overhead:

```typescript
export default defineConfig({
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
});
```

Alternatively, pass the timeout via CLI for recorded runs only, keeping the config conservative for normal runs:

```bash
npx playwright test --timeout=60000
```

### Key lesson

Timeouts set during development without recording enabled will not hold when recording is turned on. Always add headroom, and treat the recorded final run as a different performance environment from development runs.

---

## 7. blockHeavyAssets and the HubSpot Whitelist Conflict

### What the code does

`block-heavy-assets.ts` applies two network interception rules to every browser context:

1. **File type blocking** — aborts requests for images, video, fonts, and other large static assets. HubSpot form domains are whitelisted here so their assets still load.
2. **Domain blocking** — aborts all requests to known analytics, tracking, and third-party chat domains.

### The bug

The domain blocking rule (rule 2) included `hubspot` in its regex pattern. This meant that all HubSpot domains were blocked at the domain level — including `js.hsforms.net`, `forms.hsforms.com`, and the other domains that the whitelist in rule 1 was supposed to protect.

The problem is that the two rules operate independently. Rule 1's whitelist only applies within rule 1. Rule 2 does not check rule 1's whitelist before aborting. Whichever rule processes a request first wins — and in practice, rule 2 was blocking HubSpot form scripts before rule 1 could allow them.

### The fix

Remove `hubspot` from rule 2's domain regex entirely. The chat widget specifically is handled by `blockChatWidget()` in `nav.ts` using targeted URL patterns, which is the correct place for it:

```typescript
// Rule 2 — hubspot removed; form scripts must be allowed through
/^https?:\/\/(www\.)?(googletagmanager|google-analytics|...|drift\.com|zdassets|static\.zdassets)\..*/i;
```

### Key lesson

When using layered network interception rules, be aware that rules don't share context with each other. A whitelist in one rule does not protect a resource from being blocked by a separate rule. Keep blocking rules specific and non-overlapping.

---

## 8. Helper Consolidation and Code Architecture

### The problem

Early in development, helper functions like `gotoReady`, `dismissOverlays`, and the HubSpot chat widget route blocking were defined independently inside each spec file and in `auth.setup.ts`. This meant:

- Three separate implementations of `gotoReady` with slight differences between them
- Bug fixes applied to one copy not propagating to the others
- The same overlay dismissal logic duplicated across three files
- `dismissCookieBanner` and `dismissChatWidget` in `auth.setup.ts` doing the same job as `dismissOverlays` in the spec files, under different names

### The refactor

All shared logic was consolidated into two helper files:

**`helpers/nav.ts`** — navigation and page state management:

- `BASE_URL` — single source of truth for the base URL
- `blockChatWidget()` — network-level chat widget suppression
- `dismissOverlays()` — cookie banner and HubSpot overlay removal
- `gotoReady()` — full page load sequence with overlay handling
- `openQuoteModal()` — HubSpot modal open with retry logic and fallback route blocking

**`helpers/locators.ts`** — element finding and click handling:

- `getFirstVisibleLocator()` — finds the first visible element from a list of candidates
- `clickAndWaitForUrl()` — click with URL wait, new tab handling, and href fallback
- `clickAndAssertNavigationOrHref()` — assertion wrapper around clickAndWaitForUrl

Spec files now contain only imports and test logic. There is no helper code defined inside a spec file.

### Key lesson

Any function used in more than one file belongs in a helper. Duplicated helper code is a maintenance liability — a fix made in one copy will eventually not be made in another, and tests will diverge silently.

---

## 9. Test Naming Conventions

### Before

```
"homepage is visible"
"book a demo page is accessible from the header"
'"JOIN THEM" CTA button links to contact us page'
'"GET A FREE QUOTE" opens contact modal with contact form'
"fills all contact form fields inside the HubSpot modal"
```

### After

```
"homepage hero section renders on load"
"Book a Demo navigates to the demo booking page"
"social proof Join Them CTA navigates to the contact page"
"Get a Quote CTA opens the HubSpot contact modal"
"all required fields accept and retain valid user input"
```

### The principles applied

**Describe behaviour, not mechanics.** A test name should read as a statement about what the system does, not what the test does. "fills all contact form fields" describes the test action. "all required fields accept and retain valid user input" describes the system behaviour being verified.

**Avoid quoting UI copy verbatim in test names.** UI copy changes. If the button is renamed from "JOIN THEM" to "Join Today", the test name becomes misleading. Describe what the element does, not what it says.

**Use sentence case, not title case or ALL CAPS.** Test names appear in reports, CI output, and dashboards. Sentence case is easier to scan at volume.

**Suite names describe a domain, not a category.** `CTA Link Validation` was renamed to `CTA Destinations` because the suite verifies where CTAs go, not whether they are valid links. The name should reflect the concern, not the mechanism.

---

## 10. When to Split Test Files

A common question in test suite architecture is whether to use one file per test or group related tests together.

### The case for splitting

- Large teams working on different features simultaneously
- Files growing beyond ~300 lines
- CI pipelines configured to run individual spec files in parallel across distributed workers
- Tests with genuinely different setup concerns, timeouts, or dependencies

### The case against splitting

- Most of the file becomes boilerplate (imports, `beforeEach`) repeated identically
- Navigation between related tests becomes harder
- File count grows faster than the test suite itself
- No real isolation benefit if setup is shared anyway

### The decision made here

`hbspt-modal-form-input.spec.ts` was split from `nuacom.spec.ts` for legitimate reasons:

- Different setup concerns — requires `openQuoteModal`, iframe context, and a longer timeout
- Different failure mode — HubSpot modal failures were interfering with unrelated navigation tests when co-located
- Distinct domain — form field input validation is meaningfully separate from navigation testing

Everything else remained in `nuacom.spec.ts`, organised into describe blocks. Ten individual files for ten simple navigation tests would add more complexity than it removes.

**The rule:** split when the test file has a genuinely different setup, a different domain of concern, or has grown large enough that navigating it becomes a problem. Not simply to achieve a lower line count per file.

---

## Summary of Key Takeaways

| Problem                                  | Root Cause                                                     | Solution                                                         |
| ---------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Form fields not found                    | HubSpot form is inside an iframe                               | Use `page.frameLocator()` for all modal interactions             |
| Page navigates to /pricing mid-retry     | `href` fallback fires before JS handler is ready               | Abort the `/pricing` route before clicking                       |
| Chat widget absorbs clicks in WebKit     | Widget iframe overlaps elements; WebKit enforces this strictly | Block widget requests at network level in `gotoReady`            |
| Tests timeout with recording enabled     | Video/trace overhead adds seconds per test                     | Raise global timeout to 60s; accommodate recording overhead      |
| HubSpot form scripts being blocked       | Domain block rule overrode the whitelist in asset block rule   | Remove `hubspot` from domain block regex                         |
| Helper functions duplicated across files | No shared helper layer early in development                    | Consolidate into `nav.ts` and `locators.ts`                      |
| Firefox/WebKit timeouts                  | Slower browser engines hit 30s limit                           | Raise per-test and per-action timeouts for known slow operations |

<p align="center">
	<img src="media/nuacom.png" alt="NUACOM Logo" width="120" />
</p>

# NUACOM Playwright Test Suite

> End-to-end automated testing for [nuacom.ie](https://nuacom.ie) — built with Playwright and TypeScript during a work experience placement at NUACOM.

This was a self-directed project. I came in with no prior experience in automated testing and spent the placement learning Playwright from scratch, applying it to a real production website, and working through the kinds of problems you only encounter when testing a live site with third-party integrations, cross-browser inconsistencies, and dynamic content.

---

## The Site Under Test

<p align="center">
	<img src="media/test-finished-1.png" alt="NUACOM Homepage Screenshot" width="600" />
</p>

NUACOM is an Irish business phone and VoIP solutions provider. Their website is built on WordPress with Elementor, and uses HubSpot extensively — for a contact modal form, a live chat widget, and tracking scripts. This made it a genuinely interesting target for automated testing because:

- HubSpot renders its contact form inside an **iframe**, requiring a non-obvious approach to interact with it
- The chat widget **intercepts pointer events** in WebKit, breaking standard click interactions
- Elementor's page sections and a **sticky navigation bar** sit above certain links, causing click interception in Firefox and WebKit
- Multiple third-party scripts fire unpredictably on every page load, creating **race conditions** against test interactions

None of these were obvious problems going in — they were discovered, diagnosed, and solved one by one.

---

## Test Coverage

| Suite                           | What it verifies                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------- |
| **Page Identity and Global UI** | Document title, navigation bar presence                                           |
| **Core Navigation**             | Homepage hero, Book a Demo, Talk to Sales, solution pages, contact form heading   |
| **CTA Destinations**            | Join Them, Contact Sales, Contact Us for a Free Quote, Get a Quote modal          |
| **HubSpot Contact Modal**       | All six required form fields — name, last name, phone, email, user count, company |

**Browsers:** Chromium · Firefox · WebKit

---

## A Few Things Worth Noting

<p align="center">
	<img src="media/test-finished-2.png" alt="HubSpot Modal Form Screenshot" width="400" />
</p>

**The HubSpot modal form test** was the most technically involved. The form lives inside an iframe — meaning standard `page.locator()` calls silently fail to find anything. The fix was to scope all interactions through `page.frameLocator()`. Getting there required understanding how iframes create isolated browsing contexts and why the main document has no visibility into them.

**The chat widget problem** only surfaced in WebKit. Chromium and Firefox were quietly clicking through the overlapping iframe; WebKit correctly refused. The right fix wasn't to dismiss the widget after it loaded — it was to abort the network request entirely so it never rendered.

**Navigation reliability** was solved by dropping click simulation for standard anchor links and using `page.goto(href)` directly. Elementor sections and a sticky nav were physically covering the links on scroll, and pointer interception in non-Chromium browsers made click-based navigation non-deterministic. Direct navigation is consistent across all three engines.

---

## Project Structure

```
├── tests/
│   ├── helpers/
│   │   ├── nav.ts                      # gotoReady, dismissOverlays, openQuoteModal
│   │   ├── locators.ts                 # clickAndWaitForUrl, getFirstVisibleLocator
│   │   ├── block-heavy-assets.ts       # Network-level blocking of analytics/tracking
│   │   └── network-cache.ts            # HAR-based request caching
│   ├── auth.setup.ts                   # Cookie consent state capture (per browser)
│   ├── nuacom.spec.ts                  # Core navigation and CTA tests
│   └── hbspt-modal-form-input.spec.ts  # HubSpot modal form field input
├── docs/
│   ├── nuacom-playwright-learnings.md  # Full engineering write-up
│   └── hubspot-modal-form-input.plan.md
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

Helper functions are separated by concern — `nav.ts` owns navigation and page state, `locators.ts` owns element finding and click handling. No helper logic is defined inside a spec file.

---

## Getting Started

```bash
npm install
npx playwright install
```

```bash
# Run all tests
npx playwright test

# Run on a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run a specific spec
npx playwright test tests/nuacom.spec.ts
npx playwright test tests/hbspt-modal-form-input.spec.ts

# Open the HTML report
npx playwright show-report

# If you wish to run with full trace, video, and screenshot recording
npx playwright test --timeout=90000
```

---

## Docs

**[Engineering Notes →](docs/nuacom-playwright-learnings.md)**
A full write-up of every meaningful problem encountered during development — what happened, why it happened, what the fix was, and what the general lesson is. Covers the iframe challenge, the chat widget interception, the pricing fallback navigation bug, cross-browser timing, timeout overhead with recording enabled, and the architecture decisions around helper consolidation.

**[HubSpot Modal Test Plan →](docs/hubspot-modal-form-input.plan.md)**
The original test plan written before implementation, showing the gap between planning for a standard form and what was actually required once the iframe architecture was discovered.

---

## Notes

---

## Demo Video

<p align="center">
	<video width="600" controls>
		<source src="media/video.webm" type="video/webm">
		Your browser does not support the video tag.
	</video>
</p>

- The HubSpot contact form is **never submitted** — fields are filled and assertions are made, but the submit button is not clicked. This avoids sending test data to NUACOM's live CRM.
- Auth storage state (cookie consent) is captured once per browser via `auth.setup.ts` and reused across the suite to avoid re-dismissing banners on every test.
- `test-results/`, `playwright-report/`, and `playwright/.auth/` are git-ignored.

# shopify-speed-bloat-auditor

> Free, MIT-licensed headless Chromium CLI to expose third-party app script bloat, slow DOM loads, broken images, 390px mobile horizontal overflow, and missing JSON-LD structured data on Shopify & DTC storefronts.

Built by [NordForge AI Studio](https://bolus095.github.io/nordforge-studio/) (Norway).

## What's New in v1.1.0 (Black Friday 2026 Readiness Mode)

- Estimates replaceable monthly & annual Shopify app subscription costs (`~$29/mo` per detected heavy widget embed)
- Prints exact sample URLs of broken DOM images (`naturalWidth === 0`) directly in CLI output
- Direct links to drop-in MIT Liquid fixes & instant visual teardowns

## Real Live Store Benchmark Findings

We ran this exact headless Chromium audit across **66 live US, Canadian, UK, Australian, and Nordic e-commerce brands** ahead of Black Friday 2026 ([inspect the full 66-store live benchmark report](https://bolus095.github.io/nordforge-studio/black-friday-shopify-speed-report-2026.html)):

- **Average external `<script>` tags loaded per homepage**: `44.2` (`64%` load `35+` external scripts)
- **Average `DOMContentLoaded` timing**: `2,422 ms`
- **Zero `application/ld+json` structured data schemas**: `26%` of audited storefronts
- **Broken DOM images (`naturalWidth === 0`)**: `17%` of audited storefronts

## Quick Start

```bash
git clone https://github.com/BoluS095/shopify-speed-bloat-auditor.git
cd shopify-speed-bloat-auditor
npm install
npx playwright install chromium
node bin/audit.mjs https://your-store.com
```

JSON output for CI / automated monitoring:

```bash
node bin/audit.mjs https://your-store.com --json
```

## Want Drop-In Fixes or a Bespoke 40-Point Teardown?

- **$9 Shopify Speed & Schema Emergency Quick-Win Pack** -> [Buy via Stripe](https://buy.stripe.com/7sYfZggMbcxL6f4gw2cs81o) | [Buy on Gumroad](https://bolus.gumroad.com/l/shopify-speed-quickwin)
- **$29 Shopify Zero-Friction CRO & Speed Liquid Kit (2026)** -> [Buy via Stripe](https://buy.stripe.com/28E4gy2Vl41ffPEdjQcs81i) | [Buy on Gumroad](https://bolus.gumroad.com/l/shopify-cro-liquid-kit)
- **$49 Custom 40-Point Website Conversion, Speed & SEO Fix Pack** -> [NordForge Studio](https://bolus095.github.io/nordforge-studio/#services)
- **$199 Done-For-You 48h Speed & CRO Rescue** -> [NordForge Studio](https://bolus095.github.io/nordforge-studio/#services)

## License

MIT — use freely on personal, brand, and client storefronts.

# shopify-speed-bloat-auditor

> Free, MIT-licensed headless Chromium CLI to expose third-party app script bloat, slow DOM loads, broken images, 390px mobile horizontal overflow, and missing JSON-LD structured data on Shopify & DTC storefronts.

Built by [NordForge AI Studio](https://bolus095.github.io/nordforge-studio/) (Norway).

## Why We Built This

Most merchants guess why mobile conversion drops while paying $50–$150/mo for legacy chat, upsell, and popup widgets whose script tags stay behind in `theme.liquid` even after uninstalling apps.

Across live headless Chromium benchmarks of real e-commerce brands ([live audit teasers](https://bolus095.github.io/nordforge-studio/#audits)):
- **Average external `<script>` tags loaded per homepage**: `46` (with >54% loading `40+` external scripts)
- **Average DOMContentLoaded timing**: `1,973 ms` (up to `3,801 ms` on heavily scripted stores)
- **Structured data gap**: `27%` of scanned storefronts rendered `0` valid `application/ld+json` schemas

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

## What It Measures

1. **TTFB & DOMContentLoaded** via browser `PerformanceNavigationTiming`
2. **External Scripts & Third-Party Hosts** (`script[src]` waterfall + matched app embeds like Klaviyo, Hotjar, Judge.me, Yotpo, Omnisend, Gorgias, etc.)
3. **Total Measured Payload (KB)** across first load
4. **Media & Accessibility Health** (`naturalWidth === 0` broken images + missing `alt` attributes)
5. **Mobile Viewport Overflow (390x844)** checking `scrollWidth - innerWidth`
6. **SEO & Google Merchant Compliance** (`application/ld+json` schema count, canonical URL, H1 count, meta description)

## Want Drop-In Fixes or a Bespoke 40-Point Teardown?

- **$9 Shopify Speed & Schema Emergency Quick-Win Pack** — Plug-and-play `Organization`/`Product` JSON-LD snippet, mobile overflow + CLS CSS guard, and 40-point checklist -> [NordForge Studio](https://bolus095.github.io/nordforge-studio/#toolkits)
- **$29 Shopify Zero-Friction CRO & Speed Liquid Kit (2026)** — Native Cart Free-Shipping Progress Bar, 1-Click Sticky Buy Bar, Product-Match Quiz, and JSON-LD Schema (replace monthly apps cleanly) -> [NordForge Studio](https://bolus095.github.io/nordforge-studio/#toolkits)
- **$49 Custom 40-Point Website Conversion, Speed & SEO Fix Pack** — Full forensic audit of your exact domain with copy-paste Liquid/HTML/JSON-LD code patches -> [NordForge Studio](https://bolus095.github.io/nordforge-studio/#services)
- **$199 Done-For-You 48h Speed & CRO Rescue** -> [NordForge Studio](https://bolus095.github.io/nordforge-studio/#services)

## License

MIT — use freely on personal, brand, and client storefronts.

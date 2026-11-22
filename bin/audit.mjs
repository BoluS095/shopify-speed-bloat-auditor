#!/usr/bin/env node
/**
 * shopify-speed-bloat-auditor — Free MIT-licensed Chromium telemetry CLI
 * Measures TTFB, DOM Content Loaded, transfer KB, third-party script count,
 * heavy Shopify app embeds, broken images, missing alt text, JSON-LD schemas,
 * and 390px mobile horizontal overflow.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadChromium() {
  try {
    const pw = await import("playwright");
    if (pw?.chromium) return pw.chromium;
  } catch {}
  const fallback = path.resolve(__dirname, "../../..", "node_modules/.pnpm/node_modules/playwright/index.mjs");
  if (fs.existsSync(fallback)) {
    const pw = await import(pathToFileURL(fallback).href);
    return pw.chromium;
  }
  throw new Error("Playwright not found. Run: npm install playwright");
}

const args = process.argv.slice(2);
const targetUrl = args.find((a) => /^https?:\/\//i.test(a));
const jsonOutput = args.includes("--json");

if (!targetUrl) {
  console.error("Usage: shopify-bloat-auditor <https://your-store.com> [--json]");
  process.exit(1);
}

function findBrowserExecutable() {
  const localAppData = process.env.LOCALAPPDATA || "";
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    localAppData && path.join(localAppData, "ms-playwright", "chromium-1248", "chrome-win64", "chrome.exe"),
    localAppData && path.join(localAppData, "ms-playwright", "chromium-1228", "chrome-win64", "chrome.exe"),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

function scoreAndDiagnose(m) {
  const findings = [];
  if (m.brokenImgs.length > 0) {
    findings.push(`CRITICAL: ${m.brokenImgs.length} broken image(s) with naturalWidth === 0.`);
  }
  if (m.mobileOverflowPx > 4) {
    findings.push(`MOBILE UX: +${m.mobileOverflowPx}px horizontal overflow detected at 390px mobile width.`);
  }
  if (m.externalScripts >= 30 || m.thirdPartyDomains >= 15) {
    findings.push(`SCRIPT BLOAT: ${m.externalScripts} external scripts across ${m.thirdPartyDomains} third-party hosts (${m.transferKb} KB transferred).`);
  }
  if (m.domContentLoadedMs >= 2000) {
    findings.push(`SLOW DOM: ${m.domContentLoadedMs}ms DOMContentLoaded (TTFB ${m.ttfbMs}ms).`);
  }
  if (m.jsonLdCount === 0) {
    findings.push("SEO / MERCHANT GAP: Zero Product/Organization application/ld+json structured data tags found.");
  }
  if (m.missingAlt > 3) {
    findings.push(`ACCESSIBILITY: ${m.missingAlt}/${m.totalImages} images missing alt attributes.`);
  }
  const score = Math.max(
    35,
    100 -
      Math.min(28, Math.floor(m.externalScripts / 2)) -
      m.brokenImgs.length * 8 -
      (m.mobileOverflowPx > 4 ? 10 : 0) -
      (m.jsonLdCount === 0 ? 8 : 0) -
      (m.domContentLoadedMs > 2500 ? 10 : 0)
  );
  return { score, findings };
}

async function runAudit(url) {
  const chromium = await loadChromium();
  const execPath = findBrowserExecutable();
  const browser = await chromium.launch({ headless: true, ...(execPath ? { executablePath: execPath } : {}) });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    let transferBytes = 0;
    const thirdPartyHosts = new Set();
    const rootHost = new URL(url).hostname.replace(/^www\./, "");

    page.on("response", (res) => {
      try {
        const cl = Number(res.headers()["content-length"] || 0);
        if (cl > 0) transferBytes += cl;
        const h = new URL(res.url()).hostname.replace(/^www\./, "");
        if (h && !h.endsWith(rootHost)) thirdPartyHosts.add(h);
      } catch {}
    });

    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2200);

    const desktop = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const scripts = [...document.querySelectorAll("script[src]")].map((s) => s.src);
      const imgs = [...document.querySelectorAll("img")];
      const brokenImgs = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src);
      const missingAlt = imgs.filter((i) => !i.getAttribute("alt")?.trim()).length;
      const jsonLdCount = document.querySelectorAll('script[type="application/ld+json"]').length;
      const appEmbeds = scripts.filter((s) =>
        /klaviyo|hotjar|tidio|privy|loox|judge\.me|adeagle|eggflow|smartpop|omnisend|gorgias|recharge|yotpo|attentive/i.test(s)
      );
      const perfBytes = performance.getEntriesByType("resource").reduce((acc, r) => acc + (r.transferSize || 0), 0);

      return {
        title: document.title?.trim() || "",
        isShopify: Boolean(window.Shopify) || scripts.some((s) => s.includes("cdn.shopify.com")),
        h1Count: document.querySelectorAll("h1").length,
        hasMetaDesc: Boolean(document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim()),
        hasCanonical: Boolean(document.querySelector('link[rel="canonical"]')?.getAttribute("href")),
        jsonLdCount,
        totalImages: imgs.length,
        brokenImgs,
        missingAlt,
        externalScripts: scripts.length,
        appEmbeds: [...new Set(appEmbeds.map((u) => new URL(u).hostname))],
        ttfbMs: nav ? Math.round(nav.responseStart) : 0,
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
        perfBytes,
      };
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    const mobileOverflowPx = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollWidth - window.innerWidth)
    );

    const metrics = {
      url,
      httpStatus: resp ? resp.status() : 0,
      transferKb: Math.round(Math.max(transferBytes, desktop.perfBytes) / 1024),
      thirdPartyDomains: thirdPartyHosts.size,
      mobileOverflowPx,
      ...desktop,
    };
    const diag = scoreAndDiagnose(metrics);
    const result = { ...metrics, score: diag.score, findings: diag.findings };

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`\n=== Shopify Speed & Bloat Audit v1.1 (BFCM Readiness): ${rootHost} ===`);
    console.log(`Score: ${result.score}/100 | HTTP ${result.httpStatus} | Stack: ${result.isShopify ? "Shopify" : "Web/DTC"}`);
    console.log(`TTFB: ${result.ttfbMs}ms | DOM Load: ${result.domContentLoadedMs}ms | Payload: ${result.transferKb} KB`);
    console.log(`External Scripts: ${result.externalScripts} across ${result.thirdPartyDomains} 3rd-party hosts`);
    console.log(`App Embeds Detected (${result.appEmbeds.length}): ${result.appEmbeds.length ? result.appEmbeds.join(", ") : "None matched"}`);
    if (result.appEmbeds.length > 0) {
      const estMonthly = result.appEmbeds.length * 29;
      console.log(`Estimated Replaceable App Subscriptions: ~$${estMonthly}/mo ($${estMonthly * 12}/yr)`);
    }
    console.log(`JSON-LD Schemas: ${result.jsonLdCount} | Broken Imgs: ${result.brokenImgs.length} | Missing Alt: ${result.missingAlt}`);
    if (result.brokenImgs.length > 0) {
      console.log(`Broken Image Samples: ${result.brokenImgs.slice(0, 3).join(", ")}`);
    }
    console.log(`Mobile Overflow (390px): ${result.mobileOverflowPx}px`);
    if (result.findings.length) {
      console.log("\nPriority Issues Found:");
      result.findings.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
    }
    console.log("\nFix these leaks in 15 minutes with zero monthly app fees:");
    console.log("  -> $9 Quick-Win Schema + Mobile CSS Patch: https://buy.stripe.com/7sYfZggMbcxL6f4gw2cs81o");
    console.log("  -> $29 Native Shopify Liquid CRO Kit:      https://buy.stripe.com/28E4gy2Vl41ffPEdjQcs81i");
    console.log("  -> Full Studio & Live Audits:              https://bolus095.github.io/nordforge-studio/\n");
  } finally {
    await browser.close();
  }
}

runAudit(targetUrl).catch((err) => {
  console.error("Audit failed:", err.message);
  process.exit(1);
});

// Records site blocks as frame sequences with a virtual clock (smooth 30 fps
// regardless of how long a screenshot takes). Run by .github/workflows/record-ads.yml.
// Output: frames/<block>-<layout>/f00000.png ...
import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.env.SITE_URL || "https://luxcam.md/";
const FPS = 30;
const SECONDS = Number(process.env.SECONDS || 14.2);

const BLOCKS = [
  { key: "vezi-diferenta", sel: "section.ztv" },
  { key: "trei-capete", sel: "section.th3" },
];
const LAYOUTS = [
  { key: "mobile", width: 430, height: 2400, dsf: 2.5 },
  { key: "desktop", width: 1000, height: 1600, dsf: 2 },
];

// virtual clock: performance.now + requestAnimationFrame driven by window.__step(ms)
const CLOCK = `(() => {
  let vt = 0; let q = []; let id = 0;
  performance.now = () => vt;
  window.requestAnimationFrame = (cb) => { q.push([++id, cb]); return id; };
  window.cancelAnimationFrame = (i) => { q = q.filter(([k]) => k !== i); };
  window.__vt = () => vt;
  window.__step = (ms) => { vt += ms; const run = q; q = []; run.forEach(([, cb]) => { try { cb(vt); } catch (e) {} }); };
})();`;

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" }); // Chrome: has the H.264 codec for the mp4
for (const L of LAYOUTS) {
  for (const B of BLOCKS) {
    const ctx = await browser.newContext({ viewport: { width: L.width, height: L.height }, deviceScaleFactor: L.dsf });
    await ctx.addInitScript(CLOCK);
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });
    // let React mount (rAF is virtual, so pump it)
    for (let i = 0; i < 30; i++) await page.evaluate(() => window.__step(16));
    const el = page.locator(B.sel).first();
    await el.scrollIntoViewIfNeeded();
    await page.evaluate((sel) => {
      const s = document.querySelector(sel);
      window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 40);
    }, B.sel);
    // hide floating UI (sidebar, chat buttons, popups)
    await page.evaluate(() => {
      document.querySelectorAll("body *").forEach((n) => {
        const p = getComputedStyle(n).position;
        if (p === "fixed" || p === "sticky") n.style.setProperty("visibility", "hidden", "important");
      });
      // transparent page background: the video composer puts the site background behind the block
      for (const n of [document.documentElement, document.body, document.getElementById("root")]) {
        if (n) n.style.setProperty("background", "transparent", "important");
      }
    });
    // wait for images + video to load, entry transitions to finish (real time)
    await page.waitForTimeout(2500);
    for (let i = 0; i < 60; i++) await page.evaluate(() => window.__step(16));
    await page.evaluate(async () => {
      const v = document.querySelector("section.ztv video");
      if (v) { v.pause(); if (v.readyState < 2) await new Promise((r) => { v.addEventListener("loadeddata", r, { once: true }); setTimeout(r, 8000); }); }
      await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
    });
    await page.waitForTimeout(1500);
    // freeze CSS animations; we set their time per frame
    await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
    const t0 = await page.evaluate(() => window.__vt());

    const dir = `frames/${B.key}-${L.key}`;
    fs.mkdirSync(dir, { recursive: true });
    const n = Math.round(SECONDS * FPS);
    for (let f = 0; f < n; f++) {
      const t = f * (1000 / FPS);
      await page.evaluate(async ({ t, t0 }) => {
        window.__step(1000 / 30);
        document.getAnimations().forEach((a) => { try { a.currentTime = t; } catch (e) {} });
        const v = document.querySelector("section.ztv video");
        if (v && v.duration) {
          const target = (t / 1000) % v.duration;
          if (Math.abs(v.currentTime - target) > 0.001) {
            await new Promise((r) => { v.addEventListener("seeked", r, { once: true }); v.currentTime = target; setTimeout(r, 1500); });
          }
        }
      }, { t, t0 });
      await el.screenshot({ path: `${dir}/f${String(f).padStart(5, "0")}.png`, animations: "allow", omitBackground: true });
    }
    const box = await el.boundingBox();
    console.log(B.key, L.key, "frames", n, "box", JSON.stringify(box));
    await ctx.close();
  }
}
await browser.close();

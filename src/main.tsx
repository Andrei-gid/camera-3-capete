import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadContent } from "./hooks/useContent";
import { bootPixel, fireContact } from "./lib/metaPixel";

// Strict No-Copy / No-Save policy.
// Aggressively blocks long-press save, drag, right-click, and selection on
// images and non-interactive content while keeping forms, buttons, links,
// and scrolling fully functional.
// Not on /admin: there you need to tap photos and select text freely.
if (typeof document !== "undefined" && !window.location.pathname.startsWith("/admin")) {
  const INTERACTIVE_SELECTOR =
    'a, button, [role="button"], input, textarea, select, label, [contenteditable="true"]';

  const isInteractive = (el: EventTarget | null) =>
    el instanceof HTMLElement && !!el.closest(INTERACTIVE_SELECTOR);

  // Block right-click / long-press context menu everywhere except on inputs/buttons
  document.addEventListener("contextmenu", (e) => {
    if (!isInteractive(e.target)) e.preventDefault();
  });

  // Block image drag-and-save
  document.addEventListener("dragstart", (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "IMG" || t.closest("img"))) {
      e.preventDefault();
    }
  });

  // Block text selection start except in form fields
  document.addEventListener("selectstart", (e) => {
    if (!isInteractive(e.target)) e.preventDefault();
  });

  // Block iOS long-press save sheet on images. Only target <img> so scrolling
  // and taps on buttons/links remain unaffected.
  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "IMG") {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

// Ad-recording mode: luxcam.md/?ad=ztv (or ?ad=th3) shows only that block, centred
// on a clean screen — no menu, chat buttons or pop-ups, no Pixel. For screen
// recordings used in Facebook ads.
const AD_BLOCK = new URLSearchParams(window.location.search).get("ad");
const AD_SEL: Record<string, string> = { ztv: "section.ztv", th3: "section.th3" };
if (AD_BLOCK && AD_SEL[AD_BLOCK]) {
  const sel = AD_SEL[AD_BLOCK];
  const style = document.createElement("style");
  style.textContent = `html,body{overflow:hidden!important}
    .ad-hide{display:none!important}
`;
  document.head.appendChild(style);
  const clean = () => {
    const target = document.querySelector(sel);
    if (!target) return;
    // hide everything that is not the block or one of its ancestors
    let n: Element | null = target;
    while (n && n.parentElement) {
      for (const sib of Array.from(n.parentElement.children)) if (sib !== n && sib.tagName !== "SCRIPT" && sib.tagName !== "STYLE") sib.classList.add("ad-hide");
      n = n.parentElement;
      if (n === document.body) break;
    }
    document.querySelectorAll("body *").forEach((el) => {
      if (!target.contains(el) && getComputedStyle(el).position === "fixed") el.classList.add("ad-hide");
    });
    window.scrollTo(0, 0);
  };
  // fit the whole block on the screen, vertically centred
  const fit = () => {
    const t = document.querySelector<HTMLElement>(sel);
    if (!t) return;
    t.style.zoom = "1";
    const h = t.getBoundingClientRect().height;
    const k = Math.min(1, (window.innerHeight - 16) / h);
    t.style.zoom = String(k);
    t.style.setProperty("margin", `${Math.max(0, (window.innerHeight - h * k) / 2 / k)}px auto 0`, "important");
  };
  setInterval(clean, 400);
  window.setTimeout(fit, 1200);
  window.setTimeout(fit, 3000);
  window.addEventListener("resize", () => window.setTimeout(fit, 200));
}

// Meta Pixel with the ID saved in /admin (no tracking inside the admin panel).
if (!window.location.pathname.startsWith("/admin") && !AD_BLOCK) {
  loadContent().then((c) => bootPixel(c.tracking.metaPixelId, { title: c.product.title, price: c.product.price }));
  // phone links anywhere on the site (sidebar, footer, ...) → Contact event
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="tel:"]');
      if (a) fireContact("call");
    },
    true,
  );
}

createRoot(document.getElementById("root")!).render(<App />);

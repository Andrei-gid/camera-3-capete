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

// Meta Pixel with the ID saved in /admin (no tracking inside the admin panel).
if (!window.location.pathname.startsWith("/admin")) {
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

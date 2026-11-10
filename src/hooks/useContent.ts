import { useEffect, useState } from "react";
import { DEFAULT_CONTENT, mergeContent, type SiteContent } from "@/data/siteContent";

// Site content saved in /admin, merged over DEFAULT_CONTENT.
// Loaded once per page view and shared by every component.

let cache: SiteContent | null = null;
let inflight: Promise<SiteContent> | null = null;
const listeners = new Set<(c: SiteContent) => void>();

export const loadContent = (): Promise<SiteContent> => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { content: unknown }) => mergeContent(d.content))
      .catch((err) => {
        console.warn("[content] using defaults:", err);
        return mergeContent(null);
      })
      .then((c) => {
        cache = c;
        listeners.forEach((fn) => fn(c));
        return c;
      });
  }
  return inflight;
};

/** Lets the admin preview its own changes without reloading the page. */
export const setContentCache = (c: SiteContent) => {
  cache = c;
  listeners.forEach((fn) => fn(c));
};

export const useContent = (): SiteContent => {
  const [content, setContent] = useState<SiteContent>(cache ?? DEFAULT_CONTENT);
  useEffect(() => {
    listeners.add(setContent);
    loadContent().then(setContent);
    return () => {
      listeners.delete(setContent);
    };
  }, []);
  return content;
};

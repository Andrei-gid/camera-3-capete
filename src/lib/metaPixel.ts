/**
 * Centralised Meta Pixel helper.
 *
 * Events fired across the whole site (Meta standard events):
 *   - PageView         (once per page load, from bootPixel())
 *   - ViewContent      (once per page load on the product pages: / and /order)
 *   - InitiateCheckout (once per session: /order opened or first tap in a form)
 *   - Contact          (call / WhatsApp / Viber button)
 *   - Lead             (once per successful form submission, on /thank-you)
 *
 * Every event carries an eventID. ViewContent, InitiateCheckout and Contact are
 * also sent server-side via /api/track and Lead via /api/order (Conversions
 * API) with the SAME id, so Meta deduplicates browser + server copies.
 * Every event carries external_id (a persistent anonymous visitor id) and
 * country=md, so all events of one visitor match to the same person.
 *
 * Advanced Matching data is applied at init level so every subsequent
 * event automatically carries it. No PII is ever logged to the console.
 *
 * Lead is also sent server-side (Conversions API, worker/order.ts) with the
 * same event_id, so Meta counts it once even when the browser pixel is
 * blocked — and the server copy carries IP, browser, _fbp/_fbc too.
 */

// Set from /admin (Settings → Meta Pixel ID) by bootPixel(); "" = pixel off.
export let META_PIXEL_ID = "";

/** Initialises the pixel once with the ID saved in /admin and fires PageView. */
export const bootPixel = (id: string, product?: { title: string; price: number }): void => {
  const clean = id.replace(/\D/g, "");
  if (!clean || META_PIXEL_ID || typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq !== "function") return;
  META_PIXEL_ID = clean;
  if (product) PRODUCT = product;
  fbq("set", "autoConfig", false, clean);
  // external_id + country on every event (the pixel hashes them itself).
  // On /thank-you the customer data saved at checkout goes into init too —
  // the pixel ignores a second init, so this is the only place it sticks.
  const saved = readLeadData();
  const { val: _v, cur: _c, ...savedMatching } = saved ?? {};
  fbq("init", clean, { ...savedMatching, external_id: visitorId(), country: "md" });
  fbq("track", "PageView", {}, { eventID: newEventId() });
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/order") fireViewContent();
};

// The product shown on the site (set from /admin content by bootPixel).
let PRODUCT: { title: string; price: number } = { title: "Cameră cu 3 capete rotative", price: 800 };
const PRODUCT_ID = "luxcam-3capete";

// --- persistent anonymous visitor id (external_id) -------------------------
const VID_KEY = "lx_vid";
export const visitorId = (): string => {
  try {
    let v = localStorage.getItem(VID_KEY);
    if (!v) {
      v = newEventId();
      localStorage.setItem(VID_KEY, v);
    }
    return v;
  } catch {
    return "";
  }
};

export const newEventId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/** Server copy of a browser event (Conversions API) with the same event id. */
const sendServerEvent = (eventName: string, eventId: string, customData: Record<string, unknown>): void => {
  try {
    const body = JSON.stringify({
      eventName,
      eventId,
      customData,
      url: location.href,
      vid: visitorId(),
      ...browserIds(),
    });
    const ok =
      typeof navigator !== "undefined" && "sendBeacon" in navigator
        ? navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }))
        : false;
    if (!ok) void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* tracking is non-critical */
  }
};

/** Browser + server event with one shared id. */
const track = (eventName: string, customData: Record<string, unknown>): void => {
  const fbq = getFbq();
  if (!fbq || !META_PIXEL_ID) return;
  const eventID = newEventId();
  fbq("track", eventName, customData, { eventID });
  sendServerEvent(eventName, eventID, customData);
};

const productData = (value = PRODUCT.price, numItems = 1) => ({
  content_ids: [PRODUCT_ID],
  content_name: PRODUCT.title,
  content_type: "product",
  contents: [{ id: PRODUCT_ID, quantity: numItems }],
  num_items: numItems,
  value,
  currency: "MDL",
});

/** InitiateCheckout once per session: /order opened or first tap in an order form. */
export const fireInitiateCheckout = (value?: number, numItems = 1): void => {
  if (!META_PIXEL_ID) return;
  try {
    if (sessionStorage.getItem("lx_ic")) return;
    sessionStorage.setItem("lx_ic", "1");
  } catch {
    /* ignore */
  }
  track("InitiateCheckout", productData(value ?? PRODUCT.price * numItems, numItems));
};

const LEAD_STORAGE_KEY = "secure_lead_data";

export interface AdvancedMatchingInput {
  phone?: string | null;
  fullName?: string | null;
  email?: string | null;
  city?: string | null;
  county?: string | null;
}

export interface LeadData {
  ph?: string;
  fn?: string;
  ln?: string;
  em?: string;
  ct?: string;
  st?: string;
  country?: string;
  external_id?: string;
  val?: number;
  cur?: string;
}

const getFbq = (): ((...args: unknown[]) => void) | null => {
  if (typeof window === "undefined") return null;
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  return typeof fbq === "function" ? fbq : null;
};

/** Moldovan phone → E.164 digits (373XXXXXXXX). Returns "" when implausible. */
export const normalizePhone = (raw?: string | null): string => {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "373" + digits.slice(1);
  else if (!digits.startsWith("373")) digits = "373" + digits;
  // 373 + 8 national digits = 11
  if (digits.length < 11 || digits.length > 15) return "";
  return digits;
};

/** Lowercased name without punctuation, split into first / last ("Ion Popescu" → ion / popescu). */
export const normalizeName = (raw?: string | null): { fn: string; ln: string } => {
  const clean = (raw ?? "").trim().toLowerCase().replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ").trim();
  if (!clean) return { fn: "", ln: "" };
  const parts = clean.split(" ");
  return { fn: parts[0] || "", ln: parts.length > 1 ? parts.slice(1).join(" ") : "" };
};

/** Basic email check: local@domain.tld */
export const normalizeEmail = (raw?: string | null): string => {
  const clean = (raw ?? "").trim().toLowerCase();
  if (!clean) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean) ? clean : "";
};

/** City / county as Meta wants them: lowercase a–z only, no diacritics, spaces or punctuation ("Cluj-Napoca" → clujnapoca). */
const normalizeText = (raw?: string | null): string => {
  const clean = (raw ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  return clean.length > 1 ? clean : "";
};

/** Builds a validated Advanced Matching payload — empty/malformed fields are dropped. */
export const buildAdvancedMatching = (input: AdvancedMatchingInput): LeadData => {
  const data: LeadData = {};
  const ph = normalizePhone(input.phone);
  if (ph) data.ph = ph;
  const { fn, ln } = normalizeName(input.fullName);
  if (fn) data.fn = fn;
  if (ln) data.ln = ln;
  const em = normalizeEmail(input.email);
  if (em) data.em = em;
  const ct = normalizeText(input.city);
  if (ct) data.ct = ct;
  const st = normalizeText(input.county);
  if (st) data.st = st;
  data.country = "md"; // the shop sells only in Moldova
  const vid = visitorId();
  if (vid) data.external_id = vid; // same anonymous id as on every other event
  return data;
};

/**
 * Re-initialises the pixel with Advanced Matching so every following event
 * carries Phone / First Name / Last Name / etc. automatically.
 */
export const applyAdvancedMatching = (data: LeadData): void => {
  const fbq = getFbq();
  if (!fbq || !META_PIXEL_ID) return;
  const { val: _val, cur: _cur, ...matching } = data;
  if (Object.keys(matching).length === 0) return;
  fbq("init", META_PIXEL_ID, matching);
};

/** Persist sanitized lead data for the Thank You page to fire the Lead event. */
export const storeLeadData = (
  input: AdvancedMatchingInput & { value?: number }
): void => {
  try {
    const data: LeadData = {
      ...buildAdvancedMatching(input),
      val: input.value ?? 0,
      cur: "MDL",
    };
    sessionStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable — tracking is non-critical */
  }
};

export const readLeadData = (): LeadData | null => {
  try {
    const raw = sessionStorage.getItem(LEAD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LeadData;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const clearLeadData = (): void => {
  try {
    sessionStorage.removeItem(LEAD_STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

/** Fires Lead exactly once, with Advanced Matching applied at init level. */
export const fireLeadEvent = (): boolean => {
  const fbq = getFbq();
  if (!fbq || !META_PIXEL_ID) return false; // pixel not booted yet — caller retries
  const data = readLeadData();
  if (!data) return false;

  applyAdvancedMatching(data);
  const eventID = takeLeadEventId();
  fbq(
    "track",
    "Lead",
    {
      value: typeof data.val === "number" ? data.val : 0,
      currency: data.cur || "MDL",
      content_ids: [PRODUCT_ID],
      content_name: PRODUCT.title,
      content_type: "product",
    },
    eventID ? { eventID } : undefined, // same id as the server-side event → counted once
  );
  clearLeadData();
  return true;
};

// --- event id shared by the browser pixel and the Conversions API ---------
const EVENT_ID_KEY = "lead_event_id";

export const newLeadEventId = (): string => newEventId();

export const rememberLeadEventId = (id: string) => {
  try {
    sessionStorage.setItem(EVENT_ID_KEY, id);
  } catch {
    /* ignore */
  }
};

const takeLeadEventId = (): string => {
  try {
    const id = sessionStorage.getItem(EVENT_ID_KEY) || "";
    sessionStorage.removeItem(EVENT_ID_KEY);
    return id;
  } catch {
    return "";
  }
};

const cookie = (name: string) => {
  const m = typeof document !== "undefined" ? document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`)) : null;
  return m ? decodeURIComponent(m[1]) : "";
};

/** Browser ids Meta uses to match the server event to the ad click. */
export const browserIds = (): { fbp: string; fbc: string } => {
  const fbp = cookie("_fbp");
  let fbc = cookie("_fbc");
  if (!fbc && typeof location !== "undefined") {
    const clid = new URLSearchParams(location.search).get("fbclid");
    if (clid) fbc = `fb.1.${Date.now()}.${clid}`;
  }
  return { fbp, fbc };
};

/** Standard "Contact" event when a visitor opens WhatsApp / Viber / a call. */
export const fireContact = (channel: string): void => {
  track("Contact", { content_name: channel });
};

/** ViewContent once per product page load. */
export const fireViewContent = (): void => {
  track("ViewContent", productData());
};

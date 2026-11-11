// Meta Conversions API: the Lead event sent from the server, with the same
// event_id as the browser pixel (Meta keeps one of the two). Server events
// are not lost to ad blockers / iOS tracking limits and carry IP + browser,
// which raises Event Match Quality.
// Secrets: META_CAPI_TOKEN (Events Manager → Settings → Conversions API →
// Generate access token). Optional: META_TEST_EVENT_CODE (Test events tab).
// The pixel id is the one saved in /admin.

export interface CapiEnv {
  META_CAPI_TOKEN?: string;
  META_TEST_EVENT_CODE?: string;
}

const sha256 = async (v: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Same normalisation as src/lib/metaPixel.ts, so browser and server match.
const phoneE164 = (raw: string) => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "373" + d.slice(1);
  else if (!d.startsWith("373")) d = "373" + d;
  return d.length >= 11 && d.length <= 15 ? d : "";
};
const nameParts = (raw: string) => {
  const c = raw.toLowerCase().replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ").trim();
  const p = c ? c.split(" ") : [];
  return { fn: p[0] ?? "", ln: p.slice(1).join(" ") };
};
const plain = (raw: string) =>
  raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

export interface LeadForCapi {
  pixelId: string;
  eventId: string;
  url: string;
  fbp: string;
  fbc: string;
  ip: string;
  userAgent: string;
  fullName: string;
  phone: string;
  city: string;
  county: string;
  value: number;
  quantity: number;
  productName: string;
  visitorId?: string;
}

export const sendLeadToCapi = async (env: CapiEnv, l: LeadForCapi) => {
  if (!env.META_CAPI_TOKEN || !l.pixelId || !l.eventId) return;
  const ph = phoneE164(l.phone);
  const { fn, ln } = nameParts(l.fullName);
  const ct = plain(l.city);
  const st = plain(l.county);
  const h = async (v: string) => (v ? [await sha256(v)] : undefined);

  const user_data: Record<string, unknown> = {
    ph: await h(ph),
    fn: await h(fn),
    ln: await h(ln),
    ct: await h(ct),
    st: await h(st),
    country: await h("md"),
    external_id: await h(l.visitorId || ph), // same anonymous id as the browser events
    client_ip_address: l.ip || undefined,
    client_user_agent: l.userAgent || undefined,
    fbp: l.fbp || undefined,
    fbc: l.fbc || undefined,
  };
  Object.keys(user_data).forEach((k) => user_data[k] === undefined && delete user_data[k]);

  const body = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: l.eventId,
        action_source: "website",
        event_source_url: l.url || undefined,
        user_data,
        custom_data: {
          currency: "MDL",
          value: l.value,
          content_name: l.productName,
          content_ids: ["luxcam-3capete"],
          contents: [{ id: "luxcam-3capete", quantity: l.quantity }],
          content_type: "product",
          num_items: l.quantity,
        },
      },
    ],
    ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(l.pixelId)}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    if (!res.ok) console.error("CAPI error", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("CAPI fetch failed", e);
  }
};

// Generic server copy of a browser event (ViewContent, InitiateCheckout,
// Contact) — same event_id as the pixel, so Meta keeps one of the two.
export interface EventForCapi {
  pixelId: string;
  eventName: string;
  eventId: string;
  url: string;
  fbp: string;
  fbc: string;
  ip: string;
  userAgent: string;
  visitorId: string;
  customData: Record<string, unknown>;
}

export const sendEventToCapi = async (env: CapiEnv, e: EventForCapi) => {
  if (!env.META_CAPI_TOKEN || !e.pixelId || !e.eventId) return;
  const user_data: Record<string, unknown> = {
    country: [await sha256("md")],
    external_id: e.visitorId ? [await sha256(e.visitorId)] : undefined,
    client_ip_address: e.ip || undefined,
    client_user_agent: e.userAgent || undefined,
    fbp: e.fbp || undefined,
    fbc: e.fbc || undefined,
  };
  Object.keys(user_data).forEach((k) => user_data[k] === undefined && delete user_data[k]);
  const body = {
    data: [
      {
        event_name: e.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        action_source: "website",
        event_source_url: e.url || undefined,
        user_data,
        custom_data: e.customData,
      },
    ],
    ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {}),
  };
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(e.pixelId)}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    if (!res.ok) console.error("CAPI error", e.eventName, res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("CAPI fetch failed", err);
  }
};

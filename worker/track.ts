// POST /api/track — server copy (Conversions API) of the browser events
// ViewContent / InitiateCheckout / Contact, with the same event_id as the
// pixel so Meta deduplicates them. Lead goes through /api/order instead.
import { type AdminEnv, json, getContent } from "./admin";
import { type CapiEnv, sendEventToCapi } from "./capi";
import { mergeContent } from "../src/data/siteContent";

export type TrackEnv = AdminEnv & CapiEnv;

const ALLOWED = new Set(["ViewContent", "InitiateCheckout", "Contact"]);
const clip = (s: unknown, n = 200) => String(s ?? "").trim().slice(0, n);

// Only plain, short custom_data values are forwarded.
const cleanCustom = (raw: unknown): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  if (typeof r.value === "number" && r.value >= 0 && r.value < 1e6) out.value = Math.round(r.value);
  if (r.currency === "MDL") out.currency = "MDL";
  if (typeof r.content_name === "string") out.content_name = clip(r.content_name, 160);
  if (r.content_type === "product") out.content_type = "product";
  if (Array.isArray(r.content_ids)) out.content_ids = r.content_ids.slice(0, 5).map((x) => clip(x, 60));
  if (typeof r.num_items === "number") out.num_items = Math.max(1, Math.min(99, Math.round(r.num_items)));
  if (Array.isArray(r.contents))
    out.contents = r.contents.slice(0, 5).map((c) => ({
      id: clip((c as { id?: unknown })?.id, 60),
      quantity: Math.max(1, Math.min(99, Math.round(Number((c as { quantity?: unknown })?.quantity) || 1))),
    }));
  return out;
};

export const handleTrack = async (req: Request, env: TrackEnv, ctx?: { waitUntil: (p: Promise<unknown>) => void }) => {
  let d: Record<string, unknown>;
  try {
    d = await req.json();
  } catch {
    return json({ ok: false }, 400);
  }
  const eventName = clip(d.eventName, 40);
  const eventId = clip(d.eventId, 80);
  if (!ALLOWED.has(eventName) || !eventId) return json({ ok: false }, 400);
  if (!env.META_CAPI_TOKEN) return json({ ok: true });

  const task = (async () => {
    const content = mergeContent(await getContent(env).catch(() => null));
    await sendEventToCapi(env, {
      pixelId: content.tracking.metaPixelId.replace(/\D/g, ""),
      eventName,
      eventId,
      url: clip(d.url, 500),
      fbp: clip(d.fbp, 200),
      fbc: clip(d.fbc, 400),
      ip: req.headers.get("CF-Connecting-IP") ?? "",
      userAgent: req.headers.get("User-Agent") ?? "",
      visitorId: clip(d.vid, 80),
      customData: cleanCustom(d.customData),
    });
  })();
  if (ctx) ctx.waitUntil(task);
  else await task;
  return json({ ok: true });
};

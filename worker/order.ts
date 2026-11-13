// POST /api/order — sends the order to Telegram and stores it in KV (visible in
// /admin). The order counts as accepted when at least one of the two worked,
// so neither a Telegram nor a KV outage loses an order on its own.
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (optional while testing).

import { type AdminEnv, json, saveOrder, getContent } from "./admin";
import { type CapiEnv, sendLeadToCapi } from "./capi";
import { mergeContent } from "../src/data/siteContent";

export interface OrderEnv extends AdminEnv, CapiEnv {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

interface OrderPayload {
  fullName?: string;
  phone?: string;
  county?: string;
  city?: string;
  address?: string;
  items?: { name?: string; quantity?: number; price?: number }[];
  total?: number;
  discount?: { percent?: number; amount?: number };
  delivery?: string;
  deliveryMethod?: string;
  deliveryFee?: number;
  source?: string;
  meta?: { eventId?: string; fbp?: string; fbc?: string; url?: string; vid?: string };
}

const clip = (s: unknown, n = 200) => String(s ?? "").trim().slice(0, n);
const esc = (s: unknown) => clip(s, 300).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const handleOrder = async (req: Request, env: OrderEnv, ctx?: { waitUntil: (p: Promise<unknown>) => void }) => {
  let data: OrderPayload;
  try {
    data = await req.json();
  } catch {
    return json({ ok: false, error: "Date invalide." }, 400);
  }

  const phone = clip(data.phone, 20).replace(/\D/g, "");
  // only the phone is required (name and address are optional free text)
  if (phone.length < 8) {
    return json({ ok: false, error: "Date incomplete." }, 400);
  }

  const items = (Array.isArray(data.items) ? data.items : []).slice(0, 20).map((i) => ({
    name: clip(i.name, 160) || "Produs",
    quantity: Math.max(1, Math.min(99, Number(i.quantity) || 1)),
    price: Math.max(0, Number(i.price) || 0),
  }));
  const total = Math.max(0, Number(data.total) || items.reduce((s, i) => s + i.price * i.quantity, 0));

  const discountPct = Math.max(0, Math.min(90, Math.round(Number(data.discount?.percent) || 0)));
  const discountAmount = Math.max(0, Math.round(Number(data.discount?.amount) || 0));
  const deliveryMethod = data.deliveryMethod === "pickup" ? "pickup" : data.deliveryMethod === "courier" ? "courier" : "";
  const deliveryFee = Math.max(0, Math.round(Number(data.deliveryFee) || 0));
  const order = {
    fullName: clip(data.fullName),
    phone,
    county: clip(data.county, 60),
    city: clip(data.city, 80),
    address: clip(data.address, 300),
    items,
    total,
    ...(discountAmount ? { discount: { percent: discountPct, amount: discountAmount } } : {}),
    ...(data.delivery ? { delivery: clip(data.delivery, 80) } : {}),
    ...(deliveryMethod ? { deliveryMethod, deliveryFee } : {}),
    source: clip(data.source, 60),
  };

  // Telegram notification.
  let sent = false;
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const itemsText = items.length
      ? items.map((i) => `• ${esc(i.name)} × ${i.quantity} — ${i.price ? `${i.price * i.quantity} lei` : "GRATUIT"}`).join("\n")
      : "• (produsul de pe pagină)";
    const text =
      `<b>📦 Comandă nouă — ${esc(new URL(req.url).hostname)}</b>\n\n` +
      `👤 <b>Client:</b> ${order.fullName ? esc(order.fullName) : "<i>nu a scris</i>"}\n` +
      `📞 <b>Tel:</b> ${esc(phone)}\n` +
      (order.county ? `📍 <b>Raion:</b> ${esc(order.county)}\n` : "") +
      (order.city ? `🏘️ <b>Localitate:</b> ${esc(order.city)}\n` : "") +
      `🏠 <b>Adresă:</b> ${order.address ? esc(order.address) : "<i>de precizat la telefon</i>"}\n\n` +
      `🛒 <b>Produse:</b>\n${itemsText}\n` +
      (discountAmount ? `🏷️ <b>Reducere ${discountPct}%:</b> −${discountAmount} lei\n` : "") +
      (data.delivery ? `${deliveryMethod === "pickup" ? "🏬" : "🚚"} <b>Livrare:</b> ${esc(clip(data.delivery, 80))}\n` : "") +
      (total
        ? `💰 <b>Total:</b> ${total} lei${
            deliveryMethod ? (deliveryFee ? ` (inclusiv livrare ${deliveryFee} lei)` : "") : data.delivery ? " (fără livrare)" : ""
          }\n`
        : "") +
      `💵 <b>Plată:</b> ${deliveryMethod === "pickup" ? "la ridicare" : "ramburs la livrare"}` +
      (order.source ? `\n🔗 <i>${esc(order.source)}</i>` : "");
    try {
      const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
      });
      sent = tg.ok;
      if (!tg.ok) console.error("Telegram error", tg.status, await tg.text().catch(() => ""));
    } catch (e) {
      console.error("Telegram fetch failed", e);
    }
  }

  // One KV write per order, Telegram result included (free plan: ~1000 writes/day).
  let stored = false;
  try {
    await saveOrder(env, {
      ...order,
      ...(env.TELEGRAM_BOT_TOKEN ? { telegram: sent ? ("sent" as const) : ("failed" as const) } : {}),
    });
    stored = true;
  } catch (e) {
    console.error("order store failed", e);
  }

  if (!stored && !sent) return json({ ok: false, error: "Trimiterea a eșuat." }, 502);

  // Lead → Meta Conversions API, after the answer is sent (never slows the order down)
  if (env.META_CAPI_TOKEN && data.meta?.eventId) {
    const task = (async () => {
      const content = mergeContent(await getContent(env).catch(() => null));
      // first line is always the cameras; the rest are accessories / gift
      const cameras = items[0]?.quantity || 1;
      await sendLeadToCapi(env, {
        pixelId: content.tracking.metaPixelId.replace(/\D/g, ""),
        eventId: clip(data.meta?.eventId, 80),
        url: clip(data.meta?.url, 500),
        fbp: clip(data.meta?.fbp, 200),
        fbc: clip(data.meta?.fbc, 400),
        ip: req.headers.get("CF-Connecting-IP") ?? "",
        userAgent: req.headers.get("User-Agent") ?? "",
        fullName: order.fullName,
        phone,
        city: order.city,
        county: order.county,
        value: total,
        quantity: cameras,
        productName: content.product.title,
        visitorId: clip(data.meta?.vid, 80),
      });
    })();
    if (ctx) ctx.waitUntil(task);
    else await task;
  }

  return json({ ok: true });
};

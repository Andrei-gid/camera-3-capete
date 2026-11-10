import { browserIds, newLeadEventId, rememberLeadEventId, visitorId } from "@/lib/metaPixel";
// Single place where every order form on the site sends its data.
// The request goes to /api/order (Cloudflare Pages Function), which forwards it
// to Telegram server-side, so no bot token is ever shipped to the browser.

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  fullName: string;
  phone: string;
  county: string;
  city: string;
  address: string;
  items?: OrderItem[];
  total?: number;
  discount?: { percent: number; amount: number }; // package discount, already taken out of total
  delivery?: string; // how delivery is charged, shown in Telegram
  deliveryMethod?: "courier" | "pickup";
  deliveryFee?: number; // lei, already included in total
  source?: string;
}

/**
 * Sends the order and resolves to true when the server accepted it.
 * Never throws: on any failure it resolves to false so callers can show
 * an error instead of losing the order silently.
 */
export const submitOrder = async (order: OrderData): Promise<boolean> => {
  try {
    // one id for the browser Lead event and the server-side (Conversions API) one
    const eventId = newLeadEventId();
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, meta: { eventId, ...browserIds(), url: location.href, vid: visitorId() } }),
      keepalive: true,
    });
    if (res.ok) rememberLeadEventId(eventId);
    return res.ok;
  } catch (err) {
    console.error("[order] submit failed:", err);
    return false;
  }
};

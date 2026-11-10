// Admin API: password login, site content, file uploads and stored orders.
// Storage is one Workers KV namespace (binding "KV"):
//   content          → JSON with the sections saved from /admin
//   media:<id>       → uploaded file (metadata: content type, name, size)
//   order:<revts>-…  → one order; key sorts newest first, JSON also kept in metadata
// Required secret: ADMIN_PASSWORD.

export interface KV {
  get(key: string, type: "json"): Promise<unknown>;
  get(key: string, type: "text"): Promise<string | null>;
  getWithMetadata<M>(key: string, type: "stream"): Promise<{ value: ReadableStream | null; metadata: M | null }>;
  put(key: string, value: string | ArrayBuffer, opts?: { metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list<M>(opts: { prefix: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; metadata?: M }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface AdminEnv {
  KV: KV;
  ADMIN_PASSWORD?: string;
}

const MAX_UPLOAD = 25 * 1024 * 1024; // KV value limit
const MAX_CONTENT = 512 * 1024;
const SESSION_DAYS = 7;
const COOKIE = "adm";

export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });

const enc = new TextEncoder();

const hmac = async (secret: string, data: string) => {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c]!);
};

// Constant-time comparison of two strings (hash first so lengths match).
const safeEqual = async (a: string, b: string) => {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
};

const sessionSecret = (env: AdminEnv) => `${env.ADMIN_PASSWORD}::session-v1`;

const readCookie = (req: Request, name: string) => {
  const m = (req.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : null;
};

export const isAdmin = async (req: Request, env: AdminEnv) => {
  if (!env.ADMIN_PASSWORD) return false;
  const token = readCookie(req, COOKIE);
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(sessionSecret(env), exp));
};

// Mutations must come from this site (SameSite cookie already blocks most CSRF).
const sameOrigin = (req: Request) => {
  const origin = req.headers.get("Origin");
  return !origin || origin === new URL(req.url).origin;
};

// ---------- public ----------

export const getContent = async (env: AdminEnv) => {
  try {
    return (await env.KV.get("content", "json")) ?? null;
  } catch {
    return null;
  }
};

export const handleContent = async (_req: Request, env: AdminEnv) =>
  json({ content: await getContent(env) }, 200, { "Cache-Control": "public, max-age=30" });

export const handleMedia = async (id: string, env: AdminEnv) => {
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) return new Response("Not Found", { status: 404 });
  const { value, metadata } = await env.KV.getWithMetadata<{ type?: string }>(`media:${id}`, "stream");
  if (!value) return new Response("Not Found", { status: 404 });
  return new Response(value, {
    headers: {
      "Content-Type": metadata?.type || "application/octet-stream",
      // ids never change content, so browsers and the edge may cache for a year
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

export interface StoredOrder {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  county: string;
  city: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  discount?: { percent: number; amount: number };
  delivery?: string;
  source?: string;
  telegram?: "sent" | "failed";
}

export const saveOrder = async (env: AdminEnv, order: Omit<StoredOrder, "id" | "createdAt">) => {
  const now = Date.now();
  const id = `${(9999999999999 - now).toString().padStart(13, "0")}-${crypto.randomUUID().slice(0, 8)}`;
  const record: StoredOrder = { id, createdAt: new Date(now).toISOString(), ...order };
  const text = JSON.stringify(record);
  // metadata (≤1 KB) lets the admin list orders without one read per order
  await env.KV.put(`order:${id}`, text, { metadata: text.length <= 1000 ? record : { id } });
  return record;
};

// ---------- admin ----------

const loginHandler = async (req: Request, env: AdminEnv) => {
  if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD nu este setat în Cloudflare." }, 500);
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !(await safeEqual(password, env.ADMIN_PASSWORD))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ error: "Parolă greșită." }, 401);
  }
  const exp = String(Date.now() + SESSION_DAYS * 86400_000);
  const token = `${exp}.${await hmac(sessionSecret(env), exp)}`;
  return json({ ok: true }, 200, {
    "Set-Cookie": `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`,
  });
};

const logoutHandler = () =>
  json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });

const saveContentHandler = async (req: Request, env: AdminEnv) => {
  const raw = await req.text();
  if (raw.length > MAX_CONTENT) return json({ error: "Conținut prea mare." }, 413);
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ error: "JSON invalid." }, 400);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return json({ error: "Format invalid." }, 400);
  await env.KV.put("content", JSON.stringify(data));
  return json({ ok: true });
};

const ALLOWED = /^(image\/(jpeg|png|webp|gif|avif|svg\+xml)|video\/(mp4|webm))$/;

const uploadHandler = async (req: Request, env: AdminEnv) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return json({ error: "Niciun fișier." }, 400);
  if (!ALLOWED.test(file.type)) return json({ error: `Tip neacceptat: ${file.type || "necunoscut"}` }, 415);
  if (file.size > MAX_UPLOAD) return json({ error: "Fișier mai mare de 25 MB." }, 413);
  const id = crypto.randomUUID();
  await env.KV.put(`media:${id}`, await file.arrayBuffer(), {
    metadata: { type: file.type, name: file.name.slice(0, 120), size: file.size },
  });
  return json({ url: `/media/${id}` });
};

const deleteMediaHandler = async (id: string, env: AdminEnv) => {
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) return json({ error: "Id invalid." }, 400);
  await env.KV.delete(`media:${id}`);
  return json({ ok: true });
};

const ordersHandler = async (req: Request, env: AdminEnv) => {
  const cursor = new URL(req.url).searchParams.get("cursor") || undefined;
  const page = await env.KV.list<StoredOrder | { id: string }>({ prefix: "order:", limit: 50, cursor });
  const orders = await Promise.all(
    page.keys.map(async (k) => {
      const m = k.metadata as StoredOrder | undefined;
      if (m && "createdAt" in m) return m;
      return (await env.KV.get(k.name, "json")) as StoredOrder | null;
    }),
  );
  return json({ orders: orders.filter(Boolean), cursor: page.list_complete ? null : page.cursor });
};

const deleteOrderHandler = async (id: string, env: AdminEnv) => {
  if (!/^[0-9]{13}-[a-f0-9]{8}$/.test(id)) return json({ error: "Id invalid." }, 400);
  await env.KV.delete(`order:${id}`);
  return json({ ok: true });
};

/** Routes everything under /api/admin/*. Returns null for unknown paths. */
export const handleAdmin = async (req: Request, env: AdminEnv, path: string): Promise<Response | null> => {
  const m = req.method;
  if (path === "/api/admin/login" && m === "POST") return sameOrigin(req) ? loginHandler(req, env) : json({}, 403);
  if (path === "/api/admin/logout" && m === "POST") return logoutHandler();

  if (!path.startsWith("/api/admin/")) return null;
  if (!(await isAdmin(req, env))) return json({ error: "Neautorizat." }, 401);
  if (m !== "GET" && !sameOrigin(req)) return json({ error: "Origine invalidă." }, 403);

  if (path === "/api/admin/session" && m === "GET") return json({ ok: true });
  if (path === "/api/admin/content" && m === "PUT") return saveContentHandler(req, env);
  if (path === "/api/admin/upload" && m === "POST") return uploadHandler(req, env);
  if (path === "/api/admin/orders" && m === "GET") return ordersHandler(req, env);
  const media = path.match(/^\/api\/admin\/media\/([^/]+)$/);
  if (media && m === "DELETE") return deleteMediaHandler(media[1], env);
  const order = path.match(/^\/api\/admin\/orders\/([^/]+)$/);
  if (order && m === "DELETE") return deleteOrderHandler(order[1], env);
  return json({ error: "Not found" }, 404);
};

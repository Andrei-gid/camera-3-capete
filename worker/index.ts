// Cloudflare Worker entry. /api/* and /media/* are handled here; everything
// else is the static site from ./dist (see wrangler.jsonc).
import { handleAdmin, handleContent, handleMedia, json } from "./admin";
import { handleOrder, type OrderEnv } from "./order";
import { handleChat, type ChatEnv } from "./chat";
import { handleTrack } from "./track";

type Env = OrderEnv &
  ChatEnv & {
    ASSETS: { fetch: (request: Request) => Promise<Response> };
  };

export default {
  async fetch(request: Request, env: Env, ctx: { waitUntil: (p: Promise<unknown>) => void }): Promise<Response> {
    const { pathname } = new URL(request.url);
    const method = request.method;

    try {
      if (pathname.startsWith("/media/") && method === "GET") {
        return await handleMedia(pathname.slice("/media/".length), env);
      }
      if (pathname === "/api/content" && method === "GET") return await handleContent(request, env);
      if (pathname === "/api/order" && method === "POST") return await handleOrder(request, env, ctx);
      if (pathname === "/api/chat" && method === "POST") return await handleChat(request, env);
      if (pathname === "/api/track" && method === "POST") return await handleTrack(request, env, ctx);
      if (pathname.startsWith("/api/admin/")) {
        const res = await handleAdmin(request, env, pathname);
        if (res) return res;
      }
      if (pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
    } catch (e) {
      console.error("worker error", pathname, e);
      return json({ error: "Eroare de server." }, 500);
    }

    return env.ASSETS.fetch(request);
  },
};

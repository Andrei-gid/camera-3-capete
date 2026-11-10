# Camera landing

Landing page for the 3-lens outdoor security camera (zoom hibrid 10x, PTZ, IP66).
Design is the same as sellex.ro; content, product data and order flow are for the camera.

- Hosting: Cloudflare Workers (free plan)
- Admin panel: `/admin` (password = secret `ADMIN_PASSWORD`) — product, prices,
  photos/video, all texts, contacts, pixel ID, orders list
- Storage: Workers KV (binding `KV`) — content JSON, uploaded files (`/media/<id>`), orders
- Orders: all forms → `/api/order` → Telegram + saved in KV (shown in /admin)
- Chat assistant: `/api/chat` → Google Gemini, facts taken from the admin content
- Defaults for every field: `src/data/siteContent.ts`

## Deploy on Cloudflare (Workers)

The project is connected as a Worker with Git deploys:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy` (reads `wrangler.jsonc`)
- `wrangler.jsonc` serves the Vite build from `./dist` as a single-page app
  and sends `/api/*` to `worker/index.ts`, which calls the handlers in `functions/api/`.

Secrets: Worker → **Settings → Variables and Secrets** → **Add** (type *Secret*):

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | password for /admin (long, random) |
| `TELEGRAM_BOT_TOKEN` | token of the orders bot, from @BotFather |
| `TELEGRAM_CHAT_ID` | id of the chat that receives orders |
| `GEMINI_API_KEY` | free key from https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | optional, default `gemini-2.5-flash` |

Secrets apply immediately; no redeploy needed. Custom domain: **Settings → Domains & Routes**.

## Free-plan limits to keep in mind

- KV: ~1000 writes/day (each order, upload and admin save = 1 write)
- One uploaded file: up to 25 MB
- Admin changes reach every visitor within about a minute

## Local development

```
npm install
npm run dev
```

`/api/*` functions only run on Cloudflare (or locally with `npx wrangler pages dev dist`).

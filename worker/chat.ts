// POST /api/chat — product assistant powered by Google Gemini.
// Facts (price, specs, contacts) come from the content saved in /admin,
// so the assistant never contradicts the page.
// Secret: GEMINI_API_KEY. Optional: GEMINI_MODEL.

import { type AdminEnv, json, getContent } from "./admin";
import { mergeContent, formatPhone, getPackages, getAddons, packageDiscount, fillAssistantVars, type SiteContent } from "../src/data/siteContent";

export interface ChatEnv extends AdminEnv {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_MODEL = "gemini-2.5-flash";

const buildPrompt = (c: SiteContent) => {
  const specs = c.specs.map((s) => `- ${s.title}: ${s.detail}`).join("\n");
  const oldPrice = c.product.oldPrice ? ` (preț vechi ${c.product.oldPrice} lei)` : "";
  const packList = getPackages(c).filter((p) => p.qty > 1);
  const packs = packList.length ? ` Oferte la cantitate: ${packList.map((p) => `${p.label} (${p.qty} camere) — ${p.price} lei${packageDiscount(p, c.product.price) ? ` (-${packageDiscount(p, c.product.price)}% la camere; accesoriile și livrarea nu au reducere)` : ""}`).join("; ")}.` : "";
  const extras = getAddons(c);
  const addons = extras.length ? ` Accesorii opționale (se adaugă câte unul pentru fiecare cameră): ${extras.map((a) => `${a.title} — ${a.price} lei`).join("; ")}.` : "";
  const gift = c.gift?.enabled && c.gift.title ? ` Cadou: ${c.gift.title} gratuit pentru fiecare cameră comandată.` : "";
  const contact = c.contact.phone ? `Telefon: ${formatPhone(c.contact.phone)}.` : "";
  return `Ești asistentul virtual al magazinului. Răspunzi DOAR în limba română, politicos, scurt (maxim 4-5 propoziții) și cu ton profesionist.
Produsul vândut: ${c.product.title} — ${c.product.subtitle}.
Caracteristici:
${specs}
Preț: ${c.product.price} lei / cameră${oldPrice}.${packs}${addons}${gift} Plata se face DOAR ramburs, la livrare (fără plată online). Livrare prin curier în toată Moldova, ${c.delivery.free ? "gratuită" : `achitată separat (${c.delivery.paidText}). ${c.delivery.note ?? ""}`}, de obicei în 24-48 ore lucrătoare. Clientul poate verifica coletul la livrare.
Avantaje afișate pe site: ${c.trust.map((t) => t.text).join(", ")}.
${contact} Vânzător: ${c.contact.company}.
Pentru a comanda, clientul completează formularul de pe pagină (nume, telefon, raion, localitate, adresă) și apasă „Comandă acum”.
Răspunsuri aprobate de magazin (folosește-le ca sursă principală):
${c.assistant.faq.map((f) => `Î: ${f.q}\nR: ${fillAssistantVars(f.a, c)}`).join("\n")}
Nu inventa informații pe care nu le ai (rezoluție exactă, accesorii). Dacă nu știi, spune că un operator îl va contacta după comandă pentru detalii. Nu discuta subiecte fără legătură cu produsul.`;
};

export const handleChat = async (req: Request, env: ChatEnv) => {
  if (!env.GEMINI_API_KEY) return json({ error: "Asistentul nu este configurat." }, 500);

  let messages: ChatMessage[];
  try {
    ({ messages } = await req.json());
  } catch {
    return json({ error: "Mesaj invalid." }, 400);
  }
  if (!Array.isArray(messages) || messages.length === 0) return json({ error: "Mesaj invalid." }, 400);

  const content = mergeContent(await getContent(env));
  const contents = messages.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content ?? "").slice(0, 2000) }],
  }));

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildPrompt(content) }] },
      contents,
      // thinkingBudget 0: on 2.5 models "thinking" otherwise eats the output
      // budget and the reply comes back empty or cut off
      generationConfig: { maxOutputTokens: 600, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });

  if (res.status === 429) return json({ error: "Prea multe întrebări. Încercați din nou." }, 429);
  if (!res.ok) {
    console.error("Gemini error", res.status, await res.text().catch(() => ""));
    return json({ error: "Asistentul nu este disponibil momentan." }, 502);
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  return json({ reply: reply || "Nu am putut genera un răspuns. Încercați din nou." });
};

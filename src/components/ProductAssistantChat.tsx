import { useEffect, useRef, useState, FormEvent } from "react";
import { Camera, X, RotateCcw, Send, Loader2 } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { fillAssistantVars, formatPhone, matchFaq } from "@/data/siteContent";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "camera_assistant_chat_v1";

const loadMessages = (): ChatMessage[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Gemini sometimes answers with light markdown; show it as clean text.
const clean = (t: string) => t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\s*[*-]\s+/gm, "• ");

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ProductAssistantChat = () => {
  const c = useContent();
  // hide quick questions whose answer is empty (e.g. {cadou} with the gift switched off)
  const faq = c.assistant.faq.filter((f) => f.q.trim() && fillAssistantVars(f.a, c));
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist conversation in this browser
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* storage full or blocked */
    }
  }, [messages]);

  // Keep the newest message in view and the textarea focused
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);
  useEffect(() => {
    if (open && !busy) textareaRef.current?.focus();
  }, [open, busy]);

  // Answer when the AI is not available: the closest quick answer, else contacts.
  const fallback = (question: string) => {
    const hit = matchFaq(question, c);
    if (hit) return fillAssistantVars(hit, c);
    const phone = c.contact.phone ? formatPhone(c.contact.phone) : "";
    return phone
      ? `Pentru această întrebare vă răspunde un coleg: sunați la ${phone} (${c.contact.hours}). Puteți și să plasați comanda din formular — vă sunăm pentru confirmare și detalii.`
      : "Pentru această întrebare vă răspunde un coleg după ce plasați comanda — vă sunăm pentru confirmare și detalii.";
  };

  /** Quick question: instant, pre-written answer (works without AI). */
  const ask = async (i: number) => {
    if (busy) return;
    const f = faq[i];
    const next: ChatMessage[] = [...messages, { role: "user", content: f.q }];
    setMessages(next);
    setBusy(true);
    await wait(450);
    setMessages([...next, { role: "assistant", content: fillAssistantVars(f.a, c) }]);
    setBusy(false);
  };

  /** Free text: AI first, quick answers as a fallback — never leaves the question unanswered. */
  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setBusy(true);
    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) reply = clean(String(data.reply || ""));
      else console.warn("[assistant] AI unavailable:", res.status, data.error);
    } catch (err) {
      console.warn("[assistant] AI request failed:", err);
    }
    setMessages([...next, { role: "assistant", content: reply || fallback(t) }]);
    setBusy(false);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const reset = () => {
    setMessages([]);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Deschide asistentul"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full pl-3 pr-4 py-3
            bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-900 font-semibold text-sm
            shadow-[0_10px_40px_-10px_rgba(255,180,50,0.8)] border border-amber-200/60
            hover:scale-105 active:scale-95 transition-transform"
        >
          <Camera className="w-5 h-5" />
          <span>Întrebări?</span>
        </button>
      )}

      {open && (
        <div
          className="fixed z-50 inset-x-2 bottom-2 top-16 md:inset-auto md:bottom-5 md:right-5 md:w-[380px] md:h-[560px]
            flex flex-col rounded-3xl overflow-hidden border border-white/15
            bg-slate-950/85 backdrop-blur-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
          role="dialog"
          aria-label="Asistent cameră"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-300">
              <Camera className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-orbitron text-sm font-bold text-white tracking-wide">Asistent Cameră</p>
              <p className="text-sm text-white/60">Răspunsuri rapide despre cameră</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                aria-label="Conversație nouă"
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Închide"
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transcript */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="m-auto flex flex-col items-center gap-3 text-center">
                <Camera className="w-8 h-8 text-amber-300" />
                <p className="font-semibold text-white">Cu ce vă pot ajuta?</p>
                <p className="text-sm text-white/60">{c.assistant.greeting}</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {faq.map((f, i) => (
                    <button
                      key={f.q}
                      type="button"
                      onClick={() => void ask(i)}
                      className="text-sm px-3 py-1.5 rounded-full border border-amber-300/40 text-amber-200 hover:bg-amber-400/10"
                    >
                      {f.q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[95%]"}>
                  <p
                    className={`whitespace-pre-wrap text-sm ${
                      m.role === "user" ? "bg-amber-400 text-slate-900 rounded-2xl px-3 py-2" : "text-white/90"
                    }`}
                  >
                    {m.content}
                  </p>
                </div>
              ))
            )}
            {busy && <p className="self-start text-sm text-white/50 animate-pulse">Se gândește...</p>}
          </div>

          {/* Quick questions not asked yet */}
          {messages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-3 pt-2 pb-1 [scrollbar-width:none]">
              {faq.map((f, i) =>
                messages.some((m) => m.role === "user" && m.content === f.q) ? null : (
                  <button
                    key={f.q}
                    type="button"
                    disabled={busy}
                    onClick={() => void ask(i)}
                    className="shrink-0 text-sm px-3 py-1.5 rounded-full border border-amber-300/40 text-amber-200 hover:bg-amber-400/10 disabled:opacity-50"
                  >
                    {f.q}
                  </button>
                ),
              )}
            </div>
          )}

          {/* Composer */}
          <form onSubmit={onSubmit} className="p-3 border-t border-white/10">
            <div className="flex items-end gap-2 rounded-2xl bg-white/5 border border-white/15 p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder="Scrieți întrebarea..."
                className="flex-1 resize-none bg-transparent text-white placeholder:text-white/40 min-h-[44px] max-h-32 px-2 py-2 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Trimite"
                className="w-10 h-10 shrink-0 rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300 disabled:opacity-50 flex items-center justify-center"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ProductAssistantChat;

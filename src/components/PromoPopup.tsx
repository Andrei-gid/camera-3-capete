import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Gift, ShieldCheck, Truck, Wallet, X } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { getAddons, deliveryFee } from "@/data/siteContent";
import { PROMO, promoActive, promoFor, promoPreview } from "@/data/promo";
import { DEFAULT_CUTOUT } from "@/components/effects/ProductRender";
import "./PromoPopup.css";

// Limited-time offer pop-up (see data/promo.ts).
// Shown once per day per browser, after the visitor has spent PROMO.popupDelayMs
// on the page with the tab visible, and never while they are typing in a form.
// The button opens the checkout page with 1 camera selected; the promo is then
// applied there automatically (free microSD + free courier).

const SEEN_KEY = `luxcam_promo_seen_${PROMO.id}`;
const ONE_DAY = 24 * 60 * 60 * 1000;

const seenRecently = () => {
  try {
    const t = Number(localStorage.getItem(SEEN_KEY) || 0);
    return Date.now() - t < ONE_DAY;
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {
    /* private mode: the pop-up may show again, that's fine */
  }
};

const isTyping = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
};

/** Days / hours / minutes / seconds left until `end`, ticking every second. */
export const useCountdown = (end: number) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const left = Math.max(0, end - now);
  const s = Math.floor(left / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, left };
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Values of the offer for 1 camera, taken from the live content. */
const usePromoNumbers = () => {
  const c = useContent();
  const card = getAddons(c).find((a) => a.id === PROMO.giftAddonId);
  const courier = PROMO.freeDelivery ? deliveryFee(c, "courier") : 0;
  const price = c.product.price;
  const cardValue = card?.price ?? 0;
  return { price, card, cardValue, courier, full: price + cardValue + courier, saved: cardValue + courier };
};

export const PromoPopup = () => {
  const navigate = useNavigate();
  const c = useContent();
  const n = usePromoNumbers();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const cd = useCountdown(PROMO.end);
  const preview = promoPreview();

  // timer: counts only while the tab is visible; waits if the visitor is typing
  useEffect(() => {
    if (!promoActive()) return;
    if (new URLSearchParams(window.location.search).has("ad")) return; // ad-recording mode
    if (!preview && seenRecently()) return;
    const need = preview ? 1500 : PROMO.popupDelayMs;
    let spent = 0;
    let last = performance.now();
    const t = window.setInterval(() => {
      const now = performance.now();
      if (document.visibilityState === "visible") spent += now - last;
      last = now;
      if (spent >= need && !isTyping()) {
        window.clearInterval(t);
        lastFocus.current = document.activeElement as HTMLElement | null;
        setOpen(true);
        if (!preview) markSeen();
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [preview]);

  const close = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => {
      setOpen(false);
      setLeaving(false);
      lastFocus.current?.focus?.();
    }, 260);
  }, []);

  // ESC, scroll lock, focus
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const f = window.setTimeout(() => ctaRef.current?.focus({ preventScroll: true }), 350);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
      window.clearTimeout(f);
    };
  }, [open, close]);

  const order = () => {
    setOpen(false);
    document.documentElement.style.overflow = "";
    navigate("/order", { state: { quantity: PROMO.qty } });
    window.scrollTo(0, 0);
  };

  if (!open || cd.left <= 0) return null;
  const cam = c.media.specsImage || DEFAULT_CUTOUT;

  return createPortal(
    <div className={`pp-root ${leaving ? "pp-out" : ""}`} role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="pp-card" role="dialog" aria-modal="true" aria-labelledby="pp-title" aria-describedby="pp-desc">
        <div className="pp-glow" aria-hidden />
        <button type="button" className="pp-x" onClick={close} aria-label="Închide">
          <X />
        </button>

        <div className="pp-head">
          <span className="pp-live">
            <i />
            Ofertă limitată
          </span>
        </div>
        <p className="pp-week">
          Doar această săptămână
          <span>{PROMO.datesLabel}</span>
        </p>

        {/* product stage */}
        <div className="pp-stage" aria-hidden>
          <span className="pp-ring pp-r1" />
          <span className="pp-ring pp-r2" />
          <span className="pp-ring pp-r3" />
          <img className="pp-cam" src={cam} alt="" draggable={false} />
          {n.card?.image && <img className="pp-sd" src={n.card.image} alt="" draggable={false} />}
          <span className="pp-floor" />
        </div>

        <h2 id="pp-title" className="pp-title">
          Comandați acum —<br />
          <span>2 cadouri incluse</span>
        </h2>
        <p id="pp-desc" className="pp-sub">
          Camera cu 3 capete rotative · prețul rămâne {n.price} lei
        </p>

        <ul className="pp-perks">
          {n.card && (
            <li>
              <span className="pp-ico">
                <Gift />
              </span>
              <span className="pp-pt">
                <b>{n.card.title}</b>
                <small>
                  <s>{n.cardValue} lei</s> <em>cadou</em>
                </small>
              </span>
            </li>
          )}
          {n.courier > 0 && (
            <li>
              <span className="pp-ico">
                <Truck />
              </span>
              <span className="pp-pt">
                <b>Livrare expres la domiciliu</b>
                <small>
                  <s>{n.courier} lei</s> <em>gratuit</em>
                </small>
              </span>
            </li>
          )}
        </ul>

        <div className="pp-price">
          <div>
            <small>Prețul dvs.</small>
            <b>
              {n.price}
              <span>lei</span>
            </b>
          </div>
          {n.saved > 0 && (
            <div className="pp-save">
              <s>{n.full} lei</s>
              <em>Economisiți {n.saved} lei</em>
            </div>
          )}
        </div>

        <WeekTimer cd={cd} />

        <button ref={ctaRef} type="button" className="pp-cta" onClick={order}>
          <span>Comandă acum</span>
          <span className="pp-cta-p">
            {n.price} lei <ArrowRight />
          </span>
        </button>
        <button type="button" className="pp-later" onClick={close}>
          Nu acum
        </button>

        <div className="pp-trust">
          <span>
            <Wallet /> Plată la livrare
          </span>
          <span>
            <ShieldCheck /> Verificare colet
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
};

/** The promo week as one cell per day (today highlighted) + hh:mm:ss left. */
const WeekTimer = ({ cd }: { cd: ReturnType<typeof useCountdown> }) => {
  const days = promoDays();
  const today = days.findIndex((d) => d.today);
  const left = days.length - Math.max(0, today);
  return (
    <div className="pp-timer" aria-label="Timp rămas până la sfârșitul ofertei">
      <div className="pp-timer-top">
        <small>{left > 1 ? `Mai sunt ${left} zile din ofertă` : "Ultima zi a ofertei!"}</small>
        <span className="pp-clock">
          {cd.d > 0 && (
            <>
              <b>{cd.d}</b>
              <i>z</i>
            </>
          )}
          <b>{pad(cd.h)}</b>
          <i>:</i>
          <b>{pad(cd.m)}</b>
          <i>:</i>
          <b key={cd.s} className="pp-sec">
            {pad(cd.s)}
          </b>
        </span>
      </div>
      <ol className="pp-days">
        {days.map((d, i) => (
          <li key={d.n} className={i < today ? "pp-past" : d.today ? "pp-today" : ""}>
            <small>{d.w}</small>
            <b>{d.n}</b>
          </li>
        ))}
      </ol>
    </div>
  );
};

/** Calendar days of the promo in Chișinău time: weekday + day number, today flagged. */
const promoDays = () => {
  const fmt = (t: number, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Chisinau", ...o }).format(t);
  const todayKey = fmt(Date.now(), { year: "numeric", month: "2-digit", day: "2-digit" });
  const out: { n: string; w: string; today: boolean }[] = [];
  for (let t = PROMO.start + 12 * 3600e3; t < PROMO.end; t += 24 * 3600e3) {
    out.push({
      n: fmt(t, { day: "numeric" }),
      w: fmt(t, { weekday: "short" }).replace(".", "").slice(0, 3),
      today: fmt(t, { year: "numeric", month: "2-digit", day: "2-digit" }) === todayKey,
    });
  }
  return out;
};

/** One-line promo strip for the order forms and the hero (only for 1 camera while the promo runs). */
export const PromoStrip = ({ qty, className = "" }: { qty: number; className?: string }) => {
  const n = usePromoNumbers();
  const cd = useCountdown(PROMO.end);
  if (!promoFor(qty) || cd.left <= 0) return null;
  const parts = [n.card ? `${n.card.title} cadou` : "", n.courier > 0 ? "livrare gratuită" : ""].filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className={`pp-strip ${className}`}>
      <span className="pp-strip-ico">
        <Gift />
      </span>
      <span className="pp-strip-t">
        <b>Promoția săptămânii · {PROMO.datesLabel}</b>
        <small>
          {parts.join(" + ")} · mai sunt {cd.d > 0 ? `${cd.d} z ` : ""}
          {pad(cd.h)}:{pad(cd.m)}:{pad(cd.s)}
        </small>
      </span>
    </div>
  );
};

export default PromoPopup;

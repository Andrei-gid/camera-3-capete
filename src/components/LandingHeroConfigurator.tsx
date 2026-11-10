import { useState, useRef, useEffect } from "react";
import { sized } from "@/lib/img";
import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import { useReducedMotion } from "@/hooks/useScrollFx";
import { Truck, ShieldCheck, Wallet, Zap } from "lucide-react";
import { useCameraProduct } from "@/hooks/useCameraProduct";
import BigOrderButton from "@/components/BigOrderButton";
import { useContent } from "@/hooks/useContent";
import { GiftPhotoBadge } from "@/components/GiftPromo";
import { OfferStage, PackageTiles, usePackages } from "@/components/OfferConfigurator";

export const LandingHeroConfigurator = () => {
  const navigate = useNavigate();
  const product = useCameraProduct();
  const content = useContent();
  const pk = usePackages();
  const [pkg, setPkg] = useState(pk.initial);
  // keep the selection valid when packages arrive from /admin
  useEffect(() => {
    setPkg((cur) => pk.list.find((p) => p.qty === cur.qty) ?? pk.initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pk.list)]);
  // hero photos from /admin (first = main); the thumbnail row shows up to 5
  const GALLERY = product.images.slice(0, 5);
  const THUMBS = GALLERY;
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const [rippling, setRippling] = useState(false);

  // Magnetic CTA
  const btnRef = useRef<HTMLButtonElement>(null);
  const [magnet, setMagnet] = useState({ x: 0, y: 0 });

  // Photo "flies" from the tapped thumbnail into the main window (View
  // Transitions API). Browsers without it keep the original ripple effect.
  const reducedMotion = useReducedMotion();
  const [flying, setFlying] = useState<number | null>(null);
  const morphOn = content.effects.motion.galleryMorph && !reducedMotion;

  const selectImage = (i: number) => {
    if (i === activeIdx || rippling || flying !== null) return;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
    if (morphOn && typeof doc.startViewTransition === "function") {
      flushSync(() => setFlying(i)); // only the tapped thumbnail carries the shared name
      const vt = doc.startViewTransition(() => {
        flushSync(() => {
          setFlying(null); // now only the main photo carries it
          setPrevIdx(i);
          setActiveIdx(i);
        });
      });
      vt.finished.catch(() => {}).finally(() => setFlying(null));
      return;
    }
    setPrevIdx(activeIdx);
    setActiveIdx(i);
    setRippling(true);
    window.setTimeout(() => setRippling(false), 650);
  };


  const handleOrder = () => {
    navigate("/order", { state: { quantity: pkg.qty } });
  };

  const handleBtnMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    setMagnet({ x: x * 0.18, y: y * 0.35 });
  };
  const handleBtnLeave = () => setMagnet({ x: 0, y: 0 });

  return (
    <section className="relative w-full px-4 md:px-0 py-6 md:py-10">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
        <div className="absolute -top-20 -left-10 w-[420px] h-[420px] rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute top-40 -right-10 w-[460px] h-[460px] rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[360px] h-[360px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10 items-start">
        {/* LEFT — Fluid Image Gallery (heavy liquid glass) */}
        <div className="relative rounded-[28px] border border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-[0_30px_80px_-25px_rgba(0,0,0,0.7)] p-3 md:p-5 overflow-hidden">
          {/* Inner light refraction */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          <div className="pointer-events-none absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10">
            {/* Previous image — fades + ripples out */}
            <img
              key={`prev-${prevIdx}`}
              src={sized(GALLERY[prevIdx], 1000)}
              alt=""
              aria-hidden
              className={`absolute inset-0 w-full h-full object-cover ${
                rippling ? "ripple-out" : "opacity-0"
              }`}
            />
            {/* Active image — ripples in */}
            <img
              key={`active-${activeIdx}`}
              src={sized(GALLERY[activeIdx], 1000)}
              alt={content.product.title}
              className={`absolute inset-0 w-full h-full object-cover ${
                rippling ? "ripple-in" : "opacity-100"
              }`}
              style={morphOn && flying === null ? { viewTransitionName: "hero-photo" } : undefined}
            />
            {/* Liquid sheen overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 mix-blend-overlay" />
            <GiftPhotoBadge />
          </div>

          {/* Thumbnails */}
          <div className="relative mt-3 md:mt-4 grid grid-cols-5 gap-2 md:gap-3">
            {THUMBS.map((src, i) => {
              const thumbIdx = i;
              const active = thumbIdx === activeIdx;
              return (
                <button
                  key={i}
                  onClick={() => selectImage(thumbIdx)}
                  aria-label={`Imagine ${i + 1}`}
                  className={`aspect-square rounded-xl overflow-hidden border transition-all duration-300 ${
                    active
                      ? "border-amber-400/80 shadow-[0_0_18px_rgba(255,180,50,0.35)] opacity-100"
                      : "border-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={sized(src, 240)}
                    loading="lazy"
                    decoding="async"
                    alt=""
                    className="w-full h-full object-cover"
                    style={flying === thumbIdx ? { viewTransitionName: "hero-photo" } : undefined}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Order Confirmation Center (monolithic liquid glass) */}
        <div className="relative rounded-[28px] border border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-[0_30px_80px_-25px_rgba(0,0,0,0.7)] p-6 md:p-9 overflow-hidden">
          {/* Inner light refraction */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/10 via-transparent to-white/[0.02]" />
          <div className="pointer-events-none absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="pointer-events-none absolute -bottom-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative">
            {pk.initial.badge && pk.initial.qty > 1 && (
              <button
                type="button"
                onClick={() => setPkg(pk.initial)}
                className="mb-3 inline-flex items-center gap-2 rounded-full holo-border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                {pk.initial.badge} · {pk.initial.price} lei
              </button>
            )}
            <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">
              {content.product.title}
            </h1>
            <p className="mt-1 text-white/55 text-sm md:text-base tracking-[0.18em] uppercase">
              {content.product.subtitle}
            </p>

            {/* Interactive offer: how many cameras? */}
            <div className="mt-6">
              <p className="font-orbitron text-base md:text-lg font-bold text-white">Câte camere doriți?</p>
              <p className="mt-0.5 mb-3 text-[12px] text-white/55">Cu cât luați mai multe, cu atât prețul pe cameră scade.</p>
              <PackageTiles list={pk.list} unit={pk.unit} value={pkg} onChange={setPkg} />
              <OfferStage pkg={pkg} unit={pk.unit} />
            </div>

            {/* Trust chips */}
            <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: <Truck className="w-4 h-4 text-amber-400" />, top: "Livrare", val: content.delivery.free ? "Gratuită" : content.delivery.short || "Prin curier" },
                { icon: <ShieldCheck className="w-4 h-4 text-amber-400" />, top: "Verificare colet", val: "Gratuită" },
                { icon: <Wallet className="w-4 h-4 text-amber-400" />, top: "Plată", val: "La livrare" },
              ].map((t) => (
                <li key={t.top} className="flex flex-col items-center gap-1 rounded-xl bg-white/[0.04] border border-white/10 px-1.5 py-2.5">
                  {t.icon}
                  <span className="text-xs leading-tight text-white/55">{t.top}</span>
                  <span className="text-[12px] font-semibold text-emerald-300 leading-none">{t.val}</span>
                </li>
              ))}
            </ul>

            {/* Big order CTA */}
            <div className="mt-6">
              <BigOrderButton price={pkg.price} sub="Plată la livrare · verificare colet" onClick={handleOrder} />
            </div>

            {!content.delivery.free && content.delivery.note && (
              <p className="mt-3 text-center text-white/70 text-sm leading-snug">{content.delivery.note}</p>
            )}

            <p className="mt-4 text-center text-white/40 text-[13px] tracking-wide">
              {content.product.sellerLine}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHeroConfigurator;

import { useEffect, useRef, useState } from "react";
import { Check, Gift } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { useReducedMotion } from "@/hooks/useScrollFx";
import { DEFAULT_CUTOUT } from "@/components/effects/ProductRender";
import { useGift, giftItem } from "@/components/GiftPromo";
import { defaultPackage, getPackages, packageDiscount, type Package } from "@/data/siteContent";
import type { OrderItem } from "@/lib/order";
import { PROMO, promoFor } from "@/data/promo";

// Interactive "how many cameras?" offer: quantity tiles + a stage where the
// chosen package pops in (N cameras + N microSD cards, price counter, saving).

export const usePackages = () => {
  const c = useContent();
  const list = getPackages(c);
  return { list, unit: c.product.price, initial: defaultPackage(list) };
};

/** Order lines for a package (cameras + gift cards), for Telegram / admin. */
export const packageItems = (title: string, p: Package, giftTitle: string | null): OrderItem[] => [
  { name: p.qty > 1 ? `${title} — ${p.label}` : title, quantity: p.qty, price: Math.round((p.price / p.qty) * 100) / 100 },
  ...(giftTitle ? [giftItem(giftTitle, p.qty)] : []),
];

/** Smoothly counts from the previous value to `target`. */
export const useAnimatedNumber = (target: number, ms = 650) => {
  const reduced = useReducedMotion();
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduced) {
      setV(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const val = a + (target - a) * e;
      setV(val);
      from.current = val;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduced]);
  return Math.round(v);
};

const qtyWord = (n: number) => (n === 1 ? "cameră" : "camere");

/** 2×2 (or 4-across on wide screens) quantity tiles. */
export const PackageTiles = ({
  list,
  unit,
  value,
  onChange,
  compact = false,
}: {
  list: Package[];
  unit: number;
  value: Package;
  onChange: (p: Package) => void;
  compact?: boolean;
}) => (
  <div role="radiogroup" aria-label="Alegeți numărul de camere" className={`grid gap-2.5 ${["grid-cols-1", "grid-cols-1", "grid-cols-2", "grid-cols-3"][list.length] ?? "grid-cols-2"} ${compact ? "sm:grid-cols-4" : ""}`}>
    {list.map((p) => {
      const on = p.qty === value.qty;
      const off = packageDiscount(p, unit);
      return (
        <button
          key={p.qty}
          type="button"
          role="radio"
          aria-checked={on}
          onClick={() => onChange(p)}
          className={`offer-tile group relative rounded-2xl px-3 pt-3 pb-2.5 text-left transition-all duration-300 ${
            on ? "offer-tile-on scale-[1.02]" : "hover:-translate-y-0.5"
          } ${p.featured ? "holo-border" : "border border-white/12 bg-white/[0.04]"}`}
        >
          {p.badge && (
            <span className="absolute -top-2.5 right-2 whitespace-nowrap rounded-full bg-gradient-to-r from-rose-500 to-amber-400 px-2 py-[3px] text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_6px_16px_-6px_rgba(244,63,94,0.9)]">
              {p.badge}
            </span>
          )}
          <span className="flex items-start justify-between gap-2">
            <span className={`font-orbitron font-black leading-none ${compact ? "text-2xl" : "text-3xl"} ${on ? "text-cyan-200 drop-shadow-[0_0_14px_rgba(103,232,249,0.8)]" : "text-white"}`}>
              {p.label.includes("+") ? p.label.replace(/^[^\d]*/, "") : `×${p.qty}`}
            </span>
            <span
              className={`mt-0.5 w-5 h-5 shrink-0 rounded-full border flex items-center justify-center transition-all duration-300 ${
                on ? "bg-cyan-300 border-cyan-200 shadow-[0_0_14px_rgba(103,232,249,0.9)]" : "border-white/30"
              }`}
            >
              {on && <Check className="w-3 h-3 text-slate-900" strokeWidth={3} />}
            </span>
          </span>
          <span className="mt-1.5 block text-[13px] text-white/60">
            {p.qty} {qtyWord(p.qty)}
          </span>
          <span className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="font-orbitron text-base font-bold text-amber-300">{p.price} lei</span>
            {off > 0 && <span className="rounded-md bg-emerald-400/15 px-1 text-xs font-bold text-emerald-300">-{off}%</span>}
          </span>
        </button>
      );
    })}
  </div>
);

// Photo shown for the single-camera package (3-head camera with floodlights on)
const OFFER_PHOTO_1 = "/products/cam3-offer-1.webp";

/** Where the chosen package pops in. Re-mounts (re-animates) on every change. */
export const OfferStage = ({ pkg, unit }: { pkg: Package; unit: number }) => {
  const c = useContent();
  const gift = useGift();
  const reduced = useReducedMotion();
  const cam = c.media.specsImage || DEFAULT_CUTOUT;
  const price = useAnimatedNumber(pkg.price);
  const full = unit * pkg.qty;
  const off = packageDiscount(pkg, unit);
  const shown = Math.min(4, pkg.qty);

  // fan of cameras: x offset (% of stage), size, depth
  // back row first (smaller, higher, dimmer) so the front row paints over it
  const layout: Record<number, { x: number; w: number; b: number; back?: boolean }[]> = {
    1: [{ x: -4, w: 42, b: 8 }],
    2: [{ x: -17, w: 36, b: 8 }, { x: 13, w: 36, b: 8 }],
    3: [{ x: -28, w: 28, b: 16, back: true }, { x: 22, w: 28, b: 16, back: true }, { x: -4, w: 34, b: 7 }],
    4: [{ x: -32, w: 25, b: 17, back: true }, { x: 26, w: 25, b: 17, back: true }, { x: -17, w: 30, b: 7 }, { x: 9, w: 30, b: 7 }],
  };
  const cams = layout[shown];

  return (
    <div className="relative mt-4 overflow-hidden rounded-3xl border border-cyan-300/20 bg-[radial-gradient(ellipse_at_50%_35%,rgba(34,211,238,0.18),rgba(15,23,60,0.35)_55%,rgba(2,6,23,0.6))]">
      {/* floor grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-60"
        style={{
          backgroundImage: "linear-gradient(rgba(103,232,249,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.18) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          transform: "perspective(260px) rotateX(58deg)",
          transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      {/* scene: re-keyed so everything pops in again */}
      <div key={pkg.qty} className="relative aspect-[16/11]">
        {/* 1 camera: full-size photo of the camera filling the whole stage */}
        {pkg.qty === 1 && (
          <img
            src={OFFER_PHOTO_1}
            alt="1 cameră"
            className="offer-pop absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        )}
        {pkg.qty > 1 && <div aria-hidden className="absolute left-1/2 bottom-[9%] -translate-x-1/2 w-[70%] h-[8%] rounded-[50%] bg-cyan-300/25 blur-xl" />}
        {pkg.qty > 1 && cams.map((p, i) => (
          <div
            key={i}
            className="offer-pop absolute"
            style={{
              left: `${50 + p.x}%`,
              bottom: `${p.b}%`,
              width: `${p.w * 1.15}%`,
              transform: "translateX(-50%)",
              zIndex: 10 + i,
              animationDelay: reduced ? "0ms" : `${i * 90}ms`,
            }}
          >
            <img
              src={cam}
              alt={i === 0 ? `${pkg.qty} ${qtyWord(pkg.qty)}` : ""}
              aria-hidden={i > 0}
              className="w-full"
              style={{
                filter: `drop-shadow(0 22px 22px rgba(0,0,0,0.75))${p.back ? " brightness(0.7) saturate(0.9)" : ""}`,
              }}
              draggable={false}
            />
          </div>
        ))}

        {/* gift cards, one per camera */}
        {gift && (
          <div className={`absolute right-[3%] bottom-[5%] z-30 ${shown >= 3 ? "w-[19%]" : "w-[23%]"}`}>
            {Array.from({ length: shown }).map((_, i) => (
              <div
                key={i}
                className="offer-pop absolute bottom-0 left-0 w-full"
                style={{
                  transform: `translate(${-i * 9}%, ${-i * 12}%) rotate(${-14 + i * 7}deg)`,
                  zIndex: 30 - i,
                  animationDelay: reduced ? "0ms" : `${260 + i * 90}ms`,
                }}
              >
                <img
                  src={gift.image}
                  alt={i === 0 ? gift.title : ""}
                  aria-hidden={i > 0}
                  className="w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.7)]"
                  draggable={false}
                />
              </div>
            ))}
            <span className="invisible block aspect-[720/528]" />
          </div>
        )}

        {/* big ×N */}
        <span className="offer-pop absolute left-[4%] top-[6%] z-30">
          <span className="holo-text font-orbitron text-4xl sm:text-5xl font-black leading-none">×{pkg.qty}</span>
        </span>
        {off > 0 && (
          <span className="offer-pop absolute right-[4%] top-[7%] z-30 rounded-full bg-emerald-400 px-2.5 py-1 font-orbitron text-sm font-black text-slate-900 shadow-[0_0_22px_rgba(52,211,153,0.7)]" style={{ animationDelay: "180ms" }}>
            -{off}%
          </span>
        )}

        {/* laser pass on change */}
        {!reduced && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-40">
            <div className="scan-beam absolute inset-x-0 h-[2px] bg-cyan-300 shadow-[0_0_16px_4px_rgba(103,232,249,0.75)]" />
          </div>
        )}
      </div>

      {/* price + what is included */}
      <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-md px-4 py-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">{pkg.label}</p>
            <p className="font-orbitron text-4xl font-black leading-none text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.18)] tabular-nums">
              {price}
              <span className="ml-1 text-lg text-white/60">lei</span>
            </p>
          </div>
          <div className="text-right">
            {off > 0 && <s className="block text-sm text-white/40">{full} lei</s>}
            {pkg.qty > 1 && <p className="text-[13px] text-white/60">{Math.round(pkg.price / pkg.qty)} lei / cameră</p>}
            {off > 0 && <p className="text-sm font-bold text-emerald-300">Economisiți {full - pkg.price} lei</p>}
          </div>
        </div>
        {promoFor(pkg.qty) ? (
          <p className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-400/10 border border-emerald-300/35 px-2.5 py-1.5 text-[12px] text-white">
            <Gift className="w-4 h-4 shrink-0 text-emerald-300" />
            <span>
              Promoție {PROMO.datesLabel}: <b className="text-emerald-200">card microSD 64 GB cadou</b> + <b className="text-emerald-200">livrare gratuită</b>
            </span>
          </p>
        ) : !c.delivery.free && c.delivery.note && (
          <p className="mt-2 text-[13px] leading-snug text-white/65">{c.delivery.note}</p>
        )}
        {gift && (
          <p className="mt-2 flex items-center gap-2 rounded-xl bg-amber-400/10 border border-amber-300/30 px-2.5 py-1.5 text-[12px] text-white">
            <Gift className="w-4 h-4 shrink-0 text-amber-300" />
            <span>
              + <b className="text-amber-200">{pkg.qty > 1 ? `${pkg.qty}× ` : ""}{gift.title}</b> <span className="font-bold text-emerald-300">CADOU</span>
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

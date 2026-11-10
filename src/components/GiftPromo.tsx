import { Gift, Plus } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { DEFAULT_CUTOUT } from "@/components/effects/ProductRender";
import type { OrderItem } from "@/lib/order";

// Promo gift (microSD card) shown on the hero photo, in the hero order panel,
// in both order forms and in the order sent to Telegram. Edited in /admin.

export const useGift = () => {
  const { gift } = useContent();
  return gift.enabled && gift.title.trim() ? gift : null;
};

/** Adds the gift as a 0-lei line so it shows up in Telegram and in /admin orders. */
export const giftItem = (title: string, quantity: number): OrderItem => ({
  name: `🎁 CADOU: ${title}`,
  quantity,
  price: 0,
});

const Ribbon = ({ text }: { text: string }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-2.5 py-1 text-xs md:text-[13px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_6px_18px_-6px_rgba(244,63,94,0.9)]">
    <Gift className="w-3.5 h-3.5" />
    {text}
  </span>
);

/** Small sticker over the hero photo: the card + "CADOU". */
export const GiftPhotoBadge = () => {
  const g = useGift();
  if (!g) return null;
  return (
    <div className="pointer-events-none absolute right-2 bottom-2 md:right-4 md:bottom-4 z-10 flex flex-col items-end">
      <img src={g.image} alt={g.title} className="gift-float w-[28vw] max-w-[130px] md:w-[140px] drop-shadow-[0_14px_22px_rgba(0,0,0,0.7)]" draggable={false} />
      <span className="-mt-2 rounded-xl bg-black/65 backdrop-blur-md border border-amber-300/50 px-2.5 py-1.5 text-right shadow-lg">
        <span className="block text-[11px] md:text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">+ {g.badge} gratuit</span>
        <span className="block text-[12px] md:text-sm font-bold text-white leading-tight">{g.title}</span>
      </span>
    </div>
  );
};

/** Large promo card in the hero order panel. */
export const GiftBanner = ({ quantity = 1 }: { quantity?: number }) => {
  const g = useGift();
  if (!g) return null;
  return (
    <div className="gift-ring relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400/[0.16] via-amber-300/[0.06] to-rose-500/[0.12] p-4 pr-2">
      <div aria-hidden className="gift-shine pointer-events-none absolute inset-0" />
      <div className="relative">
        <Ribbon text={`${g.badge} la comandă`} />
      </div>
      <div className="relative mt-1 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="mt-1 font-orbitron text-lg md:text-xl font-extrabold leading-tight text-white">{g.title}</p>
          <p className="mt-1 flex items-baseline gap-2">
            {g.value ? <s className="text-white/45 text-sm">{g.value * quantity} lei</s> : null}
            <span className="font-orbitron text-xl md:text-2xl font-extrabold text-emerald-400 drop-shadow-[0_0_14px_rgba(52,211,153,0.6)]">GRATUIT</span>
            {quantity > 1 && <span className="text-white/55 text-sm">× {quantity}</span>}
          </p>
          <p className="mt-1 text-[13px] md:text-sm text-white/60 leading-snug">{g.text}</p>
        </div>
        <img src={g.image} alt={g.title} className="gift-float w-[32%] max-w-[130px] shrink-0 drop-shadow-[0_14px_20px_rgba(0,0,0,0.6)]" draggable={false} />
      </div>
    </div>
  );
};

/** Camera + gift bundle at the top of an order form. */
export const GiftBundle = () => {
  const c = useContent();
  const g = useGift();
  const cam = c.media.specsImage || DEFAULT_CUTOUT;
  return (
    <div className="relative mb-5">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full blur-[60px]"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.22), rgba(251,191,36,0.16) 50%, transparent 72%)" }} />
      <div className="relative flex items-center justify-center gap-1 md:gap-3">
        <img
          src={cam}
          alt={c.product.title}
          className={`product-float ${g ? "w-[44%]" : "w-[52%]"} max-w-[230px] drop-shadow-[0_26px_34px_rgba(0,0,0,0.7)]`}
          draggable={false}
        />
        {g && (
          <>
            <span className="shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-[0_0_24px_rgba(251,191,36,0.7)]">
              <Plus className="w-5 h-5 md:w-6 md:h-6 text-slate-900" strokeWidth={3} />
            </span>
            <div className="relative w-[40%] max-w-[210px]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                <Ribbon text={g.badge} />
              </span>
              <img src={g.image} alt={g.title} className="gift-float w-full drop-shadow-[0_18px_26px_rgba(0,0,0,0.7)]" draggable={false} />
            </div>
          </>
        )}
      </div>
      {g && (
        <div className="relative mt-4 text-center">
          <p className="font-orbitron text-lg md:text-2xl font-extrabold leading-tight">
            <span className="text-white">Cameră + </span>
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">{g.title}</span>
          </p>
          <p className="mt-1 text-sm md:text-base text-emerald-300 font-semibold uppercase tracking-[0.16em]">{g.badge} gratuit în colet</p>
        </div>
      )}
    </div>
  );
};

/** Line in the price summary of an order form. */
export const GiftSummaryRow = ({ quantity = 1 }: { quantity?: number }) => {
  const g = useGift();
  if (!g) return null;
  return (
    <div className="gift-ring relative -mx-2 overflow-hidden rounded-xl bg-amber-400/[0.08] px-2 py-2 flex items-center justify-between gap-3">
      <div aria-hidden className="gift-shine pointer-events-none absolute inset-0" />
      <span className="relative inline-flex items-center gap-2 min-w-0">
        <img src={g.image} alt="" aria-hidden className="w-9 shrink-0 -rotate-6" draggable={false} />
        <span className="min-w-0">
          <span className="block text-amber-300 text-xs md:text-sm font-extrabold uppercase tracking-[0.16em]">{g.badge}</span>
          <span className="block text-white text-sm md:text-base font-semibold leading-tight">
            {g.title}
            {quantity > 1 ? ` × ${quantity}` : ""}
          </span>
        </span>
      </span>
      <span className="relative flex items-baseline gap-2 shrink-0">
        {g.value ? <s className="text-white/40 text-sm md:text-base">{g.value * quantity} lei</s> : null}
        <span className="font-orbitron font-extrabold text-emerald-400 text-xl md:text-2xl leading-none drop-shadow-[0_0_18px_rgba(52,211,153,0.55)]">GRATUIT</span>
      </span>
    </div>
  );
};

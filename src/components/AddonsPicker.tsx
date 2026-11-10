import { useState, type ReactNode } from "react";
import { Package as PackageIcon, Truck, BadgePercent, ZoomIn, Warehouse } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { deliveryFee, getAddons, type Addon, type DeliveryMethod, type OrderSummary, type Package } from "@/data/siteContent";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { OrderItem } from "@/lib/order";

// Optional accessories in the order forms: one row per accessory with a calm
// "Nu / Da" switch (default Nu). Accepted accessories are added once per camera
// at full price — the package discount is for the cameras only.

export const useAddons = () => getAddons(useContent());

/** Order lines for Telegram / admin: cameras + chosen accessories at full price. */
export const orderItems = (title: string, p: Package, s: OrderSummary): OrderItem[] => [
  { name: p.qty > 1 ? `${title} — ${p.label}` : title, quantity: p.qty, price: Math.round((s.cameras / p.qty) * 100) / 100 },
  ...s.addons.map((a) => ({ name: a.addon.title, quantity: a.quantity, price: a.addon.price })),
];

export const AddonsPicker = ({
  qty,
  chosen,
  onChange,
}: {
  qty: number;
  chosen: string[];
  onChange: (ids: string[]) => void;
}) => {
  const c = useContent();
  const list = getAddons(c);
  const [open, setOpen] = useState<Addon | null>(null);
  if (!list.length) return null;
  const set = (id: string, on: boolean) => onChange(on ? [...chosen.filter((x) => x !== id), id] : chosen.filter((x) => x !== id));

  return (
    <div className="mb-5 rounded-2xl border border-white/12 bg-white/[0.04] p-3.5 md:p-4">
      <p className="text-sm md:text-base font-semibold text-white">{c.addons.title}</p>
      {c.addons.text && <p className="mt-0.5 text-[13px] md:text-sm text-white/55">{c.addons.text}</p>}
      <ul className="mt-3 space-y-2.5">
        {list.map((a) => {
          const on = chosen.includes(a.id);
          return (
            <li
              key={a.id}
              className={`flex items-center gap-3 rounded-xl border px-2.5 py-2 transition-colors duration-200 ${
                on ? "border-emerald-300/50 bg-emerald-400/[0.07]" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {a.image ? (
                <button
                  type="button"
                  onClick={() => setOpen(a)}
                  aria-label={`Vezi mărit: ${a.title}`}
                  className="group relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl bg-white flex items-center justify-center overflow-hidden ring-1 ring-white/15 hover:ring-emerald-300/60 transition"
                >
                  <img src={a.image} alt={a.title} className="w-full h-full object-contain p-1 transition-transform duration-200 group-hover:scale-105" draggable={false} />
                  <span className="absolute bottom-1 right-1 rounded-full bg-slate-900/75 p-1">
                    <ZoomIn className="w-3.5 h-3.5 text-white" />
                  </span>
                </button>
              ) : (
                <span className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <PackageIcon className="w-6 h-6 text-white/40" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] md:text-sm font-semibold text-white leading-tight">{a.title}</span>
                {a.text && <span className="block text-[13px] text-white/55 leading-snug">{a.text}</span>}
                <span className="mt-0.5 flex items-baseline gap-1.5">
                  {a.oldPrice ? <s className="text-[13px] text-white/40">{a.oldPrice} lei</s> : null}
                  <span className="text-[13px] font-bold text-amber-300">+{a.price} lei</span>
                  {qty > 1 && <span className="text-[13px] text-white/50">× {qty}</span>}
                </span>
              </span>
              <span role="radiogroup" aria-label={a.title} className="shrink-0 inline-flex rounded-full border border-white/15 bg-black/30 p-0.5">
                {[
                  { v: false, t: "Nu" },
                  { v: true, t: "Da" },
                ].map((o) => (
                  <button
                    key={o.t}
                    type="button"
                    role="radio"
                    aria-checked={on === o.v}
                    onClick={() => set(a.id, o.v)}
                    className={`min-w-[40px] rounded-full px-2.5 py-1.5 text-sm font-bold transition-colors duration-200 ${
                      on === o.v ? (o.v ? "bg-emerald-400 text-slate-900" : "bg-white/20 text-white") : "text-white/55 hover:text-white"
                    }`}
                  >
                    {o.t}
                  </button>
                ))}
              </span>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-md rounded-2xl border border-white/15 bg-slate-900 p-4 text-white [&>button]:text-white [&>button]:opacity-90">
          {open && (
            <>
              <div className="rounded-xl bg-white flex items-center justify-center">
                <img src={open.image} alt={open.title} className="w-full max-h-[55vh] object-contain" draggable={false} />
              </div>
              <DialogTitle className="mt-1 text-base md:text-lg font-semibold leading-tight pr-6">{open.title}</DialogTitle>
              <DialogDescription className="text-sm text-white/75 leading-relaxed">{open.detail?.trim() || open.text}</DialogDescription>
              <p className="text-sm font-bold text-amber-300">+{open.price} lei</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Price summary lines: cameras, accessories, discount, delivery, total. */
export const OrderTotals = ({ pkg, s }: { pkg: Package; s: OrderSummary }) => {
  const { delivery } = useContent();
  const row = "flex items-center justify-between gap-3 text-sm md:text-base";
  return (
    <div className="space-y-2">
      <div className={row}>
        <span className="text-white/75">
          {pkg.qty > 1 ? `${pkg.qty} camere` : "Cameră"}
        </span>
        <span className="text-white font-semibold tabular-nums">{s.cameras} lei</span>
      </div>
      {s.addons.map((a) => (
        <div key={a.addon.id} className={row}>
          <span className="text-white/75 min-w-0 truncate">
            {a.addon.title}
            {a.quantity > 1 ? ` × ${a.quantity}` : ""}
          </span>
          <span className="text-white font-semibold tabular-nums shrink-0">{a.amount} lei</span>
        </div>
      ))}
      {s.discount > 0 && (
        <div className={row}>
          <span className="inline-flex items-center gap-1.5 text-emerald-300">
            <BadgePercent className="w-4 h-4" />
            Reducere {s.discountPct}% la camere
          </span>
          <span className="text-emerald-300 font-semibold tabular-nums">−{s.discount} lei</span>
        </div>
      )}
      <div className={row}>
        <span className="inline-flex items-center gap-1.5 text-white/75">
          <Truck className="w-4 h-4 text-white/50" />
          Livrare
        </span>
        <span className={`text-right tabular-nums ${delivery.free ? "text-emerald-400 font-bold" : "text-white font-semibold"}`}>
          {delivery.free ? "GRATUIT" : s.delivery > 0 ? `${s.delivery} lei` : "0 lei"}
        </span>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="flex items-end justify-between gap-3">
        <span className="text-white/75 text-sm md:text-base uppercase tracking-[0.14em]">Total</span>
        <span className="flex items-baseline gap-2">
          {s.discount > 0 && <s className="text-white/40 text-sm tabular-nums">{s.subtotal + s.delivery} lei</s>}
          <span className="font-orbitron text-amber-300 font-extrabold text-2xl md:text-3xl leading-none tabular-nums drop-shadow-[0_0_22px_rgba(255,180,50,0.55)]">
            {s.total} lei
          </span>
        </span>
      </div>
    </div>
  );
};

/** Courier to the door (flat fee for the whole order) or free pickup in Chișinău. Hidden when delivery is free. */
export const DeliveryPicker = ({ value, onChange }: { value: DeliveryMethod; onChange: (m: DeliveryMethod) => void }) => {
  const c = useContent();
  if (c.delivery.free) return null;
  const fee = deliveryFee(c, "courier");
  const options: { id: DeliveryMethod; icon: ReactNode; title: string; hint: string; price: string }[] = [
    {
      id: "courier",
      icon: <Truck className="w-5 h-5" />,
      title: c.delivery.paidText || "Curier expres la domiciliu",
      hint: "Un singur preț pentru întreaga comandă",
      price: fee ? `+${fee} lei` : "0 lei",
    },
    {
      id: "pickup",
      icon: <Warehouse className="w-5 h-5" />,
      title: c.delivery.pickupText || "Ridicare din depozit",
      hint: "Fără cost de livrare",
      price: "0 lei",
    },
  ];
  return (
    <div className="mb-5 rounded-2xl border border-white/12 bg-white/[0.04] p-3.5 md:p-4">
      <p className="text-sm md:text-base font-semibold text-white">Cum doriți să primiți comanda?</p>
      <div role="radiogroup" aria-label="Metoda de livrare" className="mt-3 grid grid-cols-1 gap-2.5">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.id)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 ${
                on ? "border-emerald-300/60 bg-emerald-400/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/25"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  on ? "border-emerald-300" : "border-white/30"
                }`}
              >
                {on && <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />}
              </span>
              <span className={on ? "text-emerald-300" : "text-white/50"}>{o.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] md:text-sm font-semibold text-white leading-tight">{o.title}</span>
                <span className="block text-[13px] text-white/55 leading-snug">{o.hint}</span>
              </span>
              <span className={`shrink-0 text-[13px] md:text-sm font-bold tabular-nums ${o.price === "0 lei" ? "text-emerald-300" : "text-amber-300"}`}>
                {o.price}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

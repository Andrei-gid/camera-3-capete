import { useState, useEffect, FormEvent } from "react";
import { PHONE_ERROR, PHONE_PLACEHOLDER, normalizeMdPhone, phoneInput } from "@/lib/phone";
import { Link, useLocation } from "react-router-dom";
import { Loader2, ShoppingBag } from "lucide-react";
import { storeLeadData, fireInitiateCheckout, trackCustom } from "@/lib/metaPixel";
import { submitOrder } from "@/lib/order";
import { useCameraProduct } from "@/hooks/useCameraProduct";
import { toast } from "sonner";
import { GiftBundle, GiftSummaryRow, useGift, giftItem } from "@/components/GiftPromo";
import { usePackages } from "@/components/OfferConfigurator";
import { PromoStrip } from "@/components/PromoPopup";
import { AddonsPicker, DeliveryPicker, OrderTotals, orderItems } from "@/components/AddonsPicker";
import { useContent } from "@/hooks/useContent";
import { deliveryLabel, orderSummary, type DeliveryMethod } from "@/data/siteContent";





interface OrderForm {
  fullName: string;
  phone: string;
  county: string;
  city: string;
  address: string;
}

const OrderPage = () => {
  const product = useCameraProduct();
  const gift = useGift();
  // quantity chosen in the hero (1 when the page is opened directly)
  const location = useLocation();
  const qRaw = Number((location.state as { quantity?: number } | null)?.quantity);
  const pk = usePackages();
  // only quantities that exist as packages; otherwise the default package
  const pkg = pk.list.find((p) => p.qty === qRaw) ?? pk.initial;
  const quantity = pkg.qty;
  const content = useContent();
  // accessories pre-selected by "Comandați setul complet" (only ids that exist as accessories)
  const [chosen, setChosen] = useState<string[]>(() => {
    const ids = (location.state as { addons?: unknown } | null)?.addons;
    if (!Array.isArray(ids)) return [];
    const valid = new Set((content.addons?.enabled ? content.addons.items ?? [] : []).map((a) => a.id));
    return ids.filter((id): id is string => typeof id === "string" && valid.has(id));
  });
  const [method, setMethod] = useState<DeliveryMethod>("courier");
  const pickup = !content.delivery.free && method === "pickup";
  const sum = orderSummary(content, pkg, chosen, method);
  const total = sum.total;

  // Meta: the visitor opened the checkout page (once per session; retries until the pixel is booted)
  useEffect(() => {
    let n = 0;
    const t = window.setInterval(() => {
      fireInitiateCheckout(total, quantity);
      if (++n >= 10) window.clearInterval(t);
    }, 700);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OrderForm>({
    fullName: "",
    phone: "",
    county: "",
    city: "",
    address: "",
  });
  const [errors, setErrors] = useState<Partial<OrderForm>>({});

  const update = (k: keyof OrderForm, v: string) => {
    if (k === "phone") {
      // Strip non-digits for phone
      v = phoneInput(v);
    }
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    // only the phone is required; name and address are free text, as the customer likes
    const e: Partial<OrderForm> = {};
    if (!form.phone.trim()) e.phone = "Lăsați numărul de telefon";
    else if (!normalizeMdPhone(form.phone)) e.phone = PHONE_ERROR;
    setErrors(e);
    if (e.phone) trackCustom("OrderFormError", { field: "phone" });
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);

    const ok = await submitOrder({
      ...form,
      address: pickup ? content.delivery.pickupText || "Ridicare din depozit" : form.address,
      phone: normalizeMdPhone(form.phone),
      items: [...orderItems(product.title, pkg, sum), ...(gift ? [giftItem(gift.title, quantity)] : [])],
      total,
      discount: sum.discount ? { percent: sum.discountPct, amount: sum.discount } : undefined,
      delivery: deliveryLabel(content, method, pkg.qty),
      deliveryMethod: content.delivery.free ? undefined : method,
      deliveryFee: sum.delivery,
      source: "Pagina de comandă",
    });
    if (!ok) {
      setSubmitting(false);
      toast.error("Comanda nu a putut fi trimisă. Verificați conexiunea și încercați din nou.");
      return;
    }

    try {
      sessionStorage.removeItem("marcosamp_lead_fired");
    } catch {
      /* ignore storage errors */
    }

    // Persist validated Meta Pixel advanced-matching data for the Thank You page
    storeLeadData({
      phone: normalizeMdPhone(form.phone),
      fullName: form.fullName,
      city: form.city,
      county: form.county,
      value: total,
    });

    // full page load: the pixel starts fresh with the customer data (Advanced Matching)
    window.location.assign("/thank-you");
  };

  // Simple form: only the phone is required, everything else is free text
  const fields: Array<{ key: keyof OrderForm; label: string; type?: string; placeholder: string }> = [
    { key: "phone", label: "Număr de telefon *", type: "tel", placeholder: PHONE_PLACEHOLDER },
    { key: "fullName", label: "Nume (opțional)", placeholder: "Cum să vă spunem" },
    { key: "address", label: "Adresa de livrare (opțional)", placeholder: "Localitatea, strada — cum vă e comod" },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black px-4 py-10 relative overflow-hidden">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-20 -left-10 w-[420px] h-[420px] rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[460px] h-[460px] rounded-full bg-cyan-500/15 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 md:p-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide">Finalizare comandă</h1>
            <p className="text-white/60 text-sm">
              Plată la livrare • {quantity > 1 ? `${pkg.label} (${quantity} camere) · ` : ""}
              {total} lei
            </p>
          </div>
        </div>

        <GiftBundle />
        {gift && (
          <div className="mb-6 px-2">
            <GiftSummaryRow quantity={quantity} />
          </div>
        )}

        <PromoStrip qty={quantity} className="mb-5" />
        <AddonsPicker qty={quantity} chosen={chosen} onChange={setChosen} />
        <DeliveryPicker value={method} onChange={setMethod} qty={pkg.qty} />

        <div className="mb-6 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
          <OrderTotals pkg={pkg} s={sum} />
        </div>

        <form onSubmit={handleSubmit} onFocusCapture={() => fireInitiateCheckout(total, quantity)} className="space-y-4">
          <p className="rounded-xl border border-emerald-300/30 bg-emerald-400/[0.07] px-3.5 py-2.5 text-[13px] text-white/85">
            Este suficient <b className="text-emerald-200">numărul de telefon</b> — vă sunăm pentru confirmare și precizăm adresa.
          </p>
          {fields.filter((f) => !(pickup && f.key === "address")).map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-white/80 text-sm font-medium mb-1.5">{label}</label>
              <input
                type={type ?? "text"}
                inputMode={key === "phone" ? "numeric" : undefined}
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                  errors[key] ? "border-red-400/60" : "border-white/10"
                } text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60 focus:bg-white/10 transition-all`}
              />
              {errors[key] && <p className="mt-1 text-xs text-red-400">{errors[key]}</p>}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 min-h-[54px] rounded-xl font-bold uppercase tracking-wider
              bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900
              hover:from-amber-300 hover:to-amber-400
              shadow-[0_10px_30px_-10px_rgba(255,180,50,0.7)]
              hover:shadow-[0_0_30px_rgba(255,180,50,0.7)]
              transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmă comanda"}
          </button>

          <Link
            to="/"
            className="block text-center text-white/50 hover:text-white/80 text-sm pt-2 transition-colors"
          >
            ← Înapoi la magazin
          </Link>
        </form>
      </div>
    </main>
  );
};

export default OrderPage;

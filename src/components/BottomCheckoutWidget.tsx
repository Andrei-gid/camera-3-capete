import { useState, useEffect, FormEvent } from "react";
import { PHONE_ERROR, PHONE_PLACEHOLDER, normalizeMdPhone, phoneInput } from "@/lib/phone";
import { Loader2, Zap, Wallet, ShieldCheck, Truck, PackageCheck } from "lucide-react";
import { storeLeadData, fireInitiateCheckout } from "@/lib/metaPixel";
import { submitOrder } from "@/lib/order";
import { useCameraProduct } from "@/hooks/useCameraProduct";
import { useContent } from "@/hooks/useContent";
import { toast } from "sonner";
import { GiftBundle, GiftSummaryRow, useGift, giftItem } from "@/components/GiftPromo";
import { PackageTiles, usePackages } from "@/components/OfferConfigurator";
import { AddonsPicker, DeliveryPicker, OrderTotals, orderItems } from "@/components/AddonsPicker";
import { deliveryLabel, orderSummary, type DeliveryMethod } from "@/data/siteContent";
import BigOrderButton from "@/components/BigOrderButton";
import { PromoStrip } from "@/components/PromoPopup";



interface OrderForm {
  fullName: string;
  phone: string;
  county: string;
  city: string;
  address: string;
}

export const BottomCheckoutWidget = () => {
  const product = useCameraProduct();
  const content = useContent();
  const { delivery } = content;
  const gift = useGift();
  const pk = usePackages();
  const [pkg, setPkg] = useState(pk.initial);
  useEffect(() => {
    setPkg((cur) => pk.list.find((p) => p.qty === cur.qty) ?? pk.initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pk.list)]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [method, setMethod] = useState<DeliveryMethod>("courier");
  const pickup = !delivery.free && method === "pickup";
  const sum = orderSummary(content, pkg, chosen, method);
  const PRICE = sum.total;
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
    if (k === "phone") v = phoneInput(v);
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<OrderForm> = {};
    if (!form.fullName.trim()) e.fullName = "Câmp obligatoriu";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!form.phone.trim()) e.phone = "Câmp obligatoriu";
    else if (!normalizeMdPhone(form.phone))
      e.phone = PHONE_ERROR;
    if (!form.county.trim()) e.county = "Câmp obligatoriu";
    if (!form.city.trim()) e.city = "Câmp obligatoriu";
    if (!pickup && !form.address.trim()) e.address = "Câmp obligatoriu";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);

    const ok = await submitOrder({
      ...form,
      address: pickup ? delivery.pickupText || "Ridicare din depozit" : form.address,
      phone: normalizeMdPhone(form.phone),
      items: [...orderItems(product.title, pkg, sum), ...(gift ? [giftItem(gift.title, pkg.qty)] : [])],
      total: PRICE,
      discount: sum.discount ? { percent: sum.discountPct, amount: sum.discount } : undefined,
      delivery: deliveryLabel(content, method, pkg.qty),
      deliveryMethod: delivery.free ? undefined : method,
      deliveryFee: sum.delivery,
      source: "Formular jos pagină",
    });
    if (!ok) {
      setSubmitting(false);
      toast.error("Comanda nu a putut fi trimisă. Verificați conexiunea și încercați din nou.");
      return;
    }

    try {
      sessionStorage.removeItem("marcosamp_lead_fired");
    } catch {
      /* ignore */
    }

    // Persist validated Meta Pixel advanced-matching data for the Thank You page
    storeLeadData({
      phone: normalizeMdPhone(form.phone),
      fullName: form.fullName,
      city: form.city,
      county: form.county,
      value: PRICE,
    });

    // full page load: the pixel starts fresh with the customer data (Advanced Matching)
    window.location.assign("/thank-you");
  };

  const fields: Array<{ key: keyof OrderForm; label: string; type?: string; placeholder: string; full?: boolean }> = [
    { key: "fullName", label: "Nume și prenume", placeholder: "Ex: Ion Popescu", full: true },
    { key: "phone", label: "Telefon", type: "tel", placeholder: PHONE_PLACEHOLDER, full: true },
    { key: "county", label: "Raion / Municipiu", placeholder: "Ex: Ialoveni" },
    { key: "city", label: "Localitate: Oraș / Sat / Comună", placeholder: "Ex: Costești" },
    { key: "address", label: "Adresă (stradă, număr, detalii)", placeholder: "Str. Florilor nr. 12, bl. A, ap. 5", full: true },
  ];

  return (
    <section className="relative w-full px-4 md:px-0 mt-16 mb-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute -top-10 left-1/4 w-[420px] h-[420px] rounded-full bg-amber-500/15 blur-[120px]" />
        <div className="absolute -bottom-10 right-1/4 w-[420px] h-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto rounded-[28px] border border-white/15 bg-white/[0.05] backdrop-blur-2xl shadow-[0_30px_80px_-25px_rgba(0,0,0,0.75)] p-5 md:p-9 overflow-hidden">
        {/* Light refraction */}
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/10 via-transparent to-white/[0.02]" />
        <div className="pointer-events-none absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <div className="relative">
          <h2 className="font-orbitron text-xl md:text-2xl font-bold text-white tracking-tight text-center mb-5">
            Finalizează comanda
          </h2>

          <GiftBundle />

          {pk.list.length > 1 && (
            <div className="mb-5">
              <p className="mb-3 text-center text-[13px] uppercase tracking-[0.2em] text-white/60">Alegeți pachetul</p>
              <PackageTiles list={pk.list} unit={pk.unit} value={pkg} onChange={setPkg} compact />
            </div>
          )}

          <PromoStrip qty={pkg.qty} className="mb-5" />
          <AddonsPicker qty={pkg.qty} chosen={chosen} onChange={setChosen} />
          <DeliveryPicker value={method} onChange={setMethod} qty={pkg.qty} />

          {/* High-Visibility Pricing & Benefits Header */}
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-xl p-4 md:p-5 mb-6 space-y-3">
            <OrderTotals pkg={pkg} s={sum} />

            <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Gift */}
            {gift && (
              <>
                <GiftSummaryRow quantity={pkg.qty} />
                <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </>
            )}

            {/* Verification */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/75 text-sm md:text-base uppercase tracking-[0.14em] inline-flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-300" />
                Verificare colet
              </span>
              <div className="flex items-baseline gap-2 md:gap-3">
                {delivery.verifyOldPrice ? <s className="text-white/40 text-sm md:text-base">{delivery.verifyOldPrice} lei</s> : null}
                <span className="font-orbitron font-extrabold text-emerald-400 text-xl md:text-2xl leading-none drop-shadow-[0_0_18px_rgba(52,211,153,0.55)]">
                  GRATUIT
                </span>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Payment */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/75 text-sm md:text-base uppercase tracking-[0.14em] inline-flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-300" />
                Plată
              </span>
              <span className="font-semibold text-white text-sm md:text-base">
                Plată la livrare (Ramburs)
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} onFocusCapture={() => fireInitiateCheckout(PRICE, pkg.qty)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.filter((f) => !(pickup && f.key === "address")).map(({ key, label, type, placeholder, full }) => (
              <div key={key} className={full ? "md:col-span-2" : ""}>
                <label className="block text-white/70 text-xs uppercase tracking-[0.18em] mb-1.5">
                  {label}
                </label>
                <input
                  type={type ?? "text"}
                  inputMode={key === "phone" ? "numeric" : undefined}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={placeholder}
                  className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border ${
                    errors[key] ? "border-red-400/60" : "border-white/10"
                  } text-white placeholder:text-white/25 text-sm backdrop-blur-md
                  focus:outline-none focus:border-amber-300/60 focus:bg-white/[0.08]
                  focus:shadow-[0_0_0_3px_rgba(255,180,50,0.12),0_0_24px_rgba(255,180,50,0.18)]
                  transition-all duration-300`}
                />
                {errors[key] && <p className="mt-1 text-[13px] text-red-400">{errors[key]}</p>}
              </div>
            ))}

            <div className="md:col-span-2 mt-3">
              <BigOrderButton
                type="submit"
                loading={submitting}
                price={PRICE}
                sub={gift ? `+ ${gift.badge.toLowerCase()} · plată la livrare` : "Plată la livrare (ramburs)"}
              />
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-white/60 tracking-wide">
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-300" />
              Plată la livrare (Ramburs)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Verificare colet gratuită
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BottomCheckoutWidget;

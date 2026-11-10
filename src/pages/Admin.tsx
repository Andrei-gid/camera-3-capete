import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  ImagePlus,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_CONTENT,
  ICON_NAMES,
  formatPhone,
  mergeContent,
  type Hotspot,
  type Package,
  type Addon,
  packageDiscount,
  discounted,
  type IconName,
  type SiteContent,
  type SpecItem,
  type StatItem,
  type Effects,
  type AppScreenKey,
  APP_SCREENS,
} from "@/data/siteContent";
import { setContentCache } from "@/hooks/useContent";
import { iconFor } from "@/lib/icons";
import { SCENE_H, SCENE_W, YardScene } from "@/components/effects/YardScene";

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const api = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, { credentials: "same-origin", ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Ошибка ${res.status}`), { status: res.status });
  return data as T;
};

const uploadFile = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);
  const { url } = await api<{ url: string }>("/api/admin/upload", { method: "POST", body: fd });
  return url;
};

// ---------------------------------------------------------------------------
// Small UI pieces (same glass style as the site)
// ---------------------------------------------------------------------------

const inputCls =
  "w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-300/60 focus:bg-white/[0.08] transition";

const Panel = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 md:p-6 space-y-4">
    <div>
      <h2 className="font-orbitron text-base md:text-lg font-bold text-white">{title}</h2>
      {hint && <p className="text-xs text-white/50 mt-1">{hint}</p>}
    </div>
    {children}
  </section>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="block">
    <span className="block text-[11px] uppercase tracking-[0.14em] text-white/60 mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-white/40 mt-1">{hint}</span>}
  </label>
);

const TextInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
);

const TextArea = ({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) => (
  <textarea className={`${inputCls} resize-y`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
);

const NumberInput = ({
  value,
  onChange,
  allowEmpty,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  allowEmpty?: boolean;
}) => (
  <input
    className={inputCls}
    inputMode="decimal"
    value={value ?? ""}
    placeholder={allowEmpty ? "пусто = не показывать" : ""}
    onChange={(e) => {
      const raw = e.target.value.replace(",", ".").trim();
      if (raw === "") return onChange(allowEmpty ? null : 0);
      const n = Number(raw);
      if (!Number.isNaN(n)) onChange(n);
    }}
  />
);

const IconSelect = ({ value, onChange }: { value: IconName; onChange: (v: IconName) => void }) => {
  const Icon = iconFor(value);
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 h-10 shrink-0 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
        <Icon className="w-5 h-5 text-amber-300" />
      </span>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as IconName)}>
        {ICON_NAMES.map((n) => (
          <option key={n} value={n} className="bg-slate-900">
            {n}
          </option>
        ))}
      </select>
    </div>
  );
};

const RowButtons = ({
  onUp,
  onDown,
  onRemove,
}: {
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
}) => (
  <div className="flex items-center gap-1">
    <button type="button" onClick={onUp} disabled={!onUp} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30" aria-label="Выше">
      <ArrowUp className="w-4 h-4" />
    </button>
    <button type="button" onClick={onDown} disabled={!onDown} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30" aria-label="Ниже">
      <ArrowDown className="w-4 h-4" />
    </button>
    <button type="button" onClick={onRemove} className="p-2 rounded-lg text-red-300/80 hover:text-red-200 hover:bg-red-500/15" aria-label="Удалить">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

const move = <T,>(arr: T[], i: number, d: number): T[] => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = arr.slice();
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

const isVideo = (url: string) => /\.(mp4|webm)(\?|$)/i.test(url) || url.includes("video");

/** One image/video slot: preview, upload button, paste-a-link field, clear. */
const MediaField = ({
  label,
  value,
  onChange,
  accept = "image/*",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accept?: string;
  hint?: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadFile(f));
      toast.success("Файл загружен — не забудьте нажать «Сохранить»");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  const video = accept.startsWith("video") || (value && isVideo(value));
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-3 items-start">
        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
          {value ? (
            video ? (
              <video src={value} className="w-full h-full object-cover" muted />
            ) : (
              <img src={value} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <ImagePlus className="w-6 h-6 text-white/30" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => ref.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-400 text-slate-900 text-sm font-semibold hover:bg-amber-300 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Загрузить
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="px-3 py-2 rounded-xl border border-white/15 text-white/70 text-sm hover:bg-white/10">
                Убрать
              </button>
            )}
          </div>
          <input className={inputCls} value={value} placeholder="или вставьте ссылку на файл" onChange={(e) => onChange(e.target.value)} />
          <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>
      </div>
    </Field>
  );
};

/** Ordered list of images with add / reorder / remove. */
const GalleryEditor = ({ items, onChange, max }: { items: string[]; onChange: (v: string[]) => void; max?: number }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    // natural filename order (frame_2 before frame_10) so 360° frames stay in sequence
    const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    for (const f of sorted) {
      try {
        added.push(await uploadFile(f));
      } catch (e) {
        toast.error(`${f.name}: ${(e as Error).message}`);
      }
    }
    onChange([...items, ...added]);
    setBusy(false);
    if (ref.current) ref.current.value = "";
    if (added.length) toast.success(`Загружено: ${added.length}. Нажмите «Сохранить»`);
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {items.map((src, i) => (
          <div key={`${src}-${i}`} className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
            <div className="relative aspect-square">
              <img src={src} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-bold">ГЛАВНОЕ</span>
              )}
            </div>
            <div className="flex justify-center p-1">
              <RowButtons
                onUp={i > 0 ? () => onChange(move(items, i, -1)) : undefined}
                onDown={i < items.length - 1 ? () => onChange(move(items, i, 1)) : undefined}
                onRemove={() => onChange(items.filter((_, k) => k !== i))}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="aspect-square rounded-xl border-2 border-dashed border-white/20 text-white/60 hover:text-white hover:border-amber-300/60 flex flex-col items-center justify-center gap-2 text-sm"
        >
          {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
          Добавить фото
        </button>
      </div>
      {max && items.length > max && <p className="text-xs text-amber-300/80">На сайте показываются первые {max}.</p>}
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Update = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => void;

const ProductTab = ({ c, set }: { c: SiteContent; set: Update }) => {
  const p = c.product;
  const up = (patch: Partial<SiteContent["product"]>) => set("product", { ...p, ...patch });
  const d = c.delivery;
  return (
    <div className="space-y-5">
      <Panel title="Товар" hint="Заголовок и цены в главном блоке, в формах заказа и в сообщениях Telegram.">
        <Field label="Название товара">
          <TextInput value={p.title} onChange={(v) => up({ title: v })} />
        </Field>
        <Field label="Подзаголовок (строка под названием)">
          <TextInput value={p.subtitle} onChange={(v) => up({ subtitle: v })} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Цена за 1 камеру, lei" hint="От неё считается зачёркнутая цена и % скидки пакетов">
            <NumberInput value={p.price} onChange={(v) => up({ price: v ?? 0 })} />
          </Field>
          <Field label="Старая цена (зачёркнутая), lei" hint="Оставьте пустым — не показывать">
            <NumberInput value={p.oldPrice} allowEmpty onChange={(v) => up({ oldPrice: v })} />
          </Field>
        </div>
        <Field label="Строка под кнопкой заказа">
          <TextInput value={p.sellerLine} onChange={(v) => up({ sellerLine: v })} />
        </Field>
      </Panel>
      <Panel
        title="Пакеты (сколько камер — какая цена)"
        hint="Скидка в % действует на ВЕСЬ заказ: камеры + выбранные аксессуары. Цена пакета считается сама: цена камеры × количество − скидка. Пакет с галочкой «главный» подсвечен и выбран по умолчанию. Если пакетов нет — продаётся 1 камера по цене выше."
      >
        {(p.packages ?? []).map((pk, i, arr) => {
          const upPk = (patch: Partial<Package>) =>
            up({ packages: arr.map((x, k) => (k === i ? { ...x, ...patch } : patch.featured ? { ...x, featured: false } : x)) });
          const off = packageDiscount(pk, p.price);
          const shownPrice = typeof pk.discount === "number" ? discounted(p.price * pk.qty, pk.discount) : pk.price;
          return (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">
                  {pk.qty} шт. — {shownPrice} lei {pk.qty > 0 ? `(${Math.round(shownPrice / Math.max(1, pk.qty))} lei/шт.)` : ""}
                  {off > 0 && <span className="ml-2 text-emerald-300">скидка {off}%</span>}
                </span>
                <RowButtons
                  onUp={i > 0 ? () => up({ packages: move(arr, i, -1) }) : undefined}
                  onDown={i < arr.length - 1 ? () => up({ packages: move(arr, i, 1) }) : undefined}
                  onRemove={() => up({ packages: arr.filter((_, k) => k !== i) })}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Камер, шт.">
                  <NumberInput value={pk.qty} onChange={(v) => upPk({ qty: Math.max(1, Math.round(v ?? 1)) })} />
                </Field>
                <Field label="Скидка на весь заказ, %">
                  <NumberInput
                    value={typeof pk.discount === "number" ? pk.discount : off}
                    onChange={(v) => {
                      const d = Math.min(90, Math.max(0, v ?? 0));
                      upPk({ discount: d, price: discounted(p.price * pk.qty, d) });
                    }}
                  />
                </Field>
                <Field label="Название">
                  <TextInput value={pk.label} onChange={(v) => upPk({ label: v })} placeholder="Pachet 1+1" />
                </Field>
                <Field label="Лента (пусто — нет)">
                  <TextInput value={pk.badge} onChange={(v) => upPk({ badge: v })} placeholder="Ofertă 1+1" />
                </Field>
              </div>
              <Toggle label="Главный пакет (подсветка, выбран по умолчанию)" checked={pk.featured} onChange={(v) => upPk({ featured: v })} />
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => {
            const arr = p.packages ?? [];
            const qty = (arr[arr.length - 1]?.qty ?? 0) + 1;
            up({ packages: [...arr, { qty, price: p.price * qty, label: `${qty} camere`, badge: "", featured: false, discount: 0 }] });
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          <Plus className="w-4 h-4" /> Добавить пакет
        </button>
      </Panel>
      <Panel title="Подарок (акция)" hint="Показывается на главном фото, в верхнем блоке заказа, в обеих формах заказа и в заказе в Telegram (строкой «CADOU», 0 lei).">
        <Toggle label="Акция с подарком включена" checked={c.gift.enabled} onChange={(v) => set("gift", { ...c.gift, enabled: v })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Лента (например CADOU)">
            <TextInput value={c.gift.badge} onChange={(v) => set("gift", { ...c.gift, badge: v })} />
          </Field>
          <Field label="Название подарка">
            <TextInput value={c.gift.title} onChange={(v) => set("gift", { ...c.gift, title: v })} />
          </Field>
        </div>
        <Field label="Строка под названием">
          <TextInput value={c.gift.text} onChange={(v) => set("gift", { ...c.gift, text: v })} />
        </Field>
        <Field label="Стоимость подарка (зачёркнутая), lei" hint="Оставьте пустым — не показывать">
          <NumberInput value={c.gift.value} allowEmpty onChange={(v) => set("gift", { ...c.gift, value: v })} />
        </Field>
        <MediaField label="Фото подарка (лучше PNG/WebP без фона)" value={c.gift.image} onChange={(v) => set("gift", { ...c.gift, image: v })} />
      </Panel>
      <Panel
        title="Аксессуары при заказе"
        hint="В обеих формах заказа под каждым аксессуаром кнопки «Nu / Da», по умолчанию «Nu». Выбранный аксессуар добавляется по 1 шт. на каждую камеру; скидка пакета действует и на него. Цена пустая или 0 — аксессуар скрыт."
      >
        <Toggle label="Предлагать аксессуары" checked={c.addons.enabled} onChange={(v) => set("addons", { ...c.addons, enabled: v })} />
        <Field label="Заголовок блока">
          <TextInput value={c.addons.title} onChange={(v) => set("addons", { ...c.addons, title: v })} />
        </Field>
        <Field label="Строка под заголовком">
          <TextInput value={c.addons.text} onChange={(v) => set("addons", { ...c.addons, text: v })} />
        </Field>
        {c.addons.items.map((a, i, arr) => {
          const upA = (patch: Partial<Addon>) => set("addons", { ...c.addons, items: arr.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
          return (
            <div key={a.id || i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">{a.title || "Аксессуар"} — {a.price} lei</span>
                <RowButtons
                  onUp={i > 0 ? () => set("addons", { ...c.addons, items: move(arr, i, -1) }) : undefined}
                  onDown={i < arr.length - 1 ? () => set("addons", { ...c.addons, items: move(arr, i, 1) }) : undefined}
                  onRemove={() => set("addons", { ...c.addons, items: arr.filter((_, k) => k !== i) })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Название">
                  <TextInput value={a.title} onChange={(v) => upA({ title: v })} />
                </Field>
                <Field label="Строка пользы">
                  <TextInput value={a.text} onChange={(v) => upA({ text: v })} />
                </Field>
                <Field label="Спеццена за 1 шт., lei">
                  <NumberInput value={a.price} onChange={(v) => upA({ price: v ?? 0 })} />
                </Field>
                <Field label="Старая цена (зачёркнутая), lei">
                  <NumberInput value={a.oldPrice} allowEmpty onChange={(v) => upA({ oldPrice: v })} />
                </Field>
              </div>
              <Field label="Описание при увеличении фото (пусто — показывается строка пользы)">
                <TextArea value={a.detail ?? ""} onChange={(v) => upA({ detail: v })} />
              </Field>
              <MediaField label="Фото (лучше PNG/WebP без фона)" value={a.image} onChange={(v) => upA({ image: v })} />
            </div>
          );
        })}
        <button
          type="button"
          onClick={() =>
            set("addons", {
              ...c.addons,
              items: [...c.addons.items, { id: `addon-${Date.now().toString(36)}`, title: "", text: "", price: 0, oldPrice: null, image: "" }],
            })
          }
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          <Plus className="w-4 h-4" /> Добавить аксессуар
        </button>
      </Panel>
      <Panel title="Доставка" hint="Если доставка не бесплатная, в форме заказа клиент выбирает: курьер (цена ниже, один раз на весь заказ, прибавляется к итогу) или бесплатный самовывоз.">
        <Toggle label="Доставка бесплатная" checked={d.free} onChange={(v) => set("delivery", { ...d, free: v })} />
        {!d.free && (
          <Field label="Название курьерской доставки">
            <TextInput value={d.paidText} onChange={(v) => set("delivery", { ...d, paidText: v })} placeholder="Curier expres la domiciliu" />
          </Field>
        )}
        {!d.free && (
          <Field label="Цена курьера за весь заказ, lei (любое количество)">
            <NumberInput value={d.courierPrice ?? 0} onChange={(v) => set("delivery", { ...d, courierPrice: v ?? 0 })} />
          </Field>
        )}
        {!d.free && (
          <Field label="Название самовывоза (бесплатно)">
            <TextInput value={d.pickupText ?? ""} onChange={(v) => set("delivery", { ...d, pickupText: v })} placeholder="Ridicare din depozit, Chișinău" />
          </Field>
        )}
        {!d.free && (
          <Field label="Пояснение под ценой и итогом (пусто — скрыто)">
            <TextArea rows={2} value={d.note ?? ""} onChange={(v) => set("delivery", { ...d, note: v })} />
          </Field>
        )}
        {!d.free && (
          <Field label="Коротко на значке «Livrare» вверху">
            <TextInput value={d.short ?? ""} onChange={(v) => set("delivery", { ...d, short: v })} placeholder="Curier +100 lei" />
          </Field>
        )}
        {d.free && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Курьер (было), lei">
              <NumberInput value={d.shippingOldPrice} allowEmpty onChange={(v) => set("delivery", { ...d, shippingOldPrice: v })} />
            </Field>
            <Field label="Проверка посылки (было), lei">
              <NumberInput value={d.verifyOldPrice} allowEmpty onChange={(v) => set("delivery", { ...d, verifyOldPrice: v })} />
            </Field>
          </div>
        )}
      </Panel>
    </div>
  );
};

const PhotosTab = ({ c, set }: { c: SiteContent; set: Update }) => {
  const m = c.media;
  const upMedia = (patch: Partial<SiteContent["media"]>) => set("media", { ...m, ...patch });
  return (
    <div className="space-y-5">
      <Panel title="Галерея главного блока" hint="Первое фото — главное. Стрелками меняйте порядок. На сайте показываются первые 5.">
        <GalleryEditor items={c.gallery} max={5} onChange={(v) => set("gallery", v)} />
      </Panel>
      <Panel title="Мобильная карусель" hint="Свайп-галерея на телефонах. Пусто — используются фото галереи.">
        <GalleryEditor items={m.carousel} onChange={(v) => upMedia({ carousel: v })} />
      </Panel>
      <Panel title="Картинки блоков" hint="Пустое поле — блок скрыт на сайте.">
        <MediaField
          label="Камера «в воздухе» с выносками"
          hint="Лучше всего PNG/WebP без фона — камера парит над страницей. Выноски показываются только для встроенной картинки."
          value={m.specsImage}
          onChange={(v) => upMedia({ specsImage: v })}
        />
        <MediaField
          label="Крупный план модуля"
          hint="Деталь камеры крупно; края картинки лучше сделать прозрачными, чтобы она растворялась в фоне."
          value={m.rotationImage}
          onChange={(v) => upMedia({ rotationImage: v })}
        />
        <Field label="Заголовок крупного плана">
          <TextInput value={m.moduleTitle} onChange={(v) => upMedia({ moduleTitle: v })} />
        </Field>
        <Field label="Подпись крупного плана">
          <TextInput value={m.moduleSubtitle} onChange={(v) => upMedia({ moduleSubtitle: v })} />
        </Field>
        <MediaField
          label="Картинка доставки"
          hint="Пусто — вместо картинки показывается карточка с текстом (вкладка «Тексты»)."
          value={m.deliveryImage}
          onChange={(v) => upMedia({ deliveryImage: v })}
        />
        <MediaField label="Видео (MP4, до 25 МБ)" accept="video/mp4,video/webm" value={m.video} onChange={(v) => upMedia({ video: v })} />
      </Panel>
    </div>
  );
};

const HotspotEditor = ({ value, onChange }: { value: SiteContent["infographic"]; onChange: (v: SiteContent["infographic"]) => void }) => {
  const [active, setActive] = useState(0);
  const hs = value.hotspots;
  const upHs = (i: number, patch: Partial<Hotspot>) => onChange({ ...value, hotspots: hs.map((h, k) => (k === i ? { ...h, ...patch } : h)) });
  const place = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hs[active]) return;
    const r = e.currentTarget.getBoundingClientRect();
    upHs(active, {
      x: Math.round(((e.clientX - r.left) / r.width) * 100),
      y: Math.round(((e.clientY - r.top) / r.height) * 100),
    });
  };
  return (
    <div className="space-y-4">
      <Field label="Заголовок блока">
        <TextInput value={value.heading} onChange={(v) => onChange({ ...value, heading: v })} />
      </Field>
      <MediaField label="Фото для точек" value={value.image} onChange={(v) => onChange({ ...value, image: v })} />
      {value.image && (
        <div>
          <p className="text-xs text-white/50 mb-2">
            Выберите точку в списке ниже и <b className="text-white/80">кликните по фото</b> — точка переместится туда.
          </p>
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-white/10 cursor-crosshair" style={{ aspectRatio: "4 / 5" }} onClick={place}>
            <img src={value.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {hs.map((h, i) => (
              <span
                key={i}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                  i === active ? "bg-amber-400 text-slate-900 border-white scale-110" : "bg-black/60 text-white border-amber-300/70"
                }`}
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {hs.map((h, i) => (
          <div
            key={i}
            onClick={() => setActive(i)}
            className={`rounded-xl border p-3 space-y-3 cursor-pointer ${i === active ? "border-amber-300/50 bg-white/[0.06]" : "border-white/10 bg-white/[0.02]"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">
                Точка {i + 1} <span className="text-white/40 font-normal">({h.x}%, {h.y}%)</span>
              </span>
              <RowButtons
                onUp={i > 0 ? () => onChange({ ...value, hotspots: move(hs, i, -1) }) : undefined}
                onDown={i < hs.length - 1 ? () => onChange({ ...value, hotspots: move(hs, i, 1) }) : undefined}
                onRemove={() => onChange({ ...value, hotspots: hs.filter((_, k) => k !== i) })}
              />
            </div>
            <TextInput value={h.title} placeholder="Заголовок" onChange={(v) => upHs(i, { title: v })} />
            <TextArea value={h.description} rows={2} onChange={(v) => upHs(i, { description: v })} />
            <MediaField label="Фото в подсказке" value={h.image} onChange={(v) => upHs(i, { image: v })} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            onChange({ ...value, hotspots: [...hs, { x: 50, y: 50, title: "Nou", description: "", image: "" }] });
            setActive(hs.length);
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/80 text-sm hover:bg-white/10"
        >
          <Plus className="w-4 h-4" /> Добавить точку
        </button>
      </div>
    </div>
  );
};

const TextsTab = ({ c, set }: { c: SiteContent; set: Update }) => {
  const upSpec = (i: number, patch: Partial<SpecItem>) => set("specs", c.specs.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-5">
      <Panel title="Характеристики (капсулы со скроллом)" hint="Нажатие на капсулу на сайте раскрывает описание.">
        <div className="space-y-3">
          {c.specs.map((s, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 max-w-xs">
                  <IconSelect value={s.icon} onChange={(v) => upSpec(i, { icon: v })} />
                </div>
                <RowButtons
                  onUp={i > 0 ? () => set("specs", move(c.specs, i, -1)) : undefined}
                  onDown={i < c.specs.length - 1 ? () => set("specs", move(c.specs, i, 1)) : undefined}
                  onRemove={() => set("specs", c.specs.filter((_, k) => k !== i))}
                />
              </div>
              <TextInput value={s.title} placeholder="Заголовок" onChange={(v) => upSpec(i, { title: v })} />
              <TextArea value={s.detail} onChange={(v) => upSpec(i, { detail: v })} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("specs", [...c.specs, { icon: "Camera", title: "NOU", detail: "" }])}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/80 text-sm hover:bg-white/10"
          >
            <Plus className="w-4 h-4" /> Добавить характеристику
          </button>
        </div>
      </Panel>

      <Panel title="Интерактивная инфографика (точки на фото)">
        <HotspotEditor value={c.infographic} onChange={(v) => set("infographic", v)} />
      </Panel>

      <Panel title="Плашки доверия" hint="Ряд из 4 коротких преимуществ.">
        <div className="space-y-3">
          {c.trust.map((t, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="sm:w-56">
                <IconSelect value={t.icon} onChange={(v) => set("trust", c.trust.map((x, k) => (k === i ? { ...x, icon: v } : x)))} />
              </div>
              <div className="flex-1">
                <TextInput value={t.text} onChange={(v) => set("trust", c.trust.map((x, k) => (k === i ? { ...x, text: v } : x)))} />
              </div>
              <RowButtons
                onUp={i > 0 ? () => set("trust", move(c.trust, i, -1)) : undefined}
                onDown={i < c.trust.length - 1 ? () => set("trust", move(c.trust, i, 1)) : undefined}
                onRemove={() => set("trust", c.trust.filter((_, k) => k !== i))}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("trust", [...c.trust, { icon: "ShieldCheck", text: "" }])}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/80 text-sm hover:bg-white/10"
          >
            <Plus className="w-4 h-4" /> Добавить плашку
          </button>
        </div>
      </Panel>

      <Panel title="Карточка доставки" hint="Показывается, когда картинка доставки не загружена.">
        <Field label="Заголовок">
          <TextArea rows={2} value={c.deliveryCard.title} onChange={(v) => set("deliveryCard", { ...c.deliveryCard, title: v })} />
        </Field>
        <Field label="Подпись">
          <TextInput value={c.deliveryCard.subtitle} onChange={(v) => set("deliveryCard", { ...c.deliveryCard, subtitle: v })} />
        </Field>
      </Panel>
    </div>
  );
};

const SettingsTab = ({ c, set }: { c: SiteContent; set: Update }) => {
  const k = c.contact;
  const up = (patch: Partial<SiteContent["contact"]>) => set("contact", { ...k, ...patch });
  return (
    <div className="space-y-5">
      <Panel title="Контакты" hint="Футер, кнопка «Позвонить», кнопки WhatsApp и Viber в правом нижнем углу, AI-чат, политика конфиденциальности.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Телефон" hint={k.phone ? `На сайте: ${formatPhone(k.phone)}` : undefined}>
            <TextInput value={k.phone} placeholder="068358675" onChange={(v) => up({ phone: v.replace(/[^\d+]/g, "") })} />
          </Field>
          <Field label="WhatsApp" hint="Международный формат без +, например 37368358675. Пусто — кнопка скрыта.">
            <TextInput value={k.whatsapp} onChange={(v) => up({ whatsapp: v.replace(/\D/g, "") })} />
          </Field>
          <Field label="Viber" hint="Международный формат без +, например 37368358675. Пусто — кнопка скрыта.">
            <TextInput value={k.viber ?? ""} onChange={(v) => up({ viber: v.replace(/\D/g, "") })} />
          </Field>
          <Field label="Текст сообщения в WhatsApp" hint="Подставляется клиенту при нажатии на кнопку.">
            <TextInput value={k.chatText ?? ""} onChange={(v) => up({ chatText: v })} />
          </Field>
          <Field label="E-mail">
            <TextInput value={k.email} onChange={(v) => up({ email: v.trim() })} />
          </Field>
          <Field label="Часы работы" hint="Через запятую: дни, время">
            <TextInput value={k.hours} onChange={(v) => up({ hours: v })} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <MediaField label="Официальный логотип WhatsApp (SVG/PNG с whatsappbrand.com)" value={k.whatsappIcon ?? ""} onChange={(v) => up({ whatsappIcon: v })} />
          <MediaField label="Официальный логотип Viber (SVG/PNG из brand-материалов Viber)" value={k.viberIcon ?? ""} onChange={(v) => up({ viberIcon: v })} />
        </div>
      </Panel>
      <Panel title="Данные фирмы" hint="Футер и политика конфиденциальности.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Название фирмы">
            <TextInput value={k.company} onChange={(v) => up({ company: v })} />
          </Field>
          <Field label="CUI">
            <TextInput value={k.cui} onChange={(v) => up({ cui: v })} />
          </Field>
          <Field label="Nr. Reg. Comerțului" hint="Например J40/1234/2020">
            <TextInput value={k.regCom} onChange={(v) => up({ regCom: v })} />
          </Field>
          <Field label="Юридический адрес">
            <TextInput value={k.address} onChange={(v) => up({ address: v })} />
          </Field>
        </div>
      </Panel>
      <Panel title="Реклама" hint="Пусто — пиксель выключен.">
        <Field label="Meta Pixel ID">
          <TextInput value={c.tracking.metaPixelId} onChange={(v) => set("tracking", { ...c.tracking, metaPixelId: v.replace(/\D/g, "") })} />
        </Field>
      </Panel>
      <Panel
        title="AI-помощник (кнопка «Întrebări?»)"
        hint="Быстрые вопросы отвечают мгновенно этими текстами — даже без AI. Эти же ответы AI использует как главный источник. В ответах можно писать {oferte}, {pret}, {cadou}, {telefon} — подставятся актуальные пакеты, цена, подарок и телефон. «Ключевые слова» — по ним находится ответ, если AI недоступен."
      >
        <Field label="Приветствие">
          <TextInput value={c.assistant.greeting} onChange={(v) => set("assistant", { ...c.assistant, greeting: v })} />
        </Field>
        {c.assistant.faq.map((f, i, arr) => {
          const upF = (patch: Partial<typeof f>) => set("assistant", { ...c.assistant, faq: arr.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
          return (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">Вопрос {i + 1}</span>
                <RowButtons
                  onUp={i > 0 ? () => set("assistant", { ...c.assistant, faq: move(arr, i, -1) }) : undefined}
                  onDown={i < arr.length - 1 ? () => set("assistant", { ...c.assistant, faq: move(arr, i, 1) }) : undefined}
                  onRemove={() => set("assistant", { ...c.assistant, faq: arr.filter((_, k) => k !== i) })}
                />
              </div>
              <Field label="Вопрос (кнопка)">
                <TextInput value={f.q} onChange={(v) => upF({ q: v })} />
              </Field>
              <Field label="Ответ">
                <TextArea value={f.a} rows={3} onChange={(v) => upF({ a: v })} />
              </Field>
              <Field label="Ключевые слова (через запятую)">
                <TextInput value={f.keywords} onChange={(v) => upF({ keywords: v })} />
              </Field>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => set("assistant", { ...c.assistant, faq: [...c.assistant.faq, { q: "", a: "", keywords: "" }] })}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          <Plus className="w-4 h-4" /> Добавить вопрос
        </button>
      </Panel>
    </div>
  );
};


const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
    <span className="text-sm text-white/85">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 shrink-0 rounded-full transition ${checked ? "bg-amber-400" : "bg-white/15"}`}
    >
      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
    </button>
  </label>
);

/** Hybrid zoom editor: click the camera photo to mark the lens module, click the scene to set the zoom point. */
const HybridZoomEditor = ({ z, fallbackCam, onChange }: { z: Effects["hybridZoom"]; fallbackCam: string; onChange: (v: Effects["hybridZoom"]) => void }) => {
  const pick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10,
      y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10,
    };
  };
  const cam = z.cameraImage || fallbackCam;
  return (
    <div className="space-y-5">
      <MediaField
        label="Фото камеры"
        hint="Пусто — фото из блока подключения или главное фото галереи. Лучше PNG без фона, где хорошо видны нижние объективы."
        value={z.cameraImage}
        onChange={(v) => onChange({ ...z, cameraImage: v })}
      />
      {cam && (
        <div>
          <p className="text-xs text-white/50 mb-2">
            <b className="text-white/80">Кликните по фото</b> в центр нижнего модуля с двумя объективами — туда приблизится фото и сойдутся уголки фокусировки.
          </p>
          {/* same framing as on the site (object-cover, 3:5) so the point lands exactly */}
          <div className="relative w-40 aspect-[3/5] rounded-xl overflow-hidden border border-white/10 bg-zinc-300 cursor-crosshair" onClick={(e) => { const { x, y } = pick(e); onChange({ ...z, focusX: x, focusY: y }); }}>
            <img src={cam} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 border-2 border-cyan-300 rounded-md shadow-[0_0_10px_rgba(103,232,249,0.8)]" style={{ left: `${z.focusX}%`, top: `${z.focusY}%` }} />
          </div>
        </div>
      )}
      <Field label="Подпись под фото камеры">
        <TextInput value={z.lensLabel} onChange={(v) => onChange({ ...z, lensLabel: v })} />
      </Field>

      <MediaField
        label="Панорама — верхнее окно телефона"
        hint="То, что видит камера целиком. Саму камеру в кадре не показывать. Пусто — встроенная векторная сцена."
        value={z.sceneImage}
        onChange={(v) => onChange({ ...z, sceneImage: v })}
      />
      <div>
        <p className="text-xs text-white/50 mb-2">
          <b className="text-white/80">Кликните по панораме</b> в центр того участка, который показан на крупном кадре — туда приближается нижнее окно.
        </p>
        <div
          className={`relative w-full max-w-xs rounded-xl overflow-hidden border border-white/10 cursor-crosshair ${z.sceneImage ? "aspect-square" : "aspect-video"}`}
          onClick={(e) => { const { x, y } = pick(e); onChange({ ...z, targetX: x, targetY: y }); }}
        >
          <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
            {z.sceneImage ? <image href={z.sceneImage} x={0} y={0} width={SCENE_W} height={SCENE_H} preserveAspectRatio="xMidYMid slice" /> : <YardScene />}
          </svg>
          <span className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/30" style={{ left: `${z.targetX}%`, top: `${z.targetY}%` }} />
        </div>
      </div>
      <MediaField
        label="Крупный кадр — нижнее окно (необязательно)"
        hint="Чёткое приближение того же места, что на панораме: те же машины, номера и люди на тех же местах. Появляется в конце зума плавным переходом."
        value={z.zoomImage}
        onChange={(v) => onChange({ ...z, zoomImage: v })}
      />
      <Field
        label="Насколько приблизить панораму до перехода"
        hint="С крупным кадром — примерно во сколько раз он ближе панорамы (обычно 1.3–2). Без крупного кадра — до 2–3, дальше фото размывается. Счётчик на экране всегда доходит до 10x."
      >
        <NumberInput value={z.maxZoom} onChange={(v) => onChange({ ...z, maxZoom: v ?? 1.55 })} />
      </Field>
      <Field label="Заголовок">
        <TextInput value={z.title} onChange={(v) => onChange({ ...z, title: v })} />
      </Field>
      <Field label="Подзаголовок">
        <TextInput value={z.subtitle} onChange={(v) => onChange({ ...z, subtitle: v })} />
      </Field>
    </div>
  );
};

const EffectsTab = ({ c, set }: { c: SiteContent; set: Update }) => {
  const e = c.effects;
  const up = <K extends keyof Effects>(key: K, value: Effects[K]) => set("effects", { ...e, [key]: value });
  const upStat = (i: number, patch: Partial<StatItem>) =>
    up("stats", { ...e.stats, items: e.stats.items.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  return (
    <div className="space-y-5">
      <Panel title="Движение на странице" hint="Для посетителей, у которых в телефоне отключена анимация, эффекты выключаются сами.">
        <Toggle label="Плавное появление блоков при скролле" checked={e.motion.reveal} onChange={(v) => up("motion", { ...e.motion, reveal: v })} />
        <Toggle label="Неоновое свечение с глубиной (параллакс)" checked={e.motion.parallax} onChange={(v) => up("motion", { ...e.motion, parallax: v })} />
        <Toggle label="Перелёт фото из миниатюры в главное окно" checked={e.motion.galleryMorph} onChange={(v) => up("motion", { ...e.motion, galleryMorph: v })} />
        <Toggle label="Лазерное раскрытие картинок блоков" checked={e.motion.scanReveal} onChange={(v) => up("motion", { ...e.motion, scanReveal: v })} />
        <Toggle label="Цифровая сетка на фоне" checked={e.motion.techGrid} onChange={(v) => up("motion", { ...e.motion, techGrid: v })} />
        <Toggle label="Неоновая полоса прогресса вверху" checked={e.motion.progressBeam} onChange={(v) => up("motion", { ...e.motion, progressBeam: v })} />
      </Panel>

      <Panel title="Подключение по шагам" hint="Телефон по центру, на каждом шаге — свой скриншот из приложения. Камера выплывает рядом на шагах, где включён переключатель.">
        <Toggle label="Показывать блок" checked={e.setup.enabled} onChange={(v) => up("setup", { ...e.setup, enabled: v })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Надпись над заголовком">
            <TextInput value={e.setup.eyebrow} onChange={(v) => up("setup", { ...e.setup, eyebrow: v })} />
          </Field>
          <Field label="Заголовок">
            <TextInput value={e.setup.title} onChange={(v) => up("setup", { ...e.setup, title: v })} />
          </Field>
        </div>
        <div className="space-y-3">
          {e.setup.steps.map((st, i) => {
            const upStep = (patch: Partial<typeof st>) =>
              up("setup", { ...e.setup, steps: e.setup.steps.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
            return (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-orbitron text-sm font-bold text-cyan-200">Шаг {String(i + 1).padStart(2, "0")}</span>
                  <RowButtons
                    onUp={i > 0 ? () => up("setup", { ...e.setup, steps: move(e.setup.steps, i, -1) }) : undefined}
                    onDown={i < e.setup.steps.length - 1 ? () => up("setup", { ...e.setup, steps: move(e.setup.steps, i, 1) }) : undefined}
                    onRemove={() => up("setup", { ...e.setup, steps: e.setup.steps.filter((_, k) => k !== i) })}
                  />
                </div>
                <TextInput value={st.title} placeholder="Заголовок шага" onChange={(v) => upStep({ title: v })} />
                <TextArea rows={2} value={st.text} onChange={(v) => upStep({ text: v })} />
                <Field label="Экран на телефоне" hint="Встроенный экран нарисован в стиле приложения, на румынском. Загруженный скриншот заменяет его.">
                  <select className={inputCls} value={st.screen ?? "none"} onChange={(ev) => upStep({ screen: ev.target.value as AppScreenKey })}>
                    {APP_SCREENS.map((k) => (
                      <option key={k} value={k} className="bg-slate-900">
                        {{ download: "Скачать приложение", email: "Ввод e-mail", code: "Код подтверждения", bluetooth: "Поиск по Bluetooth", wifi: "Подключение к WiFi", none: "Пустой" }[k]}
                      </option>
                    ))}
                  </select>
                </Field>
                <MediaField label="Свой скриншот (необязательно, вертикальный)" value={st.image} onChange={(v) => upStep({ image: v })} />
                <Field label="Подробности (при нажатии на телефон)" hint="Каждая строка — отдельный пункт.">
                  <TextArea rows={3} value={st.details ?? ""} onChange={(v) => upStep({ details: v })} />
                </Field>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => up("setup", { ...e.setup, steps: [...e.setup.steps, { title: "", text: "", image: "", screen: "none", showCamera: false }] })}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/80 text-sm hover:bg-white/10"
          >
            <Plus className="w-4 h-4" /> Добавить шаг
          </button>
        </div>
      </Panel>

      <Panel title="Подключение телефона к камере" hint="Камера выезжает слева, телефон справа, в центре значок связи, на экране телефона — шаги подключения, в конце — надпись.">
        <Toggle label="Показывать блок" checked={e.pairing.enabled} onChange={(v) => up("pairing", { ...e.pairing, enabled: v })} />
        <Field label="Тип связи" hint="Указывайте только реальный способ подключения камеры.">
          <div className="flex gap-2">
            {(["bluetooth", "wifi"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => up("pairing", { ...e.pairing, link: k })}
                className={`px-4 py-2 rounded-xl text-sm ${e.pairing.link === k ? "bg-amber-400 text-slate-900 font-semibold" : "border border-white/15 text-white/80"}`}
              >
                {k === "bluetooth" ? "Bluetooth" : "WiFi"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Надпись">
          <TextArea rows={2} value={e.pairing.title} onChange={(v) => up("pairing", { ...e.pairing, title: v })} />
        </Field>
        <MediaField
          label="Фото камеры (лучше PNG без фона)"
          hint="Пусто — берётся главное фото галереи."
          value={e.pairing.cameraImage}
          onChange={(v) => up("pairing", { ...e.pairing, cameraImage: v })}
        />
        <Field label="Название приложения на экране телефона">
          <TextInput value={e.pairing.appName} onChange={(v) => up("pairing", { ...e.pairing, appName: v })} />
        </Field>
      </Panel>

      <Panel title="Гибридный зум 10x" hint="Камера с акцентом на нижних объективах + телефон: панорама и окно, которое приближает 1x → 10x.">
        <Toggle label="Показывать блок" checked={e.hybridZoom.enabled} onChange={(v) => up("hybridZoom", { ...e.hybridZoom, enabled: v })} />
        <HybridZoomEditor z={e.hybridZoom} fallbackCam={e.pairing.cameraImage || c.gallery[0]} onChange={(v) => up("hybridZoom", v)} />
      </Panel>

      <Panel title="День → ночь" hint="Обе фотографии — с одной и той же точки, те же объекты на тех же местах. Без ночного фото сайт сам сделает ИК-версию из дневного.">
        <Toggle label="Показывать блок" checked={e.dayNight.enabled} onChange={(v) => up("dayNight", { ...e.dayNight, enabled: v })} />
        <MediaField label="Дневная сцена" value={e.dayNight.dayImage} onChange={(v) => up("dayNight", { ...e.dayNight, dayImage: v })} />
        <MediaField label="Ночная сцена с ИК (необязательно)" value={e.dayNight.nightImage} onChange={(v) => up("dayNight", { ...e.dayNight, nightImage: v })} />
        <Field label="Заголовок">
          <TextInput value={e.dayNight.title} onChange={(v) => up("dayNight", { ...e.dayNight, title: v })} />
        </Field>
        <Field label="Подзаголовок">
          <TextInput value={e.dayNight.subtitle} onChange={(v) => up("dayNight", { ...e.dayNight, subtitle: v })} />
        </Field>
      </Panel>

      <Panel
        title={`Поворот на 360° (кадров: ${e.rotate.frames.length})`}
        hint="Нужно минимум 8 кадров, лучше 36. Выберите все кадры сразу — порядок возьмётся по именам файлов (frame_01, frame_02…). Фон на всех кадрах одинаковый."
      >
        <Toggle label="Показывать блок" checked={e.rotate.enabled} onChange={(v) => up("rotate", { ...e.rotate, enabled: v })} />
        <GalleryEditor items={e.rotate.frames} onChange={(v) => up("rotate", { ...e.rotate, frames: v })} />
        {e.rotate.frames.length > 0 && (
          <button type="button" onClick={() => up("rotate", { ...e.rotate, frames: [] })} className="px-3 py-2 rounded-xl border border-white/15 text-white/70 text-sm hover:bg-white/10">
            Удалить все кадры
          </button>
        )}
        <Field label="Заголовок">
          <TextInput value={e.rotate.title} onChange={(v) => up("rotate", { ...e.rotate, title: v })} />
        </Field>
        <Field label="Подзаголовок">
          <TextInput value={e.rotate.subtitle} onChange={(v) => up("rotate", { ...e.rotate, subtitle: v })} />
        </Field>
      </Panel>

      <Panel title="Счётчики цифр" hint="Большие цифры, которые «набегают» при появлении. Указывайте только реальные характеристики.">
        <Toggle label="Показывать блок" checked={e.stats.enabled} onChange={(v) => up("stats", { ...e.stats, enabled: v })} />
        <div className="space-y-3">
          {e.stats.items.map((st, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.2fr_1fr] sm:grid-cols-[80px_100px_80px_1fr_auto] gap-2 items-center">
              <TextInput value={st.prefix} placeholder="до" onChange={(v) => upStat(i, { prefix: v })} />
              <NumberInput value={st.value} onChange={(v) => upStat(i, { value: v ?? 0 })} />
              <TextInput value={st.suffix} placeholder="после" onChange={(v) => upStat(i, { suffix: v })} />
              <div className="col-span-3 sm:col-span-1">
                <TextInput value={st.label} placeholder="подпись" onChange={(v) => upStat(i, { label: v })} />
              </div>
              <div className="col-span-3 sm:col-span-1 flex justify-end">
                <RowButtons
                  onUp={i > 0 ? () => up("stats", { ...e.stats, items: move(e.stats.items, i, -1) }) : undefined}
                  onDown={i < e.stats.items.length - 1 ? () => up("stats", { ...e.stats, items: move(e.stats.items, i, 1) }) : undefined}
                  onRemove={() => up("stats", { ...e.stats, items: e.stats.items.filter((_, k) => k !== i) })}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => up("stats", { ...e.stats, items: [...e.stats.items, { value: 0, prefix: "", suffix: "", label: "" }] })}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/80 text-sm hover:bg-white/10"
          >
            <Plus className="w-4 h-4" /> Добавить цифру
          </button>
        </div>
      </Panel>
    </div>
  );
};

interface Order {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  county: string;
  city: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  discount?: { percent: number; amount: number };
  delivery?: string;
  source?: string;
  telegram?: "sent" | "failed";
}

const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (next?: string | null) => {
    setLoading(true);
    try {
      const q = next ? `?cursor=${encodeURIComponent(next)}` : "";
      const data = await api<{ orders: Order[]; cursor: string | null }>(`/api/admin/orders${q}`);
      setOrders((o) => (next ? [...o, ...data.orders] : data.orders));
      setCursor(data.cursor);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm("Удалить этот заказ из списка?")) return;
    try {
      await api(`/api/admin/orders/${id}`, { method: "DELETE" });
      setOrders((o) => o.filter((x) => x.id !== id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Panel title={`Заказы${orders.length ? ` (${orders.length}${cursor ? "+" : ""})` : ""}`} hint="Новые сверху. Каждый заказ также уходит в Telegram.">
      <button
        type="button"
        onClick={() => load()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/80 text-sm hover:bg-white/10"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Обновить
      </button>
      {!loading && orders.length === 0 && <p className="text-sm text-white/50">Заказов пока нет.</p>}
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 md:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-white font-semibold">{o.fullName}</p>
                <a href={`tel:${o.phone}`} className="text-amber-300 text-sm font-mono">
                  {formatPhone(o.phone)}
                </a>
              </div>
              <div className="text-right">
                <p className="text-white font-orbitron font-bold">{o.total} lei</p>
                <p className="text-[11px] text-white/50">{new Date(o.createdAt).toLocaleString("ru-RU")}</p>
              </div>
            </div>
            <p className="text-sm text-white/70 mt-2">
              {o.county}, {o.city}, {o.address}
            </p>
            <ul className="text-xs text-white/60 mt-1">
              {o.items.map((i, k) => (
                <li key={k}>
                  • {i.name} × {i.quantity}
                </li>
              ))}
              {o.discount && <li className="text-emerald-300">• Скидка {o.discount.percent}%: −{o.discount.amount} lei</li>}
              {o.delivery && <li>• Доставка: {o.delivery}</li>}
            </ul>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-white/40">
                {o.source}
                {o.telegram === "sent" && " • Telegram ✓"}
                {o.telegram === "failed" && <span className="text-red-300"> • Telegram не дошёл</span>}
              </span>
              <button type="button" onClick={() => remove(o.id)} className="p-2 rounded-lg text-red-300/70 hover:text-red-200 hover:bg-red-500/15" aria-label="Удалить">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {cursor && (
        <button type="button" onClick={() => load(cursor)} disabled={loading} className="w-full py-2.5 rounded-xl border border-white/15 text-white/80 text-sm hover:bg-white/10">
          Показать ещё
        </button>
      )}
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS = [
  { id: "product", label: "Товар и цены" },
  { id: "photos", label: "Фото и видео" },
  { id: "texts", label: "Тексты" },
  { id: "effects", label: "Эффекты" },
  { id: "settings", label: "Контакты и настройки" },
  { id: "orders", label: "Заказы" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const Login = ({ onDone }: { onDone: () => void }) => {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-zinc-900 to-black">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur-2xl p-7 space-y-4">
        <h1 className="font-orbitron text-xl font-bold text-white text-center">Админка сайта</h1>
        <input type="password" autoFocus className={inputCls} placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-300 text-center">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full min-h-[48px] rounded-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти"}
        </button>
      </form>
    </main>
  );
};

const Admin = () => {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [tab, setTab] = useState<TabId>("product");
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [saved, setSaved] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const draftJson = JSON.stringify(content);
  const dirty = auth === "in" && saved !== "" && draftJson !== saved;

  const loadAll = async () => {
    const { content: stored } = await api<{ content: unknown }>("/api/content");
    const merged = mergeContent(stored);
    setContent(merged);
    setSaved(JSON.stringify(merged));
  };

  useEffect(() => {
    api("/api/admin/session")
      .then(async () => {
        await loadAll();
        setAuth("in");
      })
      .catch(() => setAuth("out"));
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const set: Update = (key, value) => setContent((c) => ({ ...c, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: draftJson,
      });
      setSaved(draftJson);
      setContentCache(content);
      toast.success("Сохранено. На сайте обновится в течение минуты.");
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) setAuth("out");
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export / import all settings as a file — e.g. to copy this site to another domain.
  // Uploaded photos (/media/…) are exported as full links to this site, so the
  // copy shows them as long as this site stays online.
  const exportContent = () => {
    const json = JSON.stringify(content, null, 2).replace(/"\/media\//g, `"${location.origin}/media/`);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = `site-settings-${location.hostname}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importRef = useRef<HTMLInputElement>(null);
  const importContent = async (file: File) => {
    try {
      setContent(mergeContent(JSON.parse(await file.text())));
      toast.success("Настройки загружены. Проверьте и нажмите «Сохранить».");
    } catch {
      toast.error("Это не файл настроек сайта.");
    }
  };

  const logout = async () => {
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    setAuth("out");
  };

  if (auth === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-amber-300 animate-spin" />
      </main>
    );
  }
  if (auth === "out") {
    return (
      <Login
        onDone={async () => {
          try {
            await loadAll();
          } catch {
            /* keep defaults */
          }
          setAuth("in");
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black pb-28">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="font-orbitron text-sm md:text-base font-bold text-white flex-1">Админка</h1>
          <Link to="/" target="_blank" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ExternalLink className="w-4 h-4" /> Сайт
          </Link>
          <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <LogOut className="w-4 h-4" /> Выйти
          </button>
        </div>
        <nav className="max-w-5xl mx-auto px-2 md:px-4 pb-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-sm transition ${
                tab === t.id ? "bg-amber-400 text-slate-900 font-semibold" : "text-white/70 hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5">
        {tab === "product" && <ProductTab c={content} set={set} />}
        {tab === "photos" && <PhotosTab c={content} set={set} />}
        {tab === "texts" && <TextsTab c={content} set={set} />}
        {tab === "effects" && <EffectsTab c={content} set={set} />}
        {tab === "settings" && <SettingsTab c={content} set={set} />}
        {tab === "orders" && <OrdersTab />}
      </div>

      {tab !== "orders" && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="flex-1 text-xs text-white/60">{dirty ? "Есть несохранённые изменения" : "Всё сохранено"}</span>
            <button type="button" onClick={exportContent} className="px-3 min-h-[40px] rounded-full border border-white/15 text-xs text-white/80 hover:bg-white/10" title="Скачать все настройки файлом">
              Экспорт
            </button>
            <button type="button" onClick={() => importRef.current?.click()} className="px-3 min-h-[40px] rounded-full border border-white/15 text-xs text-white/80 hover:bg-white/10" title="Загрузить настройки из файла">
              Импорт
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importContent(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 px-5 min-h-[46px] rounded-full font-bold text-sm bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-900 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : dirty ? <Save className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              {dirty ? "Сохранить" : "Сохранено"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Admin;

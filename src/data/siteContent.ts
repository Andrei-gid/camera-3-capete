// Everything the admin panel can change lives in this one structure.
// DEFAULT_CONTENT is what the site shows until something is saved in /admin;
// a saved section always replaces the default section of the same name.
// Shared by the website (src/) and the Worker (worker/), so keep it free of
// browser-only or React imports.

export const ICON_NAMES = [
  "Camera",
  "ZoomIn",
  "RefreshCw",
  "Crosshair",
  "Moon",
  "Sun",
  "Mic",
  "Bell",
  "Smartphone",
  "Shield",
  "ShieldCheck",
  "Wifi",
  "Truck",
  "RotateCcw",
  "Wallet",
  "Zap",
  "Eye",
  "Clock",
  "Lock",
  "Video",
  "Star",
  "Battery",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

export interface SpecItem {
  icon: IconName;
  title: string;
  detail: string;
}

export interface Hotspot {
  x: number; // % from the left of the photo
  y: number; // % from the top of the photo
  title: string;
  description: string;
  image: string;
}

export const APP_SCREENS = ["download", "email", "code", "bluetooth", "wifi", "none"] as const;
export type AppScreenKey = (typeof APP_SCREENS)[number];

export interface StatItem {
  value: number; // number that counts up
  prefix: string; // shown before, e.g. ""
  suffix: string; // shown after, e.g. "x", "°", "%"
  label: string; // caption under the number
}

export interface Effects {
  hybridZoom: {
    enabled: boolean;
    title: string;
    subtitle: string;
    cameraImage: string; // photo of this camera model; "" = pairing photo, then first gallery photo
    focusX: number; // % on the camera photo — centre of the lower module with the two lenses
    focusY: number;
    lensLabel: string; // chip under the neon ring
    sceneImage: string; // panorama (upper phone window); "" = built-in vector yard scene
    zoomImage: string; // optional sharp close-up for the lower window, crossfaded in at the end
    targetX: number; // % on the panorama — centre of the area the lower window zooms into
    targetY: number;
    maxZoom: number; // how far the panorama is magnified before the close-up takes over
  };
  dayNight: {
    enabled: boolean;
    dayImage: string; // "" = hidden
    nightImage: string; // same viewpoint at night with IR; "" = generated from dayImage
    title: string;
    subtitle: string;
  };
  rotate: {
    enabled: boolean;
    frames: string[]; // product photos in rotation order; shown when ≥ 8
    title: string;
    subtitle: string;
  };
  stats: { enabled: boolean; items: StatItem[] };
  setup: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    // Phone screen per step: an uploaded screenshot (image) wins; otherwise the
    // built-in code-drawn app screen named in `screen` is shown.
    steps: { title: string; text: string; details?: string; image: string; screen: AppScreenKey; showCamera: boolean }[]; // details: one tip per line, shown when the phone card is tapped
  };
  pairing: {
    enabled: boolean;
    title: string; // headline that appears at the end
    cameraImage: string; // product photo, ideally PNG without background; "" = first gallery photo
    link: "bluetooth" | "wifi"; // icon in the middle and wording on the phone
    appName: string; // shown in the phone's app header
  };
  motion: {
    reveal: boolean;
    parallax: boolean;
    galleryMorph: boolean;
    scanReveal: boolean; // neon laser line uncovers block images
    techGrid: boolean; // perspective grid in the background
    progressBeam: boolean; // neon scroll-progress line at the top
  };
}

export interface Package {
  qty: number; // cameras in the package
  price: number; // total price in lei (computed from `discount` when it is set)
  label: string; // e.g. "Pachet 1+1"
  badge: string; // ribbon, e.g. "Ofertă 1+1"; "" = none
  featured: boolean; // highlighted and selected by default
  // % off the WHOLE order (cameras + chosen accessories). When set, `price` is
  // derived as unit price × qty minus this percent. Older saved packages
  // without it keep their fixed price.
  discount?: number;
}

/** Optional extra offered in the order forms (Da / Nu, default Nu). */
export interface Addon {
  id: string; // stable key, e.g. "microsd"
  title: string; // e.g. "Card microSD 64 GB"
  text: string; // one short line of benefit
  price: number; // special price in lei, per camera
  oldPrice: number | null; // crossed-out price; null = hidden
  image: string; // picture; "" = icon placeholder
  detail?: string; // longer explanation shown when the photo is opened; "" = only the short line
}

export interface SiteContent {
  product: {
    title: string; // big title in the hero and on orders
    subtitle: string; // small uppercase line under the title
    price: number; // lei
    oldPrice: number | null; // crossed-out price; null = hidden
    sellerLine: string; // small line under the order button
    // Quantity offers. Price is the TOTAL for that many cameras; the discount
    // shown is computed against price × qty. Empty list = single price only.
    packages: Package[];
  };
  delivery: {
    free: boolean; // true = "Gratuită"; false = paidText is shown instead
    paidText: string; // shown when delivery is not free, e.g. "Conform tarifului curierului"
    shippingOldPrice: number | null; // crossed-out courier price shown next to "Gratuită"
    verifyOldPrice: number | null; // crossed-out parcel-check price shown next to "Gratuită"
    note: string; // line under prices when delivery is paid; "" = hidden
    short: string; // short value on the hero "Livrare" chip when delivery is paid
    courierPrice: number; // courier fee in lei, charged once per order whatever the quantity
    pickupText: string; // name of the free pickup option, e.g. "Ridicare din depozit, Chișinău"
  };
  // Accessories offered in the order forms. Each one the client accepts is
  // added once per camera, always at full price: the package discount is for cameras only.
  addons: {
    enabled: boolean;
    title: string; // heading of the block
    text: string; // small line under the heading
    items: Addon[];
  };
  gallery: string[]; // hero photos, first = main
  specs: SpecItem[];
  infographic: {
    heading: string;
    image: string;
    hotspots: Hotspot[];
  };
  trust: { icon: IconName; text: string }[];
  media: {
    specsImage: string; // product render after the counters (transparent PNG/WebP looks best); "" = hidden
    rotationImage: string; // detail close-up before the video; "" = hidden
    moduleTitle: string; // caption of the close-up
    moduleSubtitle: string;
    video: string; // "" = video block hidden
    deliveryImage: string; // "" = text card shown instead
    carousel: string[]; // mobile swipe gallery; empty = uses gallery
  };
  deliveryCard: { title: string; subtitle: string };
  contact: {
    phone: string; // as dialled, e.g. 068358675
    whatsapp: string; // international digits, e.g. 37368358675; "" = hidden
    viber: string; // international digits, e.g. 37368358675; "" = hidden
    chatText: string; // message prefilled in WhatsApp when the client taps the button
    whatsappIcon: string; // official WhatsApp logo file (uploaded in /admin); "" = plain fallback
    viberIcon: string; // official Viber logo file (uploaded in /admin); "" = plain fallback
    email: string;
    hours: string;
    company: string;
    cui: string;
    regCom: string;
    address: string;
  };
  // Promo gift shown in the hero, both order forms and the Telegram order
  gift: {
    enabled: boolean;
    badge: string; // small ribbon, e.g. "CADOU"
    title: string; // e.g. "Card microSD 64 GB"
    text: string; // one line under the title
    value: number | null; // crossed-out value in lei; null = hidden
    image: string; // transparent picture of the gift
  };
  // Chat assistant: quick questions answered instantly (no AI needed); the
  // same texts are given to the AI for free-form questions. Variables in
  // answers: {oferte} {pret} {cadou} {telefon}.
  assistant: {
    greeting: string;
    faq: { q: string; a: string; keywords: string }[];
  };
  tracking: { metaPixelId: string };
  effects: Effects;
}

export type SectionKey = keyof SiteContent;

const CDN = "https://cdn.shopify.com/s/files/1/0964/1990/5842/files";
const IMG = {
  main: `${CDN}/generated-image_14.png?v=1767020426`,
  alt: `${CDN}/generated-image_13.png?v=1769341681`,
  photo1: `${CDN}/photo_2025-12-29_16-38-59_2.jpg?v=1769341681`,
  photo2: `${CDN}/photo_2025-12-29_16-38-59.jpg?v=1769341681`,
  photo3: `${CDN}/photo_2025-12-29_16-39-00_3.jpg?v=1769341681`,
};

export const DEFAULT_CONTENT: SiteContent = {
  product: {
    title: "Cameră de Supraveghere cu 3 Obiective",
    subtitle: "Zoom Hibrid 10x • Rotire PTZ • IP66",
    price: 650,
    oldPrice: null,
    sellerLine: "Vândut de INVEST GLOBO TECH S.R.L. • Plată la livrare",
    packages: [
      { qty: 1, price: 650, label: "1 cameră", badge: "", featured: false, discount: 0 },
      { qty: 2, price: 1170, label: "2 camere", badge: "-10%", featured: false, discount: 10 },
      { qty: 3, price: 1658, label: "3 camere", badge: "-15%", featured: false, discount: 15 },
    ],
  },
  delivery: {
    free: false,
    paidText: "Curier expres la domiciliu",
    shippingOldPrice: null,
    verifyOldPrice: null,
    note: "Prețul este valabil la ridicare din depozit, Chișinău. Livrare expres prin curier la domiciliu: +100 lei pentru întreaga comandă, indiferent de numărul de camere și accesorii.",
    short: "Curier +100 lei",
    courierPrice: 100,
    pickupText: "Ridicare din depozit, Chișinău",
  },
  addons: {
    enabled: true,
    title: "Doriți să adăugați la comandă?",
    text: "Opțional. Preț special doar împreună cu camera.",
    items: [
      {
        id: "microsd",
        title: "Card microSD 64 GB",
        text: "Înregistrările se salvează direct în cameră.",
        price: 100,
        oldPrice: null,
        image: "/effects/gift-microsd.webp",
      },
      {
        id: "power",
        title: "Bloc de alimentare cu acumulatori",
        text: "Protecție la variații de tensiune + până la 4 ore de autonomie.",
        price: 100,
        oldPrice: null,
        image: "/effects/addon-power.webp",
        detail:
          "Bloc de alimentare cu acumulator integrat. Protejează camera de variațiile de tensiune și asigură funcționarea autonomă: la o pană de curent, camera continuă să funcționeze de la acumulator până la 4 ore.",
      },
      {
        id: "cable",
        title: "Cablu cu conectori 2 în 1, 20 m",
        text: "Internet + alimentare într-un singur cablu.",
        price: 100,
        oldPrice: null,
        image: "/effects/addon-cable.webp",
        detail:
          "Cablu 2 în 1, lungime 20 m: prin el trec două semnale — internetul de la router și alimentarea camerei. Un singur cablu în loc de două.",
      },
    ],
  },
  // 3-head camera with floodlights (the version sold on this site)
  gallery: ["/products/cam3-front.webp", "/products/cam3-house.webp", "/products/cam3-rotation.webp", "/products/cam3-white.webp"],
  specs: [
    {
      icon: "Camera",
      title: "3 OBIECTIVE (Monitorizare simultană)",
      detail:
        "Trei camere într-un singur aparat! Obiectivul de sus urmărește permanent întreaga zonă, iar cele două obiective de pe capul rotativ se apropie de detalii — nu pierdeți nimic din ce se întâmplă.",
    },
    {
      icon: "ZoomIn",
      title: "ZOOM HIBRID 10x (Detalii de la distanță)",
      detail:
        "Măriți imaginea direct din telefon și vedeți clar fețe sau numere de înmatriculare de la distanță mare, fără să vă apropiați de cameră.",
    },
    {
      icon: "RefreshCw",
      title: "ROTIRE PTZ (Control de pe telefon)",
      detail:
        "Rotiți camera stânga-dreapta și sus-jos cu un deget, din aplicație. O singură cameră acoperă curtea, poarta și intrarea.",
    },
    {
      icon: "Crosshair",
      title: "URMĂRIRE AUTOMATĂ (Detectare persoane)",
      detail:
        "Camera recunoaște mișcarea unei persoane și se rotește singură după ea, în timp real. Nu trebuie să o controlați manual.",
    },
    {
      icon: "Moon",
      title: "VEDERE NOCTURNĂ (LED + infraroșu)",
      detail:
        "Supraveghere 24/7: ziua, noaptea și pe întuneric total. Luminile integrate vă arată ce se întâmplă chiar și la ore târzii.",
    },
    {
      icon: "Mic",
      title: "AUDIO BIDIRECȚIONAL (Microfon + difuzor)",
      detail:
        "Ascultați ce se întâmplă și vorbiți direct cu cei de afară prin aplicație — cu curierul, cu un vizitator sau pentru a descuraja un intrus.",
    },
    {
      icon: "Bell",
      title: "NOTIFICĂRI INSTANT (Senzor de mișcare)",
      detail:
        "Primiți alertă pe telefon în momentul în care camera detectează o activitate suspectă. Sunteți primul care află.",
    },
    {
      icon: "Smartphone",
      title: "APLICAȚIA V380 PRO (Acces de oriunde)",
      detail:
        "Imagine live, control al camerei și înregistrări — de pe telefon, din orice colț al lumii. Aplicația este gratuită, pentru Android și iPhone.",
    },
    {
      icon: "Shield",
      title: "PROTECȚIE IP66 (Montaj exterior)",
      detail: "Carcasă rezistentă la ploaie, praf și intemperii. Construită pentru a funcționa afară, tot anul.",
    },
    {
      icon: "Wifi",
      title: "CONECTARE WIFI (Instalare simplă)",
      detail:
        "Fără cabluri de date trase prin toată casa. Conectați camera la rețeaua WiFi și o configurați din aplicație în câteva minute.",
    },
  ],
  infographic: {
    heading: "Anatomia Camerei cu 3 Obiective",
    image: IMG.main,
    hotspots: [
      {
        x: 77,
        y: 32.9,
        title: "Obiectiv Panoramic Fix",
        description:
          "Obiectivul de sus supraveghează permanent întreaga zonă, chiar și când capul rotativ urmărește altceva.",
        image: IMG.photo1,
      },
      {
        x: 69,
        y: 56.3,
        title: "Două Obiective cu Zoom Hibrid 10x",
        description: "Capul rotativ are două obiective care apropie detaliile: fețe, haine, numere de înmatriculare.",
        image: IMG.photo2,
      },
      {
        x: 46.1,
        y: 56.6,
        title: "Rotire PTZ + Urmărire Automată",
        description: "Se rotește din telefon sau singură, după persoana detectată în cadru.",
        image: IMG.alt,
      },
      {
        x: 68.8,
        y: 68.9,
        title: "Lumini LED + Infraroșu",
        description: "Imagine clară noaptea și efect de descurajare pentru cei care se apropie.",
        image: IMG.photo3,
      },
      {
        x: 52.9,
        y: 38.4,
        title: "Carcasă Exterior IP66",
        description: "Rezistentă la ploaie, praf și temperaturi de afară, pentru funcționare tot anul.",
        image: IMG.main,
      },
    ],
  },
  trust: [
    { icon: "ShieldCheck", text: "Garanție 12 luni" },
    { icon: "Truck", text: "Livrare 24-48h" },
    { icon: "RotateCcw", text: "Retur 14 zile" },
    { icon: "Wallet", text: "Plata la livrare" },
  ],
  media: {
    specsImage: "/products/cam3-cutout.webp", // 3-head camera cut-out (floating product, offer cards, gift)
    rotationImage: "/effects/camera-module.webp", // close-up of the lower PTZ module
    moduleTitle: "Modulul PTZ cu zoom hibrid",
    moduleSubtitle: "Două obiective, lumini LED și infraroșu, rotire și urmărire automată.",
    video: "",
    deliveryImage: "",
    carousel: [],
  },
  deliveryCard: {
    title: "Verificarea obligatorie la primire garantează o tranzacție sigură.",
    subtitle: "100% sigur. Cumpără cu încredere.",
  },
  contact: {
    phone: "068358675",
    whatsapp: "37368358675",
    viber: "37368358675",
    chatText: "Bună ziua! Mă interesează camera LuxCam.",
    whatsappIcon: "",
    viberIcon: "",
    email: "casto.romag@gmail.com",
    hours: "Luni – Duminică, 08:00 – 19:00",
    company: "INVEST GLOBO TECH S.R.L.",
    cui: "1013600008184", // IDNO
    regCom: "",
    address: "mun. Chișinău, bd. Mircea cel Bătrîn 27, of. 41",
  },
  gift: {
    enabled: false,
    badge: "CADOU",
    title: "Card microSD 64 GB",
    text: "Inclus GRATUIT în colet, la fiecare cameră comandată.",
    value: null,
    image: "/effects/gift-microsd.webp",
  },
  assistant: {
    greeting: "Bună! Alegeți o întrebare sau scrieți-mi orice despre cameră.",
    faq: [
      {
        q: "Cât costă? Ce oferte aveți?",
        a: "{oferte}\n{accesorii}\nLivrarea se achită separat, conform tarifului curierului. Plata se face la livrare.",
        keywords: "cost, preț, pret, ofertă, oferta, reducere, lei, pachet, 1+1, două, doua",
      },
      {
        q: "Cât durează livrarea?",
        a: "Livrăm prin curier în toată Moldova, de obicei în 24–48 de ore lucrătoare de la confirmarea comenzii. Livrarea se achită separat, conform tarifului curierului, iar coletul îl puteți verifica înainte de plată.",
        keywords: "livrare, livrarea, curier, ajunge, colet, zile, transport",
      },
      {
        q: "Cum se face plata?",
        a: "Plata se face la livrare (ramburs), direct curierului — nu plătiți nimic online. Înainte de plată puteți deschide și verifica coletul.",
        keywords: "plată, plata, plătesc, platesc, ramburs, card, bani, avans",
      },
      {
        q: "Cum funcționează zoom-ul?",
        a: "Camera are 3 obiective: cel de sus filmează permanent toată zona, iar cele două de pe capul rotativ apropie detaliile cu zoom hibrid de până la 10x. Măriți imaginea direct din aplicația V380 Pro, de pe telefon.",
        keywords: "zoom, mărire, marire, apropie, distanță, distanta, obiective, numere",
      },
      {
        q: "Merge cu telefonul?",
        a: "Da. Camera se conectează la WiFi și o vedeți în aplicația gratuită V380 Pro (Android și iPhone): imagine live, rotire, zoom, notificări la mișcare și audio în ambele sensuri — de oriunde aveți internet.",
        keywords: "telefon, aplicație, aplicatie, v380, android, iphone, internet, wifi, live",
      },
      {
        q: "Merge noaptea și afară?",
        a: "Da. Carcasa este IP66 — rezistentă la ploaie și praf, pentru montaj exterior. Noaptea pornesc automat luminile LED și infraroșu, așa că vedeți imaginea 24/7.",
        keywords: "noapte, noaptea, întuneric, intuneric, ploaie, exterior, afară, afara, ip66, iarnă",
      },
      {
        q: "Cum o instalez?",
        a: "Montați și porniți camera, descărcați aplicația V380 Pro, vă creați un cont, adăugați camera prin Bluetooth și o conectați la WiFi-ul de acasă. Durează câteva minute; pașii sunt arătați și pe pagină.",
        keywords: "instalez, instalare, montez, montaj, conectez, configurare, bluetooth, cont",
      },
      {
        q: "Am nevoie de card de memorie?",
        a: "Cardul microSD păstrează înregistrările direct în cameră. Îl puteți adăuga la comandă, la preț special.\n{accesorii}",
        keywords: "card, memorie, microsd, sd, înregistrare, inregistrare, cadou, stocare",
      },
    ],
  },
  tracking: { metaPixelId: "1647680606325444" },
  effects: {
    hybridZoom: {
      enabled: true,
      title: "Zoom hibrid 10x",
      subtitle: "Două obiective pe capul rotativ apropie detaliile de la distanță.",
      cameraImage: "/effects/hz-camera.webp",
      focusX: 55.5,
      focusY: 72,
      lensLabel: "2 obiective • zoom hibrid 10x",
      sceneImage: "/effects/hz-panorama.webp",
      zoomImage: "/effects/hz-zoom.webp",
      targetX: 49,
      targetY: 45,
      maxZoom: 1.55,
    },
    dayNight: {
      enabled: true,
      dayImage: "",
      nightImage: "",
      title: "Ziua și noaptea",
      subtitle: "Imagine clară 24/7 — luminile LED și infraroșu pornesc automat.",
    },
    rotate: {
      enabled: true,
      frames: [],
      title: "Priviți camera din toate unghiurile",
      subtitle: "Glisați pentru a o roti.",
    },
    stats: {
      enabled: true,
      items: [
        { value: 3, prefix: "", suffix: "", label: "obiective" },
        { value: 10, prefix: "", suffix: "x", label: "zoom hibrid" },
        { value: 24, prefix: "", suffix: "/7", label: "supraveghere" },
        { value: 66, prefix: "IP", suffix: "", label: "protecție exterior" },
      ],
    },
    setup: {
      enabled: true,
      eyebrow: "Conectare în 6 pași",
      title: "Simplu, de pe telefon",
      steps: [
        { title: "Descărcați aplicația V380 Pro", text: "Gratuită, din Google Play sau App Store.", details: "Căutați „V380 Pro” în Google Play (Android) sau App Store (iPhone).\nAplicația este gratuită.\nInstalați-o și deschideți-o.", image: "", screen: "download", showCamera: false },
        { title: "Creați un cont", text: "Alegeți țara și introduceți adresa de e-mail.", details: "Alegeți țara: Moldova.\nIntroduceți adresa de e-mail și apăsați „Înainte”.\nContul vă permite să vedeți camera de pe orice telefon.", image: "", screen: "email", showCamera: false },
        { title: "Confirmați e-mailul", text: "Introduceți codul primit pe e-mail și apăsați „Înainte”.", details: "Deschideți e-mailul primit de la aplicație.\nDacă nu îl găsiți, verificați și folderul Spam.\nIntroduceți codul în aplicație.", image: "", screen: "code", showCamera: false },
        { title: "Adăugați camera prin Bluetooth", text: "Porniți camera și apăsați „+” — telefonul o găsește.", details: "Porniți camera și așteptați să pornească complet.\nPorniți Bluetooth pe telefon.\nÎn aplicație apăsați „+” — camera apare singură în listă.", image: "", screen: "bluetooth", showCamera: true },
        { title: "Conectați camera la WiFi", text: "Alegeți rețeaua de acasă și introduceți parola.", details: "Alegeți rețeaua WiFi de acasă.\nIntroduceți parola WiFi.\nȚineți telefonul lângă cameră până apare „Conectat”.", image: "", screen: "wifi", showCamera: false },
        { title: "Imaginea live pe telefon", text: "Gata! Vedeți în timp real tot ce vede camera — cu zoom 10x.", details: "Imaginea apare imediat în aplicație.\nRotiți camera și măriți cu zoom-ul de până la 10x.\nPrimiți notificări când camera detectează mișcare.", image: "/effects/app-live.webp", screen: "none", showCamera: false },
      ],
    },
    pairing: {
      enabled: true,
      title: "Conectare ușoară și rapidă a telefonului la cameră prin Bluetooth",
      cameraImage: "",
      link: "bluetooth",
      appName: "V380 Pro",
    },
    motion: {
      reveal: true,
      parallax: true,
      galleryMorph: true,
      scanReveal: true,
      techGrid: true,
      progressBeam: true,
    },
  },
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const deepMerge = (def: unknown, val: unknown): unknown => {
  if (val === undefined) return def;
  if (Array.isArray(def)) return Array.isArray(val) ? val : def;
  if (isObj(def)) {
    if (!isObj(val)) return def;
    const out: Record<string, unknown> = { ...def };
    for (const k of Object.keys(val)) out[k] = k in def ? deepMerge(def[k], val[k]) : val[k];
    return out;
  }
  // primitives and nullable fields (e.g. box: null → object) take the saved value when types are compatible
  if (def === null || val === null || typeof def === typeof val) return val;
  return def;
};

/**
 * Combines saved content with the defaults. Objects merge field by field at
 * every level (so a field added later still gets its default); arrays are
 * replaced whole, because the admin edits lists as a unit.
 */
export const mergeContent = (saved: unknown): SiteContent =>
  deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONTENT)), isObj(saved) ? saved : {}) as SiteContent;

/** Valid packages sorted by quantity; falls back to a single camera at the unit price. */
export const getPackages = (c: SiteContent): Package[] => {
  const unit = c.product.price;
  const list = (c.product.packages ?? [])
    .filter((p) => p && p.qty >= 1)
    .map((p) => (typeof p.discount === "number" ? { ...p, price: discounted(unit * p.qty, p.discount) } : p))
    .filter((p) => p.price > 0)
    .sort((a, b) => a.qty - b.qty);
  return list.length ? list : [{ qty: 1, price: unit, label: "1 cameră", badge: "", featured: true, discount: 0 }];
};

const clampPct = (d: number) => Math.min(90, Math.max(0, d || 0));

/** Amount after a percent discount, rounded to whole lei. */
export const discounted = (amount: number, pct: number) => Math.round(amount * (1 - clampPct(pct) / 100));

/** Percent the package takes off the cameras (accessories and delivery are never discounted). */
export const orderDiscountPct = (p: Package, unitPrice: number) =>
  typeof p.discount === "number" ? clampPct(p.discount) : packageDiscount(p, unitPrice);

/** Accessories that are switched on and valid. */
export const getAddons = (c: SiteContent): Addon[] =>
  c.addons?.enabled ? (c.addons.items ?? []).filter((a) => a && a.id && a.title.trim() && a.price > 0) : [];

export interface OrderSummary {
  cameras: number; // full price of the cameras (unit × qty)
  addons: { addon: Addon; quantity: number; amount: number }[]; // chosen accessories, full price
  subtotal: number; // cameras + accessories, before discount
  discountPct: number;
  discount: number; // lei taken off — cameras only; accessories and delivery are always full price
  delivery: number; // delivery fee in lei (0 for pickup or free delivery), not discounted
  total: number; // what the client pays, delivery included
}

/** How the client gets the order: express courier to the door, or free pickup in Chișinău. */
export type DeliveryMethod = "courier" | "pickup";

/** Delivery fee for the whole order: one flat courier price, whatever the quantity. */
export const deliveryFee = (c: SiteContent, m: DeliveryMethod): number =>
  c.delivery.free || m === "pickup" ? 0 : Math.max(0, Math.round(Number(c.delivery.courierPrice) || 0));

/** Delivery line for Telegram / admin. */
export const deliveryLabel = (c: SiteContent, m: DeliveryMethod): string => {
  if (c.delivery.free) return "gratuită";
  if (m === "pickup") return c.delivery.pickupText || "Ridicare din depozit";
  const fee = deliveryFee(c, m);
  return `${c.delivery.paidText || "Curier"}${fee ? ` (+${fee} lei)` : ""}`;
};

/** Price of an order: package + chosen accessories (one per camera). The package discount applies to the cameras only. */
export const orderSummary = (
  c: SiteContent,
  p: Package,
  chosen: string[],
  method: DeliveryMethod = "courier",
): OrderSummary => {
  const unit = c.product.price;
  const pct = orderDiscountPct(p, unit);
  // packages saved with a fixed price keep it exactly
  const cameras = typeof p.discount === "number" ? unit * p.qty : p.price;
  const fullCameras = typeof p.discount === "number" ? cameras : unit * p.qty;
  const addons = getAddons(c)
    .filter((a) => chosen.includes(a.id))
    .map((a) => ({ addon: a, quantity: p.qty, amount: a.price * p.qty }));
  const addonsSum = addons.reduce((s, a) => s + a.amount, 0);
  const subtotal = fullCameras + addonsSum;
  // discount on the cameras only; accessories (and the delivery added below) are charged in full
  const goods = (typeof p.discount === "number" ? discounted(cameras, pct) : p.price) + addonsSum;
  const delivery = deliveryFee(c, method);
  return { cameras: fullCameras, addons, subtotal, discountPct: pct, discount: subtotal - goods, delivery, total: goods + delivery };
};

/** Package selected by default: the featured one, else the first. */
export const defaultPackage = (list: Package[]) => list.find((p) => p.featured) ?? list[0];

/** Discount of a package against buying the cameras one by one, in whole percent. */
export const packageDiscount = (p: Package, unitPrice: number) =>
  typeof p.discount === "number"
    ? clampPct(p.discount)
    : unitPrice > 0 && p.qty > 1
      ? Math.max(0, Math.round((1 - p.price / (unitPrice * p.qty)) * 100))
      : 0;

/** Replaces {oferte} {pret} {cadou} {accesorii} {telefon} in assistant answers with live data. */
export const fillAssistantVars = (text: string, c: SiteContent) => {
  const packs = getPackages(c);
  const unit = c.product.price;
  const offers =
    packs.length > 1
      ? "Prețuri:\n" +
        packs
          .map((p) => {
            const off = packageDiscount(p, unit);
            return `• ${p.qty === 1 ? "1 cameră" : `${p.label}${p.label.includes(String(p.qty)) ? "" : ` (${p.qty} camere)`}`} — ${p.price} lei${off ? ` (-${off}% la camere)` : ""}`;
          })
          .join("\n")
      : `Prețul este ${unit} lei.`;
  const gift = c.gift.enabled && c.gift.title ? `Cadou: ${c.gift.title} pentru fiecare cameră comandată, gratuit.` : "";
  const extras = getAddons(c);
  const addonsText = extras.length
    ? `Accesorii opționale la comandă: ${extras.map((a) => `${a.title} — ${a.price} lei`).join("; ")}.` +
      (packs.some((p) => packageDiscount(p, unit) > 0) ? " Reducerea pentru 2 sau 3 camere se aplică doar camerelor; accesoriile și livrarea au preț fix." : "")
    : "";
  return text
    .split("{oferte}").join(offers)
    .split("{pret}").join(`${unit} lei`)
    .split("{cadou}").join(gift)
    .split("{accesorii}").join(addonsText)
    .split("{telefon}").join(c.contact.phone ? formatPhone(c.contact.phone) : "")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Best FAQ entry for a free-form question (keyword overlap), or null. */
export const matchFaq = (question: string, c: SiteContent) => {
  const q = norm(question);
  let best: { a: string; score: number } | null = null;
  for (const f of c.assistant.faq) {
    const words = [...f.keywords.split(","), ...f.q.split(/\s+/)].map((w) => norm(w.trim().replace(/[?.,!]/g, ""))).filter((w) => w.length >= 3);
    const score = new Set(words.filter((w) => q.includes(w))).size;
    if (score > 0 && (!best || score > best.score)) best = { a: f.a, score };
  }
  return best ? best.a : null;
};

/** Formats a stored phone (0748517749) for display: 0748 517 749. */
export const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : p;
};

import { Component, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "./SpecsCards.css";
import HybridZoomShowcase from "@/components/effects/HybridZoomShowcase";

const SHOW_HZ_SCENE = false;
// "One lens — two zones" belongs to the previous camera model; hidden on this site.
const SHOW_DUAL_VIEW = false;
import { DualViewSpecCard } from "@/components/DualView";

// Compact technical-spec cards. Each card shows the camera render and, when it
// scrolls into view, zooms into "its" part (lens, zoom module, LEDs, PTZ head).
// Images: 2x versions of /effects/camera-cutout.webp and /effects/camera-module.webp.

// 3-head camera with floodlights: transparent cut-out made from the front product photo
const CUT = "/products/cam3-cutout.webp";
const MOD = "/effects/specs-module.webp";
const RATIO = 1400 / 1098; // width / height of the cut-out render

type Pt = [number, number];
// Measured on the cut-out render, % of its width / height: the three rotating heads (lens centres)
const P: Record<"left" | "center" | "right", Pt> = { left: [16.2, 65.8], center: [50, 83.9], right: [83.7, 65.8] };
// The three LED floodlight panels (centres), % of the cut-out
const FLOOD: Pt[] = [[16.3, 13.5], [50, 13.5], [83.7, 13.5]];
// Measured on the module close-up, % of its width / height
const LED_W: Pt[] = [[23, 50], [77, 50], [23, 62.5], [77, 62.5]];
const LED_IR: Pt[] = [[23, 35], [77, 35], [32, 82], [50, 82], [67, 82]];

interface Card {
  eb: string;
  big?: string;
  count?: boolean;
  h: string;
  p: string;
  end: { s: number; f: Pt };
  mod?: boolean;
  leds?: boolean;
  flood?: boolean;
  ptz?: boolean;
  rings?: (keyof typeof P)[];
}

const CARDS: Card[] = [
  { eb: "3 capete", big: "3", h: "Trei camere într‑un aparat", p: "Trei capete cu obiectiv — trei imagini simultan în aplicație.", end: { s: 0.86, f: [50, 52] }, rings: ["left", "center", "right"] },
  { eb: "3 proiectoare LED", big: "24/7", h: "Imagine clară și noaptea", p: "Trei proiectoare LED luminează curtea, iar infraroșul vede și în beznă totală.", end: { s: 1.05, f: [50, 34] }, flood: true },
  { eb: "Rotire PTZ", h: "O rotiți cu un deget", p: "Stânga-dreapta și sus-jos, din aplicația V380 Pro.", end: { s: 1.5, f: [50, 70] }, ptz: true },
];

const CHIPS: [string, string][] = [
  ["Aplicația V380 Pro", "M7 2.5h10v19H7zM11 18.5h2"],
  ["IP66 · montaj exterior", "M12 3l8 3v6c0 4.5-3.3 8-8 9-4.7-1-8-4.5-8-9V6zM9 12l2 2 4-4"],
];

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface Geo {
  W: number;
  H: number;
  w: number;
  h: number;
  start: { tx: number; ty: number; s: number };
  end: { tx: number; ty: number; s: number };
}

const arrow = (x: number, y: number, a: number) => {
  const L = 10, Wd = 5.5, bx = x - L * Math.cos(a), by = y - L * Math.sin(a);
  return `M${x} ${y}L${bx + Wd * Math.sin(a)} ${by - Wd * Math.cos(a)}L${bx - Wd * Math.sin(a)} ${by + Wd * Math.cos(a)}Z`;
};

const ptzPaths = (g: Geo) => {
  const e = g.end, cx = e.tx + 0.5 * g.w * e.s, cy = e.ty + 0.84 * g.h * e.s;
  const rx = 0.2 * g.w * e.s, ry = 0.045 * g.h * e.s, by = cy + 0.14 * g.h * e.s, N = 32;
  const a0 = Math.PI * 0.1, a1 = Math.PI * 0.9;
  const pt = (a: number): Pt => [cx + rx * Math.cos(Math.PI - a), by + ry * Math.sin(Math.PI - a)];
  let pan = "";
  for (let s = 0; s <= N; s++) { const [x, y] = pt(a0 + ((a1 - a0) * s) / N); pan += (s ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); }
  const [hx, hy] = pt(a1), [px, py] = pt(a1 - 0.06);
  const tr = 0.16 * g.h * e.s, tcx = cx + 0.1 * g.w * e.s, b0 = -0.85, b1 = 0.85;
  let tilt = "";
  for (let s = 0; s <= N; s++) { const q = b0 + ((b1 - b0) * s) / N; tilt += (s ? "L" : "M") + (tcx + tr * Math.cos(q)).toFixed(1) + " " + (cy + tr * Math.sin(q)).toFixed(1); }
  const qx = tcx + tr * Math.cos(b1), qy = cy + tr * Math.sin(b1);
  return { pan, panHead: arrow(hx, hy, Math.atan2(hy - py, hx - px)), tilt, tiltHead: arrow(qx, qy, Math.atan2(Math.cos(b1), -Math.sin(b1))) };
};

const SpecCard = ({ c }: { c: Card }) => {
  const cardRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [shown, setShown] = useState(false);
  const [zoomN, setZoomN] = useState(1);

  // measure the image window (and re-measure on resize)
  useLayoutEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    const measure = () => {
      const W = v.clientWidth, H = v.clientHeight;
      if (!W || !H) return;
      const h = Math.min(H * 0.9, (W * 0.9) / RATIO), w = h * RATIO;
      const at = (s: number, f: Pt) => ({ tx: W / 2 - (f[0] / 100) * w * s, ty: H / 2 - (f[1] / 100) * h * s, s });
      setGeo({ W, H, w, h, start: at(1, [50, 50]), end: at(c.end.s, c.end.f) });
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(v);
    return () => ro.disconnect();
  }, [c]);

  // reveal once, when the card is mostly on screen
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (prefersReduced() || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }),
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 1× → 10× counter for the zoom card
  useEffect(() => {
    if (!shown || !c.count) return;
    if (prefersReduced()) { setZoomN(10); return; }
    let raf = 0;
    const t0 = performance.now() + 350, dur = 1000;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur));
      setZoomN(Math.round(1 + 9 * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, c.count]);

  const t = geo ? (shown ? geo.end : geo.start) : null;
  const ptz = geo && c.ptz ? ptzPaths(geo) : null;

  return (
    <article ref={cardRef} className={"lxs-block" + (shown ? " is-in" : "")}>
      <div ref={viewRef} className="lxs-view">
        <div className="lxs-halo" aria-hidden="true" />
        <div
          className="lxs-layer"
          style={geo && t ? { width: geo.w, height: geo.h, transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.s})` } : { opacity: 0 }}
        >
          <img src={CUT} alt="" decoding="async" draggable={false} />
          {c.flood && FLOOD.map(([x, y], i) => <i key={"f" + i} className="lxs-flood" style={{ left: x + "%", top: y + "%", transitionDelay: `${0.85 + i * 0.18}s` }} />)}
          {c.mod && (
            <div className="lxs-mod">
              <img src={MOD} alt="" decoding="async" draggable={false} />
              {c.leds && LED_W.map(([x, y], i) => <i key={"w" + i} className="lxs-led w" style={{ left: x + "%", top: y + "%" }} />)}
              {c.leds && LED_IR.map(([x, y], i) => <i key={"r" + i} className="lxs-led ir" style={{ left: x + "%", top: y + "%" }} />)}
            </div>
          )}
        </div>
        {ptz && geo && (
          <svg className="lxs-ptz" viewBox={`0 0 ${geo.W} ${geo.H}`} aria-hidden="true">
            <path pathLength={1} d={ptz.pan} />
            <path className="head" d={ptz.panHead} />
            <path pathLength={1} d={ptz.tilt} />
            <path className="head" d={ptz.tiltHead} />
          </svg>
        )}
        {geo &&
          (c.rings || []).map((k, j) => (
            <i
              key={k}
              className="lxs-ring"
              style={{
                left: geo.end.tx + (P[k][0] / 100) * geo.w * geo.end.s,
                top: geo.end.ty + (P[k][1] / 100) * geo.h * geo.end.s,
                transitionDelay: `${0.75 + j * 0.15}s`,
              }}
            />
          ))}
        {shown && !prefersReduced() && <div className="lxs-sheen module-sheen" aria-hidden="true" />}
      </div>
      <div className="lxs-txt">
        <div className="lxs-eyebrow">{c.eb}</div>
        {c.big && <span className="lxs-big">{c.count ? `${zoomN}×` : c.big}</span>}
        <h3>{c.h}</h3>
        <p>{c.p}</p>
      </div>
    </article>
  );
};

// Auto-tracking: a person walks along the road, the rotating head (only the head — the top lens is fixed)
// turns after them in 3D, its view cone stays on them, the pan angle is read out live.
const CAM_TOP = "/effects/library/camera-front-top.webp";
const CAM_HEAD = "/effects/library/camera-front-head.webp";

const TrackCard = () => {
  const ref = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLImageElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const manRef = useRef<HTMLDivElement>(null);
  const coneRef = useRef<SVGPathElement>(null);
  const spotRef = useRef<SVGEllipseElement>(null);
  const angRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); setOnScreen(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { setOnScreen(e.isIntersecting); if (e.isIntersecting) setShown(true); }),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // scene units 500 × 400. Lens origin (250, 166); the person walks along the road at y 330 (feet).
  const OX = 250, OY = 166, FY = 352, AMP = 190;
  useEffect(() => {
    const draw = (t: number) => {
      const ph = (t / 9) * Math.PI * 2;
      const x = OX + AMP * Math.sin(ph);
      const dir = Math.cos(ph) >= 0 ? 1 : -1;            // walking right or left
      const ang = (Math.atan2(x - OX, FY - OY) * 180) / Math.PI;
      // the head turns: 3D rotation + its front swings towards the target + the far side darkens
      const a = ang * 0.95, shift = Math.sin((a * Math.PI) / 180) * 9;
      const tf = `translateX(${shift.toFixed(2)}%) rotateY(${a.toFixed(2)}deg)`;
      if (headRef.current) headRef.current.style.transform = tf;
      if (shadeRef.current) {
        shadeRef.current.style.transform = tf;
        shadeRef.current.style.opacity = String(Math.min(0.75, Math.abs(a) / 55));
        shadeRef.current.style.background = `linear-gradient(${a >= 0 ? 90 : 270}deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 45%)`;
      }
      if (manRef.current) {
        manRef.current.style.left = `${(x / 5).toFixed(2)}%`;
        manRef.current.style.setProperty("--dir", String(dir));
      }
      if (coneRef.current) {
        const w = 34;
        coneRef.current.setAttribute("d", `M${OX - 6} ${OY} L${(x - w).toFixed(1)} ${FY + 4} Q ${x.toFixed(1)} ${FY + 16} ${(x + w).toFixed(1)} ${FY + 4} L${OX + 6} ${OY} Z`);
      }
      if (spotRef.current) spotRef.current.setAttribute("cx", x.toFixed(1));
      if (angRef.current) angRef.current.textContent = `${ang >= 0 ? "+" : "−"}${Math.abs(Math.round(ang))}°`;
    };
    if (prefersReduced()) { draw(1.6); return; }
    if (!shown || !onScreen) { draw(0); return; }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [shown, onScreen]);

  return (
    <article ref={ref} className={"lxs-block lxs-tr" + (shown ? " is-in" : "")}>
      <div className="lxs-view lxs-tr-view">
        <div className="lxs-halo" aria-hidden="true" />
        <svg className="lxs-tr-svg" viewBox="0 0 500 400" aria-hidden="true">
          <defs>
            <linearGradient id="lxs-tr-road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1b2233" stopOpacity="0" />
              <stop offset="0.25" stopColor="#1b2233" />
              <stop offset="1" stopColor="#0d121d" />
            </linearGradient>
            <linearGradient id="lxs-tr-cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#67e8f9" stopOpacity="0.55" />
              <stop offset="1" stopColor="#67e8f9" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* road in perspective */}
          <path d="M-20 272 L520 272 L520 380 L-20 380 Z" fill="url(#lxs-tr-road)" />
          <path d="M-20 272 L520 272 M-20 380 L520 380" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
          <path className="lxs-tr-dash" d="M-20 326 L520 326" stroke="rgba(251,191,36,0.6)" strokeWidth="3" strokeDasharray="16 14" />
          {/* view cone from the rotating head + footprint on the road */}
          <path ref={coneRef} className="lxs-tr-cone" d="" />
          <ellipse ref={spotRef} className="lxs-tr-spot" cx={OX} cy={FY + 4} rx="40" ry="10" />
        </svg>

        <div className="lxs-tr-cam">
          <img className="top" src={CAM_TOP} alt="" decoding="async" draggable={false} />
          <img ref={headRef} className="head" src={CAM_HEAD} alt="" decoding="async" draggable={false} />
          <div
            ref={shadeRef}
            className="shade"
            style={{
              WebkitMask: `url(${CAM_HEAD}) center / 100% 100% no-repeat`,
              mask: `url(${CAM_HEAD}) center / 100% 100% no-repeat`,
            }}
          />
        </div>

        <div ref={manRef} className="lxs-tr-man" aria-hidden="true">
          <Walker walking={shown && onScreen} />
          <span className="lxs-tr-box"><b>Persoană</b></span>
        </div>

        <span className="lxs-tr-read" aria-hidden="true"><i />PAN <b ref={angRef}>0°</b></span>
      </div>
      <div className="lxs-txt">
        <div className="lxs-eyebrow">Urmărire automată</div>
        <h3>Camera îl urmărește singură</h3>
        <p>Când apare o persoană, capul rotativ se întoarce după ea și o ține în cadru. Obiectivul fix de sus vede în continuare toată zona.</p>
      </div>
    </article>
  );
};

// Bluetooth quick pairing: camera on the left, phone on the right, link in the middle.
const BT_STEPS = ["Căutare cameră…", "Cameră găsită", "Conectare prin Bluetooth…", "Conectat"];

const BtCard = () => {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced() || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }),
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shown) return;
    if (prefersReduced()) { setStep(3); return; }
    const t = [900, 1500, 2300].map((ms, i) => window.setTimeout(() => setStep(i + 1), ms));
    return () => t.forEach((x) => window.clearTimeout(x));
  }, [shown]);

  const done = step >= 3;
  return (
    <article ref={ref} className={"lxs-block lxs-bt" + (shown ? " is-in" : "") + (done ? " is-done" : "")}>
      <div className="lxs-view lxs-bt-view">
        <div className="lxs-halo" aria-hidden="true" />
        <img className="lxs-bt-cam" src={CUT} alt="" decoding="async" draggable={false} />
        <div className="lxs-bt-link" aria-hidden="true">
          <span className="lxs-bt-line l" />
          <span className="lxs-bt-line r" />
          <span className="lxs-bt-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 7l10 10-5 4V3l5 4L7 17" />
            </svg>
          </span>
        </div>
        <div className="lxs-bt-phone" aria-hidden="true">
          <div className="lxs-bt-screen">
            <span className="lxs-bt-notch" />
            <span className="lxs-bt-app">V380 Pro</span>
            <span className={"lxs-bt-badge" + (done ? " ok" : "")}>
              {done ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 7l10 10-5 4V3l5 4L7 17" /></svg>
              )}
            </span>
            <span key={step} className="lxs-bt-status">{BT_STEPS[step]}</span>
            <span className="lxs-bt-bar"><i style={{ width: `${(step / 3) * 100}%` }} /></span>
          </div>
        </div>
      </div>
      <div className="lxs-txt">
        <div className="lxs-eyebrow">Bluetooth</div>
        <h3>Conectare rapidă la telefon</h3>
        <p>Telefonul găsește camera prin Bluetooth și o conectează în câteva secunde, din aplicația V380 Pro.</p>
      </div>
    </article>
  );
};

// Motion alert: a person walks in front of the camera, it detects them and the phone gets a V380 Pro push.
const WALKER = "/effects/library/person-walk.webp";
// Real walking person (cut-out photo, faces right). A light step bob keeps the static stride from "gliding".
const Walker = ({ walking }: { walking: boolean }) => (
  <span className={"lxs-walk" + (walking ? " is-walking" : "")} aria-hidden="true">
    <img src={WALKER} alt="" decoding="async" draggable={false} />
  </span>
);

const NotifyCard = () => {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [stage, setStage] = useState(0); // 1 walking, 2 detected, 3 notified, 4 standing
  const [clock, setClock] = useState({ time: "", date: "" });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced() || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }),
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shown) return;
    const now = new Date();
    let date = "";
    try {
      date = now.toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });
      date = date.charAt(0).toUpperCase() + date.slice(1);
    } catch { /* old browsers: no date line */ }
    setClock({ time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, date });
    if (prefersReduced()) { setStage(4); return; }
    const t = [[150, 1], [1350, 2], [2000, 3], [2100, 4]].map(([ms, st]) => window.setTimeout(() => setStage((x) => Math.max(x, st)), ms));
    return () => t.forEach((x) => window.clearTimeout(x));
  }, [shown]);

  const cls = ["lxs-block", "lxs-nt"];
  if (shown) cls.push("is-in");
  if (stage >= 1) cls.push("s-walk");
  if (stage >= 2) cls.push("s-det");
  if (stage >= 3) cls.push("s-push");
  return (
    <article ref={ref} className={cls.join(" ")}>
      <div className="lxs-view lxs-nt-view">
        <div className="lxs-halo" aria-hidden="true" />
        <img className="lxs-nt-cam" src={CUT} alt="" decoding="async" draggable={false} />
        <span className="lxs-nt-pulse" aria-hidden="true"><i /><i /></span>
        <span className="lxs-nt-line" aria-hidden="true" />

        <div className="lxs-nt-person" aria-hidden="true">
          <span className="lxs-nt-floor" />
          <Walker walking={stage >= 1 && stage < 4} />
          <span className="lxs-nt-box"><b>Persoană</b></span>
        </div>

        <div className="lxs-nt-phone" aria-hidden="true">
          <div className="lxs-nt-screen">
            <span className="lxs-bt-notch" />
            <span className="lxs-nt-time">{clock.time}</span>
            <span className="lxs-nt-date">{clock.date}</span>
          </div>
        </div>

        <div className="lxs-nt-push" role="img" aria-label="Notificare V380 Pro: Mișcare detectată, persoană în fața camerei">
          <span className="lxs-nt-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
          </span>
          <span className="lxs-nt-msg">
            <span className="lxs-nt-head"><b>V380 Pro</b><em>acum</em></span>
            <strong>Mișcare detectată</strong>
            <span>Persoană în fața camerei</span>
          </span>
          <span className="lxs-nt-thumb">
            <svg viewBox="0 0 40 96" aria-hidden="true"><circle cx="20" cy="9" r="7.5" /><path d="M10 23 Q20 18 30 23 L28.5 52 Q20 55 11.5 52 Z" /><rect x="13" y="50" width="6.5" height="43" rx="3.2" /><rect x="20.5" y="50" width="6.5" height="43" rx="3.2" /></svg>
            <i />
          </span>
        </div>
      </div>
      <div className="lxs-txt">
        <div className="lxs-eyebrow">Notificări instant</div>
        <h3>Aflați primul, oriunde ați fi</h3>
        <p>Când camera detectează o persoană, primiți imediat pe telefon o notificare de la aplicația V380 Pro.</p>
      </div>
    </article>
  );
};

// Two ways to connect: WiFi from the router's antennas to the camera's, and a LAN cable into the camera's RJ45.
const CAM_FRONT = "/effects/library/camera-front.webp";
const LAN_PLUG = "/effects/library/camera-lan-connector.webp";

const LanCard = () => {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced() || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }),
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // scene units: 500 × 400 (the view is 5 : 4). Camera box: x 290–465, y 24–328.
  const cable = "M200 300 C 250 300, 250 372, 300 372 L 345 372 C 370 372, 377 360, 377 332";
  const wifi = "M128 160 C 170 70, 240 40, 292 34";
  return (
    <article ref={ref} className={"lxs-block lxs-lan" + (shown ? " is-in" : "")}>
      <div className="lxs-view lxs-lan-view">
        <div className="lxs-halo" aria-hidden="true" />
        <svg className="lxs-lan-svg" viewBox="0 0 500 400" aria-hidden="true">
          <defs>
            <linearGradient id="lxs-rt-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3f4652" />
              <stop offset="0.5" stopColor="#1c2029" />
              <stop offset="1" stopColor="#0b0d12" />
            </linearGradient>
            <linearGradient id="lxs-rt-ant" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#111318" />
              <stop offset="0.5" stopColor="#3a404b" />
              <stop offset="1" stopColor="#111318" />
            </linearGradient>
          </defs>

          {/* WiFi: waves from the router, signal travelling to the camera's left antenna */}
          <g className="lxs-lan-waves">
            {[0, 1, 2].map((k) => (
              <path key={k} className={"w w" + k} d="M106 150 A 26 26 0 0 1 146 138" />
            ))}
          </g>
          <path className="lxs-lan-air" d={wifi} />
          <g className="lxs-lan-rx">
            <path d="M284 22 A 14 14 0 0 1 302 14" />
            <path d="M278 14 A 24 24 0 0 1 308 2" />
          </g>

          {/* LAN cable: router → floor → camera */}
          <path className="lxs-lan-cable" d={cable} pathLength={1} />
          <path className="lxs-lan-pkt" d={cable} pathLength={1} />

          {/* router */}
          <g className="lxs-rt">
            <ellipse cx="120" cy="324" rx="92" ry="7" fill="rgba(0,0,0,0.45)" />
            <rect x="66" y="176" width="8" height="96" rx="4" fill="url(#lxs-rt-ant)" transform="rotate(-10 70 270)" />
            <rect x="116" y="168" width="8" height="104" rx="4" fill="url(#lxs-rt-ant)" />
            <rect x="166" y="176" width="8" height="96" rx="4" fill="url(#lxs-rt-ant)" transform="rotate(10 170 270)" />
            <rect x="38" y="262" width="164" height="56" rx="14" fill="url(#lxs-rt-body)" stroke="rgba(255,255,255,0.14)" />
            <rect x="46" y="266" width="148" height="3" rx="1.5" fill="rgba(255,255,255,0.18)" />
            {[70, 92, 114, 136].map((x, i) => (
              <circle key={x} className={"led l" + i} cx={x} cy="298" r="3.2" />
            ))}
            <rect x="158" y="292" width="26" height="12" rx="3" fill="#07080b" stroke="rgba(255,255,255,0.12)" />
          </g>
        </svg>

        <img className="lxs-lan-cam" src={CAM_FRONT} alt="" decoding="async" draggable={false} />

        <span className="lxs-lan-chip c1"><i>1</i>WiFi</span>
        <span className="lxs-lan-chip c2"><i>2</i>Cablu LAN</span>
        <span className="lxs-lan-plug"><img src={LAN_PLUG} alt="" decoding="async" draggable={false} /></span>
      </div>
      <div className="lxs-txt">
        <div className="lxs-eyebrow">WiFi + cablu LAN</div>
        <h3>Două moduri de conectare</h3>
        <p>Fără fir, prin WiFi de la router, sau prin cablu LAN direct în portul camerei, când WiFi-ul nu ajunge până la ea.</p>
      </div>
    </article>
  );
};

// Two-way audio: a person talks into the phone, the camera plays the voice through its side speaker.
const SPK = "/effects/library/camera-speaker-grille.webp";
const PERSON = "/effects/library/person-voice.webp";

const AudioCard = () => {
  const ref = useRef<HTMLElement>(null);
  const waveRefs = useRef<(SVGPathElement | null)[]>([]);
  const barRefs = useRef<(SVGRectElement | null)[]>([]);
  const [shown, setShown] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [secs, setSecs] = useState(0);

  // reveal once; keep tracking visibility so the live animation pauses off screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); setOnScreen(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { setOnScreen(e.isIntersecting); if (e.isIntersecting) setShown(true); }),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // call timer
  useEffect(() => {
    if (!shown || !onScreen) return;
    const t = window.setInterval(() => setSecs((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, [shown, onScreen]);

  // scene units 500 × 400. Phone tip ≈ (190, 222); camera x 300–447, rotating head centre ≈ y 216
  const X0 = 196, X1 = 300, CY = 220, N = 44;
  const BAR_X = 455, BAR_H = [12, 20, 30, 42, 56];
  // speech-like loudness: syllables (fast) inside phrases (slow), with short pauses
  const speech = (t: number) => {
    const phrase = Math.max(0, Math.sin(t * 0.9) * 0.6 + 0.55);
    const syl = 0.5 + 0.5 * Math.abs(Math.sin(t * 6.3) * Math.sin(t * 2.7 + 1.3));
    return Math.min(1, Math.max(0.08, phrase * syl * 1.25));
  };

  useEffect(() => {
    if (!shown) return;
    const draw = (t: number) => {
      const layers = [
        { k: 0.16, sp: 7.5, a: 1, off: 0 },
        { k: 0.23, sp: -5.2, a: 0.6, off: 1.7 },
        { k: 0.11, sp: 4.1, a: 0.45, off: 3.1 },
      ];
      layers.forEach((L, li) => {
        const el = waveRefs.current[li];
        if (!el) return;
        let d = "";
        for (let i = 0; i <= N; i++) {
          const u = i / N, x = X0 + (X1 - X0) * u;
          const env = Math.pow(Math.sin(Math.PI * u), 1.3);
          const amp = 21 * L.a * env * speech(t - u * 0.35);
          const y = CY + amp * Math.sin(x * L.k - t * L.sp + L.off);
          d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        }
        el.setAttribute("d", d);
      });
      barRefs.current.forEach((el, i) => {
        if (!el) return;
        const h = BAR_H[i] * (0.3 + 0.7 * speech(t - 0.4 - i * 0.06));
        el.setAttribute("y", (216 - h / 2).toFixed(1));
        el.setAttribute("height", h.toFixed(1));
      });
    };
    if (prefersReduced()) { draw(1.2); return; }
    if (!onScreen) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => { draw((now - t0) / 1000 + 0.6); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [shown, onScreen]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
  return (
    <article ref={ref} className={"lxs-block lxs-au" + (shown ? " is-in" : "")}>
      <div className="lxs-view lxs-au-view">
        <div className="lxs-halo" aria-hidden="true" />
        <img className="lxs-au-person" src={PERSON} alt="" decoding="async" draggable={false} />
        <img className="lxs-au-cam" src={CAM_FRONT} alt="" decoding="async" draggable={false} />
        <svg className="lxs-au-svg" viewBox="0 0 500 400" aria-hidden="true">
          <defs>
            <linearGradient id="lxs-au-wave" gradientUnits="userSpaceOnUse" x1={X0} y1="0" x2={X1} y2="0">
              <stop offset="0" stopColor="#67e8f9" stopOpacity="0" />
              <stop offset="0.25" stopColor="#67e8f9" />
              <stop offset="0.6" stopColor="#ffffff" />
              <stop offset="1" stopColor="#38bdf8" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="lxs-au-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <g className="lxs-au-wave">
            {[0, 1, 2].map((k) => (
              <path key={k} className={"w w" + k} ref={(el) => { waveRefs.current[k] = el; }} d={`M${X0} ${CY}L${X1} ${CY}`} />
            ))}
          </g>
          <g className="lxs-au-bars">
            {BAR_H.map((h, i) => (
              <rect key={i} ref={(el) => { barRefs.current[i] = el; }} x={BAR_X + i * 8} y={216 - h / 2} width="4" height={h} rx="2" />
            ))}
          </g>
        </svg>
        <span className="lxs-au-live" aria-hidden="true"><i />Apel live <b>{mm}:{ss}</b></span>
        <span className="lxs-au-spk"><img src={SPK} alt="" decoding="async" draggable={false} /></span>
      </div>
      <div className="lxs-txt">
        <div className="lxs-eyebrow">Microfon + difuzor</div>
        <h3>Vorbiți prin cameră</h3>
        <p>Vorbiți în telefon, iar camera redă vocea prin difuzorul ei. Microfonul camerei vă lasă să auziți răspunsul.</p>
      </div>
    </article>
  );
};

// start downloading both images as soon as the page script runs (the section sits right under the hero)
if (typeof window !== "undefined") {
  [CUT, MOD].forEach((src) => {
    const im = new Image();
    im.decoding = "async";
    im.src = src;
  });
}

export const SpecsCards = () => (
  <section className="lxs" aria-labelledby="lxs-title">
    <div className="lxs-head">
      <h2 id="lxs-title">
        Specificații <span>Tehnice</span>
      </h2>
      <i aria-hidden="true" />
    </div>
    <div className="lxs-list">
      {CARDS.slice(0, 1).map((c) => <SpecCard key={c.eb} c={c} />)}
      {/* "Obiectiv panoramic" → Dual View: one top lens, two zones on the phone */}
      {SHOW_DUAL_VIEW && <DualViewSpecCard />}
      {/* 10x zoom scene (camera module + phone, parking → 10x): hidden on request, kept in code.
          Set SHOW_HZ_SCENE = true to bring it back. */}
      {SHOW_HZ_SCENE && (
        <div className="lxs-hz">
          <HybridZoomShowcase />
        </div>
      )}
      {CARDS.slice(1).map((c) => <SpecCard key={c.eb} c={c} />)}
      <TrackCard />
      <BtCard />
      <NotifyCard />
      <AudioCard />
      <LanCard />
    </div>
    <div className="lxs-chips">
      {CHIPS.map(([label, d]) => (
        <span key={label} className="lxs-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={d} />
          </svg>
          {label}
        </span>
      ))}
    </div>
  </section>
);

/** If anything in the section ever throws, hide it instead of breaking the whole page. */
export class SafeSection extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn("[SpecsCards] hidden after error:", err); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default SpecsCards;

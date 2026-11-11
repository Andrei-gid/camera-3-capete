import { useEffect, useRef, useState } from "react";
import HeadCyl from "@/components/HeadCyl";
import "./ThreeHeads.css";

// "3 capete motorizate": ordinary camera (top fixed, only the lower head turns) vs our camera (all three
// heads turn 180°). Each camera has its own phone; every window shows a 60° slice of a 240° yard strip,
// so the picture turns exactly as much as its head. Heads are 3D cylinders (HeadCyl), one rAF loop,
// paused while the block is off screen.

const OLD_TOP = "/products/old-top.webp";
const OLD_HEAD = "/products/old-head.webp";
const BODY = "/products/cam3-body3.webp";
const VIEW = "/products/yard-240.webp";
const HEADS = [
  { k: "l", src: "/products/cam3-h-l.webp", box: [0, 54.5, 31.79, 27.78] },
  { k: "c", src: "/products/cam3-h-c.webp", box: [32.14, 61.11, 34.71, 38.98] },
  { k: "r", src: "/products/cam3-h-r.webp", box: [68.2, 54.5, 31.86, 27.78] },
] as const;
const AMP = 90; // every head turns −90° … +90°

const LOOP = 14.2;
const PHASES: [number, number][] = [[0.2, 3.4], [3.4, 6.6], [6.6, 9.8], [10.0, 14.0]]; // Cap 1, 2, 3, all
const OLD_PERIOD = 7.1;

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * x));
// PTZ motor profile, u ∈ [0,1]: centre → full left, stop, sweep to full right, stop, back to centre
const motorU = (u: number) => {
  if (u < 0.2) return -ease(u / 0.2);
  if (u < 0.3) return -1;
  if (u < 0.72) return -1 + 2 * ease((u - 0.3) / 0.42);
  if (u < 0.82) return 1;
  return 1 - ease((u - 0.82) / 0.18);
};
const swing = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : motorU((t - a) / (b - a)));

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const fmt = (v: number) => `${v > 0.5 ? "+" : v < -0.5 ? "−" : ""}${Math.abs(Math.round(v))}°`;

type Win = { el: HTMLDivElement | null; deg: HTMLElement | null; last: number };
const paintWin = (w: Win, v: number) => {
  const speed = Math.abs(v - w.last);
  w.last = v;
  if (w.el) {
    w.el.style.backgroundPosition = `${(((v + 90) / 180) * 100).toFixed(2)}% 55%`;
    w.el.style.filter = speed > 0.6 ? `blur(${Math.min(1.4, speed * 0.35).toFixed(2)}px)` : "none";
  }
  if (w.deg) w.deg.textContent = fmt(v);
};

const ThreeHeadsShowcase = () => {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [phase, setPhase] = useState(-1);
  const phaseRef = useRef(-1);

  const set = useRef<((deg: number) => void)[]>([]); // 0..2 our heads, 3 old head
  const binders = useRef([0, 1, 2, 3].map((i) => (fn: (deg: number) => void) => { set.current[i] = fn; }));
  const wins = useRef<Win[]>([0, 1, 2, 3].map(() => ({ el: null, deg: null, last: 0 }))); // 0..2 ours, 3 old lower
  const rigs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const adMode = new URLSearchParams(window.location.search).has("ad"); // ad-recording mode: always on
    if (adMode || typeof IntersectionObserver === "undefined") { setShown(true); setOnScreen(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { setOnScreen(e.isIntersecting); if (e.isIntersecting) setShown(true); }),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const draw = (time: number) => {
      const t = time % LOOP;
      // ordinary camera: only its lower head turns, all the time
      const ov = motorU(((time % OLD_PERIOD) + OLD_PERIOD) % OLD_PERIOD / OLD_PERIOD) * AMP;
      set.current[3]?.(ov);
      paintWin(wins.current[3], ov);

      // our camera: one head per phase, then all three together
      const all = swing(t, PHASES[3][0], PHASES[3][1]);
      HEADS.forEach((_, i) => {
        const v = (swing(t, PHASES[i][0], PHASES[i][1]) + all * (i === 0 ? -1 : 1)) * AMP;
        set.current[i]?.(v);
        paintWin(wins.current[i], v);
      });

      // gentle 3D sway of both camera rigs
      rigs.current.forEach((r, i) => {
        if (!r) return;
        const y = Math.sin(time * 0.5 + i * 1.7) * 6, x = 4 + Math.sin(time * 0.4 + i) * 1.5;
        r.style.transform = `rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
      });

      let p = -1;
      PHASES.forEach(([a, b], i) => { if (t >= a && t < b) p = i; });
      if (p !== phaseRef.current) { phaseRef.current = p; setPhase(p); }
    };
    if (prefersReduced()) { draw(11.6); return; }
    if (!shown || !onScreen) { draw(0); return; }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [shown, onScreen]);

  const on = (i: number) => phase === i || phase === 3;
  const winRef = (i: number) => (el: HTMLDivElement | null) => { wins.current[i].el = el; };
  const degRef = (i: number) => (el: HTMLElement | null) => { wins.current[i].deg = el; };

  return (
    <section ref={ref} className={"th3" + (shown ? " is-in" : "")} aria-labelledby="th3-title">
      <div className="th3-head">
        <span className="th3-eyebrow">3 capete motorizate</span>
        <h2 id="th3-title">
          Le rotiți pe <span>toate trei</span> din telefon
        </h2>
        <p>
          La o cameră obișnuită se rotește doar partea de jos, iar cea de sus stă pe loc. La camera noastră fiecare dintre
          cele 3 capete se rotește separat, din aplicația V380 Pro.
        </p>
      </div>

      <div className="th3-stage">
        {/* ---------- ordinary camera ---------- */}
        <div className="th3-panel th3-old">
          <div className="th3-tag bad">Cameră obișnuită</div>
          <div className="th3-row">
            <div className="th3-space">
              <div className="th3-floor" />
              <div className="th3-rig" ref={(el) => { rigs.current[0] = el; }}>
                <div className="th3-cam th3-cam-old">
                  <img className="th3-top" src={OLD_TOP} alt="Cameră obișnuită: partea de sus este fixă" decoding="async" draggable={false} />
                  <span className="th3-lock" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" /></svg>
                    Fixă
                  </span>
                  <div className="th3-hd on" style={{ left: "0%", top: "65.5%", width: "100%", height: "34.5%" }}>
                    <HeadCyl front="/products/old-head-front-op.webp" back="/products/old-head-back-op.webp" mask={OLD_HEAD} bind={binders.current[3]} />
                  </div>
                </div>
              </div>
            </div>
            <div className="th3-phone th3-phone-old">
              <div className="th3-notch" />
              <div className="th3-app">V380 Pro</div>
              <div className="th3-win is-static" style={{ backgroundImage: `url(${VIEW})` }}>
                <span className="th3-win-l">Sus · fix</span>
                <span className="th3-pin" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" /></svg>
                </span>
              </div>
              <div className="th3-win on" ref={winRef(3)} style={{ backgroundImage: `url(${VIEW})` }}>
                <span className="th3-win-l">Jos · <em ref={degRef(3)}>0°</em></span>
              </div>
              <div className="th3-dead">Zone moarte stânga și dreapta</div>
            </div>
          </div>
          <div className="th3-verdict bad">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" /><path d="M8 8l8 8M16 8l-8 8" /></svg>
            <div><b>Multe zone moarte</b><small>1 cap rotativ — partea de sus nu se rotește</small></div>
          </div>
        </div>

        {/* ---------- our camera ---------- */}
        <div className="th3-panel th3-new">
          <div className="th3-tag good">Camera noastră</div>
          <div className="th3-row">
            <div className="th3-space">
              <div className="th3-floor" />
              <div className="th3-rig" ref={(el) => { rigs.current[1] = el; }}>
                <div className="th3-cam th3-cam-new">
                  {HEADS.map((h, i) => (
                    <div key={h.k} className={"th3-hd" + (on(i) ? " on" : "")}
                      style={{ left: h.box[0] + "%", top: h.box[1] + "%", width: h.box[2] + "%", height: h.box[3] + "%" }}>
                      <HeadCyl front={h.src.replace(".webp", "-front-op.webp")} back={h.src.replace(".webp", "-back-op.webp")} mask={h.src} bind={binders.current[i]} />
                      <span className="th3-num">{i + 1}</span>
                    </div>
                  ))}
                  <img className="th3-body" src={BODY} alt="Camera cu 3 capete rotative și 3 proiectoare LED" decoding="async" draggable={false} />
                </div>
              </div>
            </div>
            <div className="th3-phone">
              <div className="th3-notch" />
              <div className="th3-app">V380 Pro</div>
              {[0, 1, 2].map((i) => (
                <div key={i} className={"th3-win" + (on(i) ? " on" : "")} ref={winRef(i)} style={{ backgroundImage: `url(${VIEW})` }}>
                  <span className="th3-win-l">Cap {i + 1} · <em ref={degRef(i)}>0°</em></span>
                </div>
              ))}
              <div className={"th3-all" + (phase === 3 ? " on" : "")}>Toate 3 — din telefon</div>
            </div>
          </div>
          <div className="th3-verdict good">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" /><path d="M7 12.5l3.2 3.2L17 9" /></svg>
            <div><b>Fără zone moarte</b><small>3 capete rotative — vede mult mai mult</small></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThreeHeadsShowcase;

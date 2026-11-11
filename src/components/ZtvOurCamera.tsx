import { useEffect, useRef, useState } from "react";
import HeadCyl from "@/components/HeadCyl";

// Lower half of the "Vezi diferența" video, drawn live on top of it:
// our 3-head camera — each head turns in turn, and its own window on the screen changes view.
const BODY = "/products/cam3-body3.webp";
// every head turns 180° (−90° … +90°) like the real camera
const HEADS = [
  { src: "/products/cam3-h-l.webp", back: "/products/cam3-h-l-back.webp", box: [0, 54.5, 31.79, 27.78], amp: 90 },
  { src: "/products/cam3-h-c.webp", back: "/products/cam3-h-c-back.webp", box: [32.14, 61.11, 34.71, 38.98], amp: 90 },
  { src: "/products/cam3-h-r.webp", back: "/products/cam3-h-r-back.webp", box: [68.2, 54.5, 31.86, 27.78], amp: 90 },
] as const;
// 240° strip of the yard: the window shows 60° of it (background 400% wide), so when the head turns
// −90° … +90° the picture turns exactly the same angle — the view is never just stretched.
const VIEW = "/products/yard-240.webp";
const LOOP = 14.2;
const PH: [number, number][] = [[0.2, 3.4], [3.4, 6.6], [6.6, 9.8], [10.0, 14.0]];

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * x));
// PTZ motor profile inside [a, b]: 0 → full left, short stop, sweep to full right, short stop, back to 0
const swing = (t: number, a: number, b: number) => {
  if (t <= a || t >= b) return 0;
  const u = (t - a) / (b - a);
  if (u < 0.2) return -ease(u / 0.2);
  if (u < 0.3) return -1;
  if (u < 0.72) return -1 + 2 * ease((u - 0.3) / 0.42);
  if (u < 0.82) return 1;
  return 1 - ease((u - 0.82) / 0.18);
};

const ZtvOurCamera = ({ active }: { active: boolean }) => {
  const setters = useRef<((deg: number) => void)[]>([]);
  const binders = useRef(HEADS.map((_, i) => (fn: (deg: number) => void) => { setters.current[i] = fn; }));
  const wins = useRef<(HTMLDivElement | null)[]>([]);
  const degs = useRef<(HTMLElement | null)[]>([]);
  const last = useRef<number[]>([0, 0, 0]);
  const [phase, setPhase] = useState(-1);
  const pRef = useRef(-1);

  useEffect(() => {
    const draw = (time: number) => {
      const t = time % LOOP;
      const all = swing(t, PH[3][0], PH[3][1]);
      HEADS.forEach((h, i) => {
        const v = (swing(t, PH[i][0], PH[i][1]) + all * (i === 0 ? -1 : 1)) * h.amp;
        setters.current[i]?.(v);
        // the window shows what the head looks at: full left → full right of the yard, slight motion blur
        const speed = Math.abs(v - last.current[i]);
        last.current[i] = v;
        const w = wins.current[i];
        if (w) {
          w.style.backgroundPosition = `${(((v + 90) / 180) * 100).toFixed(2)}% 55%`;
          w.style.filter = speed > 0.6 ? `blur(${Math.min(1.4, speed * 0.35).toFixed(2)}px)` : "none";
        }
        const d = degs.current[i];
        if (d) d.textContent = `${v > 0.5 ? "+" : v < -0.5 ? "−" : ""}${Math.abs(Math.round(v))}°`;
      });
      let p = -1;
      PH.forEach(([a, b], i) => { if (t >= a && t < b) p = i; });
      if (p !== pRef.current) { pRef.current = p; setPhase(p); }
    };
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !active) { draw(reduced ? 7.2 : 0); return; }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const on = (i: number) => phase === i || phase === 3;

  return (
    <div className="ztv-our" aria-label="Camera noastră: 3 capete rotative, 3 imagini în aplicație">
      <div className="ztv-our-cam">
        <div className="ztv-our-rig">
          {HEADS.map((h, i) => (
            <div key={i} className={"ztv-our-hd" + (on(i) ? " on" : "")}
              style={{ left: h.box[0] + "%", top: h.box[1] + "%", width: h.box[2] + "%", height: h.box[3] + "%" }}>
              <HeadCyl front={h.src.replace(".webp", "-front-op.webp")} back={h.back.replace(".webp", "-op.webp")} mask={h.src} bind={binders.current[i]} />
              <span className="ztv-our-num">{i + 1}</span>
            </div>
          ))}
          <img className="ztv-our-body" src={BODY} alt="" decoding="async" draggable={false} />
        </div>
        <span className="ztv-our-price"><b>650</b>lei</span>
        <span className="ztv-our-tag">3 capete</span>
      </div>

      <div className="ztv-our-right">
        <div className="ztv-our-title">CAMERA NOASTRĂ</div>
        <div className="ztv-our-sub">3 capete rotative • 3 imagini</div>
        <div className="ztv-our-screen">
          <span className="ztv-our-live"><i />LIVE 24.10.2026 18:42</span>
          <div className="ztv-our-wins">
            {[0, 1, 2].map((i) => (
              <div key={i} ref={(el) => { wins.current[i] = el; }} className={"ztv-our-win" + (on(i) ? " on" : "")}
                style={{ backgroundImage: `url(${VIEW})` }}>
                <span>Cap {i + 1} · <em ref={(el) => { degs.current[i] = el; }}>0°</em></span>
              </div>
            ))}
          </div>
          <div className="ztv-our-ok">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" /><path d="M7 12.5l3.2 3.2L17 9" /></svg>
            {phase === 3 ? "Toate 3 capete se rotesc din telefon" : "Fiecare cap se rotește separat"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZtvOurCamera;

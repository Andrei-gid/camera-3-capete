import { useEffect, useRef, useState } from "react";

// Lower half of the "Vezi diferența" video, drawn live on top of it:
// our 3-head camera — each head turns in turn, and its own window on the screen changes view.
const BODY = "/products/cam3-body3.webp";
const HEADS = [
  { src: "/products/cam3-h-l.webp", box: [0, 54.5, 31.79, 27.78], amp: 34 },
  { src: "/products/cam3-h-c.webp", box: [32.14, 61.11, 34.71, 38.98], amp: 44 },
  { src: "/products/cam3-h-r.webp", box: [68.2, 54.5, 31.86, 27.78], amp: 34 },
] as const;
const VIEW = "/effects/hz-panorama.webp";
const BASE = [14, 50, 86]; // which part of the yard each head looks at
const LOOP = 9;
const PH: [number, number][] = [[0.2, 2.2], [2.2, 4.2], [4.2, 6.2], [6.4, 8.8]];

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * x));
const swing = (t: number, a: number, b: number) => {
  if (t <= a || t >= b) return 0;
  const u = (t - a) / (b - a);
  return Math.sin(u * Math.PI * 2) * ease(Math.min(1, u * 4)) * ease(Math.min(1, (1 - u) * 4));
};

const ZtvOurCamera = ({ active }: { active: boolean }) => {
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const shades = useRef<(HTMLDivElement | null)[]>([]);
  const wins = useRef<(HTMLDivElement | null)[]>([]);
  const [phase, setPhase] = useState(-1);
  const pRef = useRef(-1);

  useEffect(() => {
    const draw = (time: number) => {
      const t = time % LOOP;
      const all = swing(t, PH[3][0], PH[3][1]);
      HEADS.forEach((h, i) => {
        const v = (swing(t, PH[i][0], PH[i][1]) + all * (i === 0 ? -1 : 1)) * h.amp;
        const tf = `translateX(${(Math.sin((v * Math.PI) / 180) * 7).toFixed(2)}%) rotateY(${v.toFixed(2)}deg)`;
        const im = imgs.current[i];
        if (im) im.style.transform = tf;
        const sh = shades.current[i];
        if (sh) {
          sh.style.transform = tf;
          sh.style.opacity = String(Math.min(0.7, Math.abs(v) / 60));
          sh.style.background = `linear-gradient(${v >= 0 ? 90 : 270}deg, rgba(0,0,0,0.85), rgba(0,0,0,0) 55%)`;
        }
        const w = wins.current[i];
        if (w) w.style.backgroundPosition = `${(BASE[i] - (v / h.amp) * 13).toFixed(1)}% 62%`;
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
              <img ref={(el) => { imgs.current[i] = el; }} src={h.src} alt="" decoding="async" draggable={false} />
              <div ref={(el) => { shades.current[i] = el; }} className="ztv-our-shade"
                style={{ WebkitMask: `url(${h.src}) center / 100% 100% no-repeat`, mask: `url(${h.src}) center / 100% 100% no-repeat` }} />
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
                <span>Cap {i + 1}</span>
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

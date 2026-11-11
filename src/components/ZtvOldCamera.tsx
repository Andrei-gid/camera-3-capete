import { useEffect, useRef } from "react";
import HeadCyl from "@/components/HeadCyl";

// Upper half of the "Vezi diferența" video, drawn live on top of it:
// an ordinary 1+1 camera — the top lens is fixed (its window never moves), only the lower head turns.
const TOP = "/products/old-top.webp";
const HEAD = "/products/old-head.webp";
const VIEW = "/products/yard-240.webp"; // same 240° strip as below: 60° window, turns 1:1 with the head
const PERIOD = 7.2;

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * x));
// PTZ motor profile over one period: centre → full left, stop, sweep to full right, stop, back
const motor = (t: number) => {
  const u = ((t % PERIOD) + PERIOD) % PERIOD / PERIOD;
  if (u < 0.2) return -ease(u / 0.2);
  if (u < 0.3) return -1;
  if (u < 0.72) return -1 + 2 * ease((u - 0.3) / 0.42);
  if (u < 0.82) return 1;
  return 1 - ease((u - 0.82) / 0.18);
};

const ZtvOldCamera = ({ active }: { active: boolean }) => {
  const setter = useRef<(deg: number) => void>();
  const bind = useRef((fn: (deg: number) => void) => { setter.current = fn; });
  const win = useRef<HTMLDivElement>(null);
  const deg = useRef<HTMLElement>(null);
  const last = useRef(0);

  useEffect(() => {
    const draw = (time: number) => {
      const v = motor(time) * 90;
      setter.current?.(v);
      const speed = Math.abs(v - last.current);
      last.current = v;
      const w = win.current;
      if (w) {
        w.style.backgroundPosition = `${(((v + 90) / 180) * 100).toFixed(2)}% 55%`;
        w.style.filter = speed > 0.6 ? `blur(${Math.min(1.4, speed * 0.35).toFixed(2)}px)` : "none";
      }
      if (deg.current) deg.current.textContent = `${v > 0.5 ? "+" : v < -0.5 ? "−" : ""}${Math.abs(Math.round(v))}°`;
    };
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !active) { draw(reduced ? 1.2 : 0); return; }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div className="ztv-old" aria-label="Cameră obișnuită: partea de sus este fixă, se rotește doar capul de jos">
      <div className="ztv-old-cam">
        <img className="ztv-old-top" src={TOP} alt="" decoding="async" draggable={false} />
        <span className="ztv-old-lock">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" /></svg>
          Fix
        </span>
        <div className="ztv-old-hd">
          <HeadCyl front="/products/old-head-front-op.webp" back="/products/old-head-back-op.webp" mask={HEAD} bind={bind.current} />
        </div>
        <span className="ztv-our-price ztv-old-price"><b>650</b>lei</span>
        <span className="ztv-old-tag">1 + 1 obiective</span>
      </div>

      <div className="ztv-old-right">
        <div className="ztv-our-title">CAMERĂ OBIȘNUITĂ</div>
        <div className="ztv-old-sub">sus fix • doar capul de jos se rotește</div>
        <div className="ztv-our-screen ztv-old-screen">
          <span className="ztv-our-live"><i />LIVE 24.10.2026 18:42</span>
          <div className="ztv-our-wins two">
            <div className="ztv-our-win fixed" style={{ backgroundImage: `url(${VIEW})` }}>
              <span>Sus · fix</span>
              <i className="ztv-old-pin" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" /></svg>
              </i>
            </div>
            <div ref={win} className="ztv-our-win on" style={{ backgroundImage: `url(${VIEW})` }}>
              <span>Jos · <em ref={deg}>0°</em></span>
            </div>
          </div>
          <div className="ztv-old-bad">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" /><path d="M8 8l8 8M16 8l-8 8" /></svg>
            Partea de sus nu se rotește
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZtvOldCamera;

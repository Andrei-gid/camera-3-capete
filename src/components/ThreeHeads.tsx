import { useEffect, useRef, useState } from "react";
import "./ThreeHeads.css";

// "3 capete motorizate": ordinary camera (only the lower head turns, the top is fixed)
// vs our camera (all three heads are motorised), driven from a phone with three joysticks.
// Everything is CSS 3D (perspective + rotateY per head + shading), animated with one rAF loop
// that pauses while the block is off screen.

const OLD_TOP = "/products/old-top.webp";
const OLD_HEAD = "/products/old-head.webp";
const BODY = "/products/cam3-body3.webp";
const HEADS = [
  { k: "l", src: "/products/cam3-h-l.webp", box: [0, 54.5, 31.79, 27.78], amp: 34 },
  { k: "c", src: "/products/cam3-h-c.webp", box: [32.14, 61.11, 34.71, 38.98], amp: 46 },
  { k: "r", src: "/products/cam3-h-r.webp", box: [68.2, 54.5, 31.86, 27.78], amp: 34 },
] as const;

const LOOP = 13; // seconds
// phases: 0 → Cap 1, 1 → Cap 2, 2 → Cap 3, 3 → all three together
const PHASES: [number, number][] = [[0.3, 3], [3, 5.7], [5.7, 8.4], [8.7, 12.6]];

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * x));
// one smooth swing inside [a, b]: 0 → +1 → −1 → 0
const swing = (t: number, a: number, b: number) => {
  if (t <= a || t >= b) return 0;
  const u = (t - a) / (b - a);
  return Math.sin(u * Math.PI * 2) * ease(Math.min(1, u * 4)) * ease(Math.min(1, (1 - u) * 4));
};

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type HeadEls = { img: HTMLImageElement | null; shade: HTMLDivElement | null; beam: HTMLDivElement | null };

const applyHead = (h: HeadEls, ang: number, shift: number) => {
  const tf = `translateZ(26px) translateX(${shift.toFixed(2)}%) rotateY(${ang.toFixed(2)}deg)`;
  if (h.img) h.img.style.transform = tf;
  if (h.shade) {
    h.shade.style.transform = tf.replace("translateZ(26px)", "translateZ(27px)");
    h.shade.style.opacity = String(Math.min(0.7, Math.abs(ang) / 60));
    h.shade.style.background = `linear-gradient(${ang >= 0 ? 90 : 270}deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 55%)`;
  }
  if (h.beam) h.beam.style.transform = `translateX(-50%) rotate(${(-ang * 0.9).toFixed(2)}deg)`;
};

const ThreeHeadsShowcase = () => {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [phase, setPhase] = useState(-1);

  const oldHead = useRef<HeadEls>({ img: null, shade: null, beam: null });
  const heads = useRef<HeadEls[]>(HEADS.map(() => ({ img: null, shade: null, beam: null })));
  const rigs = useRef<(HTMLDivElement | null)[]>([]);
  const wins = useRef<(HTMLDivElement | null)[]>([]);
  const sticks = useRef<(HTMLSpanElement | null)[]>([]);
  const finger = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef(-1);

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

  useEffect(() => {
    const draw = (time: number) => {
      const t = time % LOOP;
      // ordinary camera: only its lower head swings, all the time
      const oa = Math.sin((time / 4.2) * Math.PI * 2) * 38;
      applyHead(oldHead.current, oa, Math.sin((oa * Math.PI) / 180) * 7);

      // our camera: one head per phase, then all three together
      const all = swing(t, PHASES[3][0], PHASES[3][1]);
      const vals = HEADS.map((h, i) => {
        const solo = swing(t, PHASES[i][0], PHASES[i][1]);
        const v = (solo + all * (i === 1 ? 1 : i === 0 ? -1 : 1)) * h.amp;
        applyHead(heads.current[i], v, Math.sin((v * Math.PI) / 180) * 7);
        return v / h.amp;
      });

      // gentle 3D sway of both camera rigs so they read as objects in space
      rigs.current.forEach((r, i) => {
        if (!r) return;
        const y = Math.sin(time * 0.55 + i * 1.7) * 9, x = 5 + Math.sin(time * 0.4 + i) * 2;
        r.style.transform = `rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
      });

      // phone: the matching window pans, its joystick knob moves
      vals.forEach((v, i) => {
        const w = wins.current[i];
        if (w) w.style.setProperty("--pan", `${(50 - v * 38).toFixed(1)}%`);
        const s = sticks.current[i];
        if (s) s.style.transform = `translate(calc(-50% + ${(v * 9).toFixed(1)}px), -50%)`;
      });

      let p = -1;
      PHASES.forEach(([a, b], i) => { if (t >= a && t < b) p = i; });
      if (p !== phaseRef.current) { phaseRef.current = p; setPhase(p); }
      if (finger.current) {
        const target = p < 0 ? 1 : p === 3 ? 3 : p;
        finger.current.style.setProperty("--row", String(target));
        finger.current.style.opacity = p < 0 ? "0" : "1";
      }
    };
    if (prefersReduced()) { draw(10.2); return; }
    if (!shown || !onScreen) { draw(0); return; }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [shown, onScreen]);

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
        {/* ordinary camera */}
        <div className="th3-col th3-old">
          <div className="th3-tag bad">Cameră obișnuită</div>
          <div className="th3-space">
            <div className="th3-floor" />
            <div className="th3-rig" ref={(el) => { rigs.current[0] = el; }}>
              <div className="th3-cam th3-cam-old">
                <img className="th3-top" src={OLD_TOP} alt="Cameră obișnuită: partea de sus este fixă" decoding="async" draggable={false} />
                <span className="th3-lock" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" /></svg>
                  Fixă
                </span>
                <div className="th3-hd" style={{ left: "0%", top: "65.5%", width: "100%", height: "34.5%" }}>
                  <div className="th3-beam" ref={(el) => { oldHead.current.beam = el; }} />
                  <img ref={(el) => { oldHead.current.img = el; }} src={OLD_HEAD} alt="" decoding="async" draggable={false} />
                  <div
                    className="th3-shade"
                    ref={(el) => { oldHead.current.shade = el; }}
                    style={{ WebkitMask: `url(${OLD_HEAD}) center / 100% 100% no-repeat`, mask: `url(${OLD_HEAD}) center / 100% 100% no-repeat` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="th3-sum bad"><b>1</b> cap rotativ<small>partea de sus nu se rotește</small></div>
        </div>

        {/* phone with three joysticks */}
        <div className="th3-col th3-phone-col">
          <div className="th3-phone-wrap">
            <div className="th3-phone">
              <div className="th3-notch" />
              <div className="th3-app">V380 Pro</div>
              {["Cap 1", "Cap 2", "Cap 3"].map((label, i) => (
                <div key={label} className={"th3-win w" + i + (phase === i || phase === 3 ? " on" : "")} ref={(el) => { wins.current[i] = el; }}>
                  <div className="th3-scene" />
                  <span className="th3-win-l">{label}</span>
                  <span className="th3-rec" />
                  <span className="th3-joy">
                    <span className="th3-knob" ref={(el) => { sticks.current[i] = el; }} />
                  </span>
                </div>
              ))}
              <div className={"th3-all" + (phase === 3 ? " on" : "")}>Toate 3 — din telefon</div>
              <span className="th3-finger" ref={finger} aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* our camera */}
        <div className="th3-col th3-new">
          <div className="th3-tag good">Camera noastră</div>
          <div className="th3-space">
            <div className="th3-floor" />
            <div className="th3-rig" ref={(el) => { rigs.current[1] = el; }}>
              <div className="th3-cam th3-cam-new">
                {HEADS.map((h, i) => (
                  <div
                    key={h.k}
                    className={"th3-hd hd-" + h.k + (phase === i || phase === 3 ? " on" : "")}
                    style={{ left: h.box[0] + "%", top: h.box[1] + "%", width: h.box[2] + "%", height: h.box[3] + "%" }}
                  >
                    <div className="th3-beam" ref={(el) => { heads.current[i].beam = el; }} />
                    <img ref={(el) => { heads.current[i].img = el; }} src={h.src} alt="" decoding="async" draggable={false} />
                    <div
                      className="th3-shade"
                      ref={(el) => { heads.current[i].shade = el; }}
                      style={{ WebkitMask: `url(${h.src}) center / 100% 100% no-repeat`, mask: `url(${h.src}) center / 100% 100% no-repeat` }}
                    />
                    <span className="th3-num">{i + 1}</span>
                  </div>
                ))}
                <img className="th3-body" src={BODY} alt="Camera cu 3 capete rotative și 3 proiectoare LED" decoding="async" draggable={false} />
              </div>
            </div>
          </div>
          <div className="th3-sum good"><b>3</b> capete rotative<small>fiecare se rotește separat</small></div>
        </div>
      </div>
    </section>
  );
};

export default ThreeHeadsShowcase;

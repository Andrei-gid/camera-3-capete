import { useEffect, useRef, useState, type ReactNode } from "react";
import { useContent } from "@/hooks/useContent";
import { useInView, useReducedMotion, isTouchDevice } from "@/hooks/useScrollFx";

/**
 * Wraps a block so it slides up, sharpens and fades in the first time it
 * scrolls into view. Off when the visitor prefers less motion or when
 * "Плавное появление" is switched off in /admin.
 */
export const Reveal = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => {
  const { motion } = useContent().effects;
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>(0.12);
  const off = reduced || !motion.reveal;
  const shown = off || inView;
  return (
    <div
      ref={ref}
      className={className}
      style={
        off
          ? undefined
          : {
              opacity: shown ? 1 : 0,
              transform: shown ? "none" : "translateY(48px) scale(0.97)",
              filter: shown ? "none" : "blur(8px)",
              transition: `opacity 900ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 900ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, filter 900ms ease ${delay}ms`,
              willChange: shown ? undefined : "opacity, transform, filter",
            }
      }
    >
      {children}
    </div>
  );
};

/**
 * Fixed neon glow behind the whole page. The blobs drift at different speeds
 * while scrolling, which reads as depth. Moves via direct style writes once
 * per frame — no React re-renders.
 */
export const ParallaxGlow = () => {
  const { motion } = useContent().effects;
  const reduced = useReducedMotion();
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const c = useRef<HTMLDivElement>(null);
  const on = motion.parallax && !reduced;

  useEffect(() => {
    // phones: glows stay still — moving big blurred layers on every scroll frame stutters on iPhone
    if (!on || isTouchDevice()) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      if (a.current) a.current.style.transform = `translate3d(0, ${-y * 0.12}px, 0)`;
      if (b.current) b.current.style.transform = `translate3d(0, ${-y * 0.22}px, 0) rotate(${y * 0.02}deg)`;
      if (c.current) c.current.style.transform = `translate3d(${Math.sin(y / 600) * 40}px, ${-y * 0.06}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [on]);

  if (!on) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div ref={a} className="absolute top-[10vh] -left-24 w-[70vw] max-w-[520px] aspect-square rounded-full bg-amber-500/[0.13] blur-[110px] will-change-transform" />
      <div ref={b} className="absolute top-[70vh] -right-24 w-[75vw] max-w-[560px] aspect-square rounded-full bg-cyan-500/[0.11] blur-[120px] will-change-transform" />
      <div ref={c} className="absolute top-[150vh] left-1/4 w-[60vw] max-w-[440px] aspect-square rounded-full bg-fuchsia-500/[0.09] blur-[110px] will-change-transform" />
    </div>
  );
};

const CountUp = ({ to, start, duration = 1400 }: { to: number; start: boolean; duration?: number }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, to, duration]);
  return <>{v}</>;
};

/** Row of big numbers (3 obiective, 10x zoom…) that count up when they appear. */
export const StatsCounters = () => {
  const { stats } = useContent().effects;
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLElement>(0.35);
  if (!stats.enabled || stats.items.length === 0) return null;
  return (
    <section ref={ref} className="relative w-full px-4 md:px-0 py-12 md:py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-4xl mx-auto">
        {stats.items.map((s, i) => (
          <div
            key={i}
            className="relative rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4 md:p-6 text-center overflow-hidden"
            style={{
              opacity: reduced || inView ? 1 : 0,
              transform: reduced || inView ? "none" : "translateY(24px)",
              transition: `opacity 700ms ease ${i * 120}ms, transform 700ms cubic-bezier(0.22,1,0.36,1) ${i * 120}ms`,
            }}
          >
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-amber-400/15 blur-2xl" />
            <div className="relative font-orbitron text-3xl md:text-5xl font-bold text-white tabular-nums drop-shadow-[0_0_18px_rgba(255,180,50,0.45)]">
              {s.prefix}
              {reduced ? s.value : <CountUp to={s.value} start={inView} />}
              <span className="text-amber-400">{s.suffix}</span>
            </div>
            <div className="relative mt-1 text-[13px] md:text-sm uppercase tracking-[0.2em] text-white/60">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

import { useEffect, useRef, useState, type RefObject } from "react";

/** True when the visitor asked the OS for less motion. */
export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
};

/**
 * Scroll progress (0 → 1) through a tall "sticky" section, updated at most
 * once per animation frame.
 *  - "stick" (default): 0 when its top reaches the top of the screen,
 *    1 when its bottom reaches the bottom.
 *  - "enter": 0 as soon as its top appears at the bottom of the screen,
 *    1 when its bottom reaches the bottom — the scene starts while it rises.
 */
export const useScrollProgress = <T extends HTMLElement>(mode: "stick" | "enter" = "stick"): [RefObject<T>, number] => {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let next: number;
      if (mode === "enter") {
        next = r.height > 0 ? Math.min(1, Math.max(0, (vh - r.top) / r.height)) : 0;
      } else {
        const span = r.height - vh;
        next = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : r.top <= 0 ? 1 : 0;
      }
      setP((prev) => (Math.abs(prev - next) < 0.0015 ? prev : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mode]);
  return [ref, p];
};

/** Fires once when the element first scrolls into view. */
export const useInView = <T extends HTMLElement>(threshold = 0.2): [RefObject<T>, boolean] => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, inView]);
  return [ref, inView];
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0 before a, 1 after b, smooth in between. */
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Plays 0 → 1 over `ms` once the element is visible enough — a timed
 * animation instead of a scroll-driven one, so the visitor needs no extra
 * swipes. Returns 1 immediately for reduced motion.
 */
export const usePlayOnView = <T extends HTMLElement>(
  ms: number,
  threshold = 0.45,
): [RefObject<T>, number, (from?: number) => void] => {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<T>(threshold);
  const [t, setT] = useState(0);
  // bump to replay; `from` (0…1) lets a replay skip the intro and restart mid-timeline
  const [run, setRun] = useState({ n: 0, from: 0 });
  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setT(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = Math.min(0.99, Math.max(0, run.from));
    const tick = (now: number) => {
      const k = Math.min(1, from + (now - start) / ms);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, ms, run]);
  return [ref, reduced ? 1 : t, (from = 0) => setRun((r) => ({ n: r.n + 1, from }))];
};

/** True on phones/tablets (touch, no hover): scroll-linked effects are skipped there for smooth scrolling. */
export const isTouchDevice = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(hover: none) and (pointer: coarse)").matches;

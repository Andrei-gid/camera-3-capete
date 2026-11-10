import { useEffect, useRef, type ReactNode } from "react";
import { useContent } from "@/hooks/useContent";
import { useInView, useReducedMotion, isTouchDevice } from "@/hooks/useScrollFx";

// Code-drawn "high-tech" effects. No images are required; everything is SVG,
// canvas or CSS, animated on the GPU and paused when off-screen.

// ---------------------------------------------------------------------------
// Laser scan reveal for block images
// ---------------------------------------------------------------------------

export const ScanReveal = ({ children }: { children: ReactNode }) => {
  const { motion } = useContent().effects;
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  const off = reduced || !motion.scanReveal;
  if (off) return <>{children}</>;
  return (
    <div ref={ref} className="relative">
      <div
        style={{
          clipPath: inView ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
          transition: "clip-path 1400ms cubic-bezier(0.65,0,0.35,1)",
        }}
      >
        {children}
      </div>
      {inView && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
          <div className="scan-beam absolute inset-x-0 h-[3px] bg-cyan-300 shadow-[0_0_18px_4px_rgba(103,232,249,0.8)]" />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Background perspective grid + top progress beam
// ---------------------------------------------------------------------------

export const TechGrid = () => {
  const { motion } = useContent().effects;
  const reduced = useReducedMotion();
  const el = useRef<HTMLDivElement>(null);
  const on = motion.techGrid;

  useEffect(() => {
    if (!on || reduced || isTouchDevice()) return; // static on phones
    let raf = 0;
    const apply = () => {
      raf = 0;
      // move the plane itself (GPU) instead of repainting its background; the
      // pattern repeats every 56px, so wrapping keeps it seamless
      const o = (window.scrollY * 0.35) % 56;
      if (el.current) el.current.style.transform = `rotateX(68deg) translate3d(0, ${o}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [on, reduced]);

  if (!on) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-[55vh] z-0 overflow-hidden" style={{ perspective: "420px" }}>
      <div
        ref={el}
        className="absolute inset-x-[-50%] bottom-[-10%] h-[160%] origin-bottom"
        style={{
          transform: "rotateX(68deg)",
          backgroundImage:
            "linear-gradient(rgba(103,232,249,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.22) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to top, black 10%, transparent 75%)",
          WebkitMaskImage: "linear-gradient(to top, black 10%, transparent 75%)",
        }}
      />
    </div>
  );
};

export const ProgressBeam = () => {
  const { motion } = useContent().effects;
  const bar = useRef<HTMLDivElement>(null);
  const on = motion.progressBeam;
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const k = max > 0 ? window.scrollY / max : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${k})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [on]);
  if (!on) return null;
  return (
    <div aria-hidden className="fixed top-0 inset-x-0 h-[3px] z-[60] pointer-events-none">
      <div
        ref={bar}
        className="h-full origin-left bg-gradient-to-r from-cyan-300 via-violet-400 to-amber-400 shadow-[0_0_12px_rgba(103,232,249,0.9)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
};

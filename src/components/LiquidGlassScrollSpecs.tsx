import { useEffect, useRef, useState, useCallback } from "react";
import { X, type LucideIcon } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { iconFor } from "@/lib/icons";

interface Capsule {
  Icon: LucideIcon;
  title: string;
  detail: string;
}


export const LiquidGlassScrollSpecs = () => {
  const content = useContent();
  const CAPSULES: Capsule[] = content.specs.map((c) => ({ Icon: iconFor(c.icon), title: c.title, detail: c.detail }));
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const compute = useCallback(() => {
    rafRef.current = null;
    const viewportCenter = window.innerHeight / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    refs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const c = r.top + r.height / 2;
      const d = Math.abs(c - viewportCenter);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    setActiveIndex((prev) => (prev === bestIdx ? prev : bestIdx));
  }, []);

  const onScroll = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(compute);
  }, [compute]);

  useEffect(() => {
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [compute, onScroll]);

  return (
    <section className="relative w-full px-4 md:px-0 py-12 md:py-16">
      {/* deep background glow */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white tracking-wide drop-shadow-[0_0_20px_rgba(255,180,50,0.35)]">
            Specificații <span className="text-amber-400">Tehnice</span>
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <p className="mt-3 text-white/50 text-xs uppercase tracking-[0.3em]">
            Scroll · Atinge pentru detalii
          </p>
        </div>

        {/* Capsules column */}
        <div className="flex flex-col items-center gap-5 md:gap-6">
          {CAPSULES.map((cap, i) => {
            const isActive = activeIndex === i;
            const isExpanded = expanded === i;

            // Convex focus: only subtle scale + glow, never hide others
            const scale = isExpanded ? 1 : isActive ? 1.08 : 1;

            const { Icon, title, detail } = cap;

            return (
              <div
                key={i}
                ref={(el) => (refs.current[i] = el)}
                className="w-full flex justify-center"
                style={{ perspective: "1000px" }}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : i)}
                  className={[
                    "group relative overflow-hidden text-left",
                    "rounded-2xl border border-white/10",
                    "bg-white/[0.05] backdrop-blur-2xl",
                    "shadow-[0_25px_70px_-25px_rgba(0,0,0,0.7)]",
                    "transition-[width,height,transform,box-shadow,border-color] duration-[500ms]",
                    "ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "will-change-transform",
                    isExpanded
                      ? "w-full max-w-xl px-6 py-6"
                      : "w-[92%] max-w-[440px] px-5 py-4",
                    isActive && !isExpanded
                      ? "shadow-[0_0_50px_-5px_rgba(251,191,36,0.45),inset_0_1px_0_0_rgba(255,255,255,0.18)] border-amber-300/30"
                      : "",
                  ].join(" ")}
                  style={{
                    transform: `scale(${scale})`,
                  }}
                >
                  {/* Inner glow on active (convex feel) */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500"
                    style={{
                      opacity: isActive ? 1 : 0,
                      background:
                        "radial-gradient(ellipse at 30% 20%, rgba(251,191,36,0.28), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(56,189,248,0.20), transparent 65%)",
                    }}
                  />
                  {/* Thin top highlight */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />

                  {/* Row */}
                  <div className="relative flex items-center gap-4">
                    <div
                      className={[
                        "shrink-0 flex items-center justify-center rounded-xl border w-11 h-11",
                        "transition-all duration-500",
                        isActive
                          ? "bg-amber-400/15 border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
                          : "bg-white/5 border-white/10",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "w-5 h-5 transition-colors duration-500",
                          isActive ? "text-amber-300" : "text-white/80",
                        ].join(" ")}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={[
                          "font-orbitron text-sm md:text-base tracking-wide transition-colors",
                          isActive ? "text-white" : "text-white/90",
                        ].join(" ")}
                      >
                        {title}
                      </div>
                    </div>

                    {isExpanded && (
                      <span
                        aria-label="Închide"
                        className="shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/80"
                      >
                        <X className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  {/* Expanded content with Liquid Pop */}
                  <div
                    className="grid transition-[grid-template-rows,opacity,margin] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      gridTemplateRows: isExpanded ? "1fr" : "0fr",
                      opacity: isExpanded ? 1 : 0,
                      marginTop: isExpanded ? 16 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="relative rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="text-white/85 text-sm leading-relaxed">
                          {detail}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-amber-300/80">
                          <span className="w-1 h-1 rounded-full bg-amber-300" />
                          Detalii premium
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LiquidGlassScrollSpecs;

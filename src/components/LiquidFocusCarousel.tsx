import { useEffect, useRef, useState } from "react";
import { sized } from "@/lib/img";
import { useContent } from "@/hooks/useContent";

/**
 * LiquidFocusCarousel — mobile-first premium carousel with
 * spring-like transitions, frosted side slides, light sweep on snap,
 * and ultra-thin progress bar indicator (Dyson-style).
 */
const LiquidFocusCarousel = () => {
  const content = useContent();
  // mobile gallery from /admin; falls back to the hero photos
  const SLIDES = content.media.carousel.length ? content.media.carousel : content.gallery;
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0); // px offset during drag
  const [dragging, setDragging] = useState(false);
  const [sweep, setSweep] = useState(0); // increments to retrigger glare animation
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slideW, setSlideW] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        // Active slide takes ~72% of container width
        setSlideW(containerRef.current.offsetWidth * 0.72);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Trigger glare each time active changes
  useEffect(() => {
    setSweep((s) => s + 1);
  }, [active]);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
    setActive(clamped);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDrag(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    const threshold = slideW * 0.18;
    if (drag > threshold) goTo(active - 1);
    else if (drag < -threshold) goTo(active + 1);
    setDrag(0);
    setDragging(false);
  };

  return (
    <section className="md:hidden w-full px-4 py-10">
      <div className="mb-5 px-1">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70 mb-1">
          Galerie · Liquid Focus
        </p>
        <h3 className="text-white text-xl font-light tracking-wide">
          Performanță vizuală în detaliu
        </h3>
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none touch-pan-y"
        style={{ aspectRatio: "4 / 5" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Center reference line */}
        {SLIDES.map((src, i) => {
          const offset = i - active;
          const baseX = offset * (slideW * 0.78);
          const x = baseX + (dragging ? drag : 0);
          const distance = Math.abs(x) / (slideW || 1);
          const scale = Math.max(0.78, 1 - distance * 0.18);
          const blurPx = Math.min(14, distance * 16);
          const opacity = Math.max(0.35, 1 - distance * 0.55);
          const isActive = i === active && !dragging;

          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 will-change-transform"
              style={{
                width: `${slideW}px`,
                aspectRatio: "4 / 5",
                transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
                transition: dragging
                  ? "none"
                  : "transform 650ms cubic-bezier(0.22, 1, 0.36, 1), filter 500ms ease, opacity 500ms ease",
                filter: `blur(${blurPx}px)`,
                opacity,
                zIndex: 100 - Math.round(distance * 10),
              }}
            >
              <div
                className="relative w-full h-full overflow-hidden rounded-[28px] border border-white/10"
                style={{
                  boxShadow: isActive
                    ? "0 30px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06) inset"
                    : "0 20px 50px -25px rgba(0,0,0,0.7)",
                }}
              >
                <img
                  src={sized(src, 800)}
                  decoding="async"
                  alt={`Cameră de supraveghere cu 3 obiective — vedere ${i + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                  loading="lazy"
                />

                {/* Frosted dark overlay for non-active */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 100%)",
                    opacity: isActive ? 0 : Math.min(0.85, distance * 0.9 + 0.1),
                    backdropFilter: isActive ? "none" : `blur(${Math.min(6, distance * 8)}px)`,
                    WebkitBackdropFilter: isActive
                      ? "none"
                      : `blur(${Math.min(6, distance * 8)}px)`,
                  }}
                />

                {/* Inner glass border */}
                <div className="absolute inset-0 rounded-[28px] pointer-events-none ring-1 ring-inset ring-white/10" />

                {/* Light sweep / glare on snap */}
                {isActive && (
                  <div
                    key={sweep}
                    className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px]"
                  >
                    <div
                      className="absolute top-0 -left-1/3 h-full w-1/2"
                      style={{
                        background:
                          "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
                        animation: "liquid-glare 1100ms ease-out forwards",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Edge vignettes */}
        <div className="absolute inset-y-0 left-0 w-12 pointer-events-none bg-gradient-to-r from-black/40 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-12 pointer-events-none bg-gradient-to-l from-black/40 to-transparent" />
      </div>

      {/* Dyson-style ultra-thin progress bar */}
      <div className="mt-6 px-2">
        <div className="relative h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500"
            style={{
              width: `${((active + 1) / SLIDES.length) * 100}%`,
              transition: "width 650ms cubic-bezier(0.22, 1, 0.36, 1)",
              boxShadow: "0 0 12px rgba(251,191,36,0.6)",
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs tracking-[0.25em] text-white/40 uppercase">
          <span>
            {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </span>
          <span>Glisează</span>
        </div>
      </div>
    </section>
  );
};

export default LiquidFocusCarousel;

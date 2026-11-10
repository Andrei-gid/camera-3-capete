import { useEffect, useRef, useState } from "react";
import { sized } from "@/lib/img";
import { Plus, X } from "lucide-react";
import { useContent } from "@/hooks/useContent";

type Hotspot = {
  id: string;
  // percentages relative to image
  x: number;
  y: number;
  title: string;
  description: string;
  image: string;
};


export const InteractiveInfographicSection = () => {
  const content = useContent();
  const heroDetail = content.infographic.image;
  // x / y are percentages on the main photo, set in /admin
  const HOTSPOTS: Hotspot[] = content.infographic.hotspots.map((h, i) => ({ ...h, id: `h${i}` }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  // Close tooltip on outside click (desktop)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setActiveId(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const active = HOTSPOTS.find((h) => h.id === activeId) || null;

  return (
    <section id="descriere" className="relative w-full px-4 md:px-0 py-12 md:py-16 mt-8 md:mt-12">
      <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Glow accents */}
        <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative p-6 md:p-10">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[13px] tracking-[0.2em] text-amber-300/90 uppercase">
              Descoperă Produsul
            </div>
            <h2
              className="mt-4 text-2xl md:text-4xl font-bold text-white tracking-wide"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {content.infographic.heading}
            </h2>
            <div className="mx-auto mt-3 h-px w-32 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <p className="mt-4 text-sm md:text-base text-white/60 max-w-2xl mx-auto">
              Apasă pe punctele luminoase pentru a descoperi tehnologiile premium
              integrate în produsul oferit de{" "}
              <span className="text-white/80">{content.contact.company}</span>.
            </p>
          </div>

          <div
            ref={containerRef}
            className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-10 items-start"
          >
            {/* Image with hotspots */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60">
              <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
                <img
                  src={sized(heroDetail, 900)}
                  decoding="async"
                  alt={content.infographic.heading}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />


                {/* Hotspots */}
                {HOTSPOTS.map((h) => {
                  const isActive = activeId === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      aria-label={h.title}
                      onClick={() => setActiveId(isActive ? null : h.id)}
                      onMouseEnter={() => !isMobile && setActiveId(h.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: `${h.x}%`, top: `${h.y}%` }}
                    >
                      {/* Pulse rings */}
                      <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
                      <span className="absolute -inset-2 rounded-full bg-amber-400/10 blur-md" />
                      {/* Dot */}
                      <span
                        className={`relative flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full border border-amber-300/70 bg-gradient-to-br from-amber-300 to-amber-500 text-black shadow-[0_0_18px_rgba(255,180,50,0.55)] transition-transform duration-300 ${
                          isActive ? "scale-110" : "group-hover:scale-110"
                        }`}
                      >
                        <Plus className="w-4 h-4" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}

                {/* Desktop floating tooltip */}
                {active && (
                  <div className="hidden lg:block absolute top-4 right-4 w-72 z-20 animate-fade-in">
                    <TooltipCard hotspot={active} onClose={() => setActiveId(null)} compact />
                  </div>
                )}
              </div>
            </div>

            {/* Side panel — desktop persistent / mobile stack */}
            <div className="space-y-3">
              {HOTSPOTS.map((h) => {
                const isActive = activeId === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setActiveId(isActive ? null : h.id)}
                    className={`w-full text-left rounded-xl border transition-all duration-300 overflow-hidden ${
                      isActive
                        ? "border-amber-300/40 bg-white/[0.06] shadow-[0_0_30px_rgba(255,180,50,0.12)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-4 p-3">
                      <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-white/10">
                        <img
                          src={sized(h.image, 400)}
                          alt={h.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
                            {HOTSPOTS.indexOf(h) + 1}
                          </span>
                          <h3 className="text-white text-sm md:text-base font-semibold truncate">
                            {h.title}
                          </h3>
                        </div>
                        <p
                          className={`text-sm md:text-base text-white/60 mt-1 transition-all duration-300 ${
                            isActive ? "line-clamp-none" : "line-clamp-1"
                          }`}
                        >
                          {h.description}
                        </p>
                      </div>
                    </div>

                    {/* Expanded mobile/active block */}
                    <div
                      className={`grid transition-all duration-500 ease-out ${
                        isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-3 pb-3 pt-1 lg:hidden">
                          <div className="rounded-lg overflow-hidden border border-white/10">
                            <img
                              src={sized(h.image, 400)}
                              alt={h.title}
                              loading="lazy"
                              className="w-full h-40 object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TooltipCard = ({
  hotspot,
  onClose,
  compact,
}: {
  hotspot: Hotspot;
  onClose: () => void;
  compact?: boolean;
}) => (
  <div className="rounded-2xl border border-white/15 bg-black/70 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
    <div className="relative">
      <img
        src={hotspot.image}
        alt={hotspot.title}
        loading="lazy"
        className={`w-full ${compact ? "h-32" : "h-44"} object-cover`}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Închide"
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 border border-white/20 text-white/80 hover:text-white hover:bg-black/80 flex items-center justify-center transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="p-4">
      <h4
        className="text-white font-semibold text-sm tracking-wide"
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        {hotspot.title}
      </h4>
      <div className="my-2 h-px w-10 bg-amber-400/60" />
      <p className="text-white/70 text-sm leading-relaxed">{hotspot.description}</p>
    </div>
  </div>
);

export default InteractiveInfographicSection;

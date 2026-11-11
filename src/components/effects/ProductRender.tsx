import { useInView, useReducedMotion } from "@/hooks/useScrollFx";

// Premium product presentation for cut-out camera renders (transparent WebP/PNG):
// floating product with halo and floor reflection, plus precise callouts.

export const DEFAULT_CUTOUT = "/effects/camera-cutout.webp";

interface Callout {
  x: number; // % on the render
  y: number;
  side: "left" | "right";
  text: string;
}

// Measured on /effects/camera-cutout.webp (485×856).
const CUTOUT_CALLOUTS: Callout[] = [
  { x: 59.8, y: 39.7, side: "right", text: "Obiectiv panoramic fix" },
  { x: 56.1, y: 73.4, side: "right", text: "3 capete rotative · 180°" },
  { x: 38.8, y: 77.3, side: "left", text: "Lumini LED + infraroșu" },
  { x: 30.9, y: 28.0, side: "left", text: "Carcasă IP66 pentru exterior" },
];

// Render box inside a 100 × 125 stage: 50% wide, centred; height follows the image ratio.
const IMG_LEFT = 25;
const IMG_W = 50;
const RATIO = 485 / 856;
const IMG_H = (IMG_W / RATIO) / 1.25; // in % of stage height
const IMG_TOP = (100 - IMG_H) / 2;

export const ProductRenderShowcase = ({ image }: { image: string }) => {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  const shown = reduced || inView;
  const callouts = image === DEFAULT_CUTOUT ? CUTOUT_CALLOUTS : [];

  return (
    <section className="relative w-full py-14 md:py-20 px-2">
      <div ref={ref} className="relative mx-auto w-full max-w-[560px]" style={{ aspectRatio: "100 / 125" }}>
        {/* halo */}
        <div
          className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[78%] aspect-square rounded-full blur-[70px] transition-opacity duration-1000"
          style={{
            opacity: shown ? 1 : 0,
            background: "radial-gradient(circle, rgba(34,211,238,0.28) 0%, rgba(139,92,246,0.18) 45%, transparent 70%)",
          }}
        />
        {/* floor glow */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-[46%] h-[3%] rounded-[50%] bg-cyan-300/30 blur-xl"
          style={{ top: `${IMG_TOP + IMG_H - 1}%` }}
        />

        {/* product (floats gently once visible) */}
        <div
          className="absolute"
          style={{
            left: `${IMG_LEFT}%`,
            width: `${IMG_W}%`,
            top: `${IMG_TOP}%`,
            height: `${IMG_H}%`,
            opacity: shown ? 1 : 0,
            transform: shown ? "none" : "translateY(30px) scale(0.96)",
            transition: "opacity 1000ms ease, transform 1200ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div className={`relative w-full h-full ${reduced ? "" : "product-float"}`}>
            <img
              src={image}
              alt="Camera de supraveghere cu 3 obiective"
              className="w-full h-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]"
              draggable={false}
            />
            {/* soft reflection under the product */}
            <img
              src={image}
              alt=""
              aria-hidden
              className="absolute left-0 top-full w-full h-[28%] object-cover object-bottom opacity-20 -scale-y-100"
              style={{
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 80%)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 80%)",
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* callouts: dot on the part, thin line, label at the side */}
        <svg className="pointer-events-none absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 125" preserveAspectRatio="none">
          {callouts.map((c, i) => {
            const cx = IMG_LEFT + (IMG_W * c.x) / 100;
            const cy = (IMG_TOP + (IMG_H * c.y) / 100) * 1.25;
            const ax = c.side === "right" ? 78 : 22;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={ax}
                y2={cy}
                stroke="rgba(103,232,249,0.85)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={shown ? 0 : 1}
                style={{ transition: `stroke-dashoffset 700ms cubic-bezier(0.65,0,0.35,1) ${900 + i * 180}ms` }}
              />
            );
          })}
        </svg>
        {callouts.map((c, i) => {
          const cx = IMG_LEFT + (IMG_W * c.x) / 100;
          const cy = IMG_TOP + (IMG_H * c.y) / 100;
          const delay = 900 + i * 180;
          return (
            <div key={i}>
              <span
                className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 ring-4 ring-cyan-300/25 shadow-[0_0_12px_rgba(103,232,249,0.9)]"
                style={{ left: `${cx}%`, top: `${cy}%`, opacity: shown ? 1 : 0, transition: `opacity 400ms ease ${delay - 200}ms` }}
              />
              <span
                className={`absolute -translate-y-1/2 w-[21%] text-[11px] sm:text-sm leading-tight font-medium text-white/90 ${
                  c.side === "right" ? "left-[79%] text-left" : "right-[79%] text-right"
                }`}
                style={{
                  top: `${cy}%`,
                  opacity: shown ? 1 : 0,
                  transform: shown ? "translateY(-50%)" : `translateY(-50%) translateX(${c.side === "right" ? 8 : -8}px)`,
                  transition: `opacity 500ms ease ${delay + 500}ms, transform 500ms ease ${delay + 500}ms`,
                }}
              >
                {c.text}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

/** Close-up of a camera detail, melting into the page, with a single light sweep when it appears. */
export const ModuleCloseup = ({ image, title, subtitle }: { image: string; title: string; subtitle: string }) => {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const shown = reduced || inView;
  return (
    <section className="relative w-full py-14 md:py-20 px-4">
      <div ref={ref} className="relative mx-auto w-full max-w-[420px]">
        <div
          className="pointer-events-none absolute inset-[8%] rounded-full blur-[60px] transition-opacity duration-1000"
          style={{ opacity: shown ? 1 : 0, background: "radial-gradient(circle, rgba(34,211,238,0.22), rgba(139,92,246,0.14) 50%, transparent 72%)" }}
        />
        <div className="relative overflow-hidden" style={{ aspectRatio: "600 / 772" }}>
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? "scale(1)" : "scale(1.08)",
              transition: "opacity 1100ms ease, transform 1800ms cubic-bezier(0.22,1,0.36,1)",
            }}
            draggable={false}
          />
          {shown && !reduced && <div aria-hidden className="module-sheen pointer-events-none absolute inset-0" />}
        </div>
        <div
          className="mt-4 text-center"
          style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(12px)", transition: "opacity 700ms ease 500ms, transform 700ms ease 500ms" }}
        >
          <h3 className="font-orbitron text-lg sm:text-2xl font-bold text-white">{title}</h3>
          <p className="mt-2 text-sm text-white/60 max-w-sm mx-auto">{subtitle}</p>
        </div>
      </div>
    </section>
  );
};

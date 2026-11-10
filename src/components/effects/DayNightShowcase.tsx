import { useContent } from "@/hooks/useContent";
import { smoothstep, useReducedMotion, usePlayOnView } from "@/hooks/useScrollFx";
import { CameraHud, ShowcaseHeader } from "./CameraHud";

const pad = (n: number) => String(n).padStart(2, "0");
// Clock goes from early evening to late night while scrolling, so the
// timestamp always matches the light in the picture.
const START = 17 * 3600 + 40 * 60; // 17:40
const END = 23 * 3600 + 15 * 60; // 23:15

/**
 * "Camera view" that turns the same scene from day into night by itself
 * (about 4.5 s) once it is on screen — no pinned scrolling.
 * Uses the uploaded night photo, or — if none — an infrared-style version of
 * the day photo (same pixels, so objects and positions match exactly).
 */
const DayNightShowcase = () => {
  const { dayNight } = useContent().effects;
  const reduced = useReducedMotion();
  const [ref, p] = usePlayOnView<HTMLElement>(4500);

  if (!dayNight.enabled || !dayNight.dayImage) return null;

  const t = reduced ? 1 : smoothstep(0.15, 0.8, p);
  const secs = Math.round(START + (END - START) * (reduced ? 0 : smoothstep(0.05, 0.95, p)));
  const now = new Date();
  const clock = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}  ${pad(Math.floor(secs / 3600))}:${pad(
    Math.floor((secs % 3600) / 60),
  )}:${pad(secs % 60)}`;
  const irOn = t > 0.55;
  const night = dayNight.nightImage;

  return (
    <section ref={ref} className="relative w-full py-12 md:py-16">
      <div className="flex flex-col justify-center px-3 md:px-0">
        <ShowcaseHeader title={dayNight.title} subtitle={dayNight.subtitle} />
        <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-2xl md:rounded-3xl overflow-hidden border border-white/15 bg-black shadow-[0_30px_80px_-25px_rgba(0,0,0,0.8)]">
          {/* Day layer: gets darker as evening comes */}
          <img
            src={dayNight.dayImage}
            alt="Ziua"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: `brightness(${1 - 0.55 * t}) saturate(${1 - 0.4 * t})` }}
            draggable={false}
          />
          {/* Night layer */}
          <img
            src={night || dayNight.dayImage}
            alt="Noaptea, cu infraroșu"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: t,
              filter: night ? undefined : "grayscale(1) contrast(1.3) brightness(1.05)",
            }}
            draggable={false}
          />
          {/* IR vignette only for the simulated night */}
          {!night && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ opacity: t, background: "radial-gradient(ellipse at 50% 55%, transparent 35%, rgba(0,0,0,0.75) 100%)" }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.07] bg-[repeating-linear-gradient(0deg,#fff_0px,#fff_1px,transparent_1px,transparent_3px)]" />
          <CameraHud
            clock={clock}
            badge={
              <span
                className={`px-2 py-0.5 rounded border font-bold transition-colors ${
                  irOn ? "bg-red-500/30 border-red-400/70 text-red-100" : "bg-black/50 border-white/30 text-white/80"
                }`}
              >
                {irOn ? "IR ON" : "DAY"}
              </span>
            }
          />
        </div>
      </div>
    </section>
  );
};

export default DayNightShowcase;

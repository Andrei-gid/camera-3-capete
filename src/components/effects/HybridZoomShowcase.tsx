import { useEffect, useState } from "react";
import { useContent } from "@/hooks/useContent";
import { easeInOut, smoothstep, useReducedMotion, usePlayOnView } from "@/hooks/useScrollFx";
import { RotateCcw } from "lucide-react";
import { SCENE_H, SCENE_W, YardScene } from "./YardScene";

// Fine film grain for the CCTV look (tiny inline SVG noise).
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")";

/** The scene "as seen by the camera": built-in vector yard, or an uploaded photo. */
const Scene = ({ image }: { image: string }) =>
  image ? <image href={image} x={0} y={0} width={SCENE_W} height={SCENE_H} preserveAspectRatio="xMidYMid slice" /> : <YardScene />;

/** Surveillance-camera grading laid over a pane: cool, slightly muted, grain + vignette. */
const CctvGrade = () => (
  <>
    <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.22]" style={{ backgroundImage: GRAIN }} />
    <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
  </>
);

/** Viewfinder corner brackets that converge on the lens module. */
const FocusBrackets = ({ x, y, t }: { x: number; y: number; t: number }) => {
  const spread = 1.6 - 0.6 * t; // 1.6 → 1.0
  const size = 30; // % of card width
  const corner = "absolute w-[22%] h-[22%] border-cyan-200";
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}%`,
        aspectRatio: "1",
        opacity: t,
        transform: `translate(-50%, -50%) scale(${spread})`,
        filter: "drop-shadow(0 0 6px rgba(103,232,249,0.75))",
      }}
    >
      <span className={`${corner} top-0 left-0 border-t-2 border-l-2 rounded-tl-md`} />
      <span className={`${corner} top-0 right-0 border-t-2 border-r-2 rounded-tr-md`} />
      <span className={`${corner} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md`} />
      <span className={`${corner} bottom-0 right-0 border-b-2 border-r-2 rounded-br-md`} />
      <span className="absolute left-1/2 top-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200" />
    </div>
  );
};

/**
 * Hybrid 10x zoom that plays by itself (about 5 s) as soon as the block is on
 * screen — no extra scrolling; a "replay" button appears at the end.
 * Timeline (0…1):
 *  0.00–0.18  heading
 *  0.03–0.33  camera photo slides in
 *  0.28–0.46  photo eases towards the lower two-lens module, surroundings
 *             dim, viewfinder brackets converge, callout appears
 *  0.24–0.48  phone slides in: panorama on top, zoom window below
 *  0.50–0.80  lower window magnifies the panorama towards the target area
 *  0.78–0.88  …and crossfades into the sharp close-up (if one is set)
 *  counter in the pill runs 1.0x → 10.0x over 0.50–0.88
 */
const HybridZoomShowcase = () => {
  const c = useContent();
  const z = c.effects.hybridZoom;
  const reduced = useReducedMotion();
  const [ref, p, replay] = usePlayOnView<HTMLElement>(5000);
  // the replay button appears after the first full play and then stays
  const [played, setPlayed] = useState(false);
  useEffect(() => {
    if (p >= 1) setPlayed(true);
  }, [p]);

  if (!z.enabled) return null;

  const pp = reduced ? 1 : p;
  const head = smoothstep(0.0, 0.18, pp);
  const inCam = smoothstep(0.03, 0.33, pp);
  const focus = smoothstep(0.28, 0.46, pp);
  const inPhone = smoothstep(0.24, 0.48, pp);
  const k = easeInOut(smoothstep(0.5, 0.88, pp));
  const sub = smoothstep(0.86, 0.97, pp);

  const maxZoom = Math.max(2, Math.min(12, z.maxZoom || 6)); // vector mode only
  const s = 1 + (maxZoom - 1) * k;
  const shown = (1 + 9 * k).toFixed(1); // counter reads up to 10x
  const vw = SCENE_W / s;
  const vh = SCENE_H / s;
  const tx = (z.targetX / 100) * SCENE_W;
  const ty = (z.targetY / 100) * SCENE_H;
  const vx = Math.max(0, Math.min(SCENE_W - vw, tx - vw / 2));
  const vy = Math.max(0, Math.min(SCENE_H - vh, ty - vh / 2));
  // Photo mode: magnify the panorama towards the target, then crossfade to the close-up.
  const photoMode = !!z.sceneImage;
  const kz = easeInOut(smoothstep(0.5, 0.8, pp));
  const ps = 1 + (Math.max(1.05, z.maxZoom || 1.55) - 1) * kz;
  const lim = (ps - 1) * 50;
  const ptx = Math.max(-lim, Math.min(lim, -(z.targetX - 50) * ps * kz));
  const pty = Math.max(-lim, Math.min(lim, -(z.targetY - 50) * ps * kz));
  const xfade = smoothstep(0.78, 0.88, pp);
  const xblur = Math.sin(Math.PI * xfade) * 1.8; // brief soft focus while switching

  const camImg = z.cameraImage || c.effects.pairing.cameraImage || c.gallery[0];
  const camScale = 1 + focus * 0.55;
  const gradeFilter = "saturate(0.62) contrast(1.12) brightness(0.94)";

  return (
    <section ref={ref} className="relative w-full py-14 md:py-20">
      <div className="flex flex-col justify-center overflow-hidden px-3">
        <div className="relative w-full max-w-3xl mx-auto">
          {/* heading */}
          <div className="text-center mb-4 sm:mb-6" style={{ opacity: head, transform: `translateY(${(1 - head) * 14}px)` }}>
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-cyan-300/80">Tehnologie dual-lens</p>
            <h2 className="mt-1.5 font-orbitron text-2xl sm:text-4xl font-bold text-white tracking-tight">{z.title}</h2>
          </div>

          {/* stage */}
          <div className="relative rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.015] backdrop-blur-xl p-3 sm:p-6 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="pointer-events-none absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="pointer-events-none absolute -left-20 top-1/3 w-64 h-64 rounded-full bg-cyan-500/15 blur-[80px]" />
            <div className="pointer-events-none absolute -right-16 bottom-0 w-64 h-64 rounded-full bg-violet-500/15 blur-[80px]" />

            <div className="relative grid grid-cols-[0.82fr_1.18fr] items-center gap-3 sm:gap-8" style={{ perspective: "1000px" }}>
              {/* CAMERA */}
              <div
                className="relative will-change-transform"
                style={{
                  transform: `translateX(${(1 - inCam) * -110}%) rotateY(${(1 - inCam) * 28}deg)`,
                  opacity: inCam,
                  filter: `blur(${(1 - inCam) * 10}px)`,
                }}
              >
                <div className="relative aspect-[3/5] rounded-[20px] overflow-hidden ring-1 ring-white/15 bg-zinc-300 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
                  {camImg && (
                    <img
                      src={camImg}
                      alt="Camera de supraveghere — modulul inferior cu două obiective"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: `scale(${camScale})`, transformOrigin: `${z.focusX}% ${z.focusY}%` }}
                      draggable={false}
                    />
                  )}
                  {/* soft spotlight on the lens module */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      opacity: focus,
                      background: `radial-gradient(circle at ${z.focusX}% ${z.focusY}%, transparent 0 16%, rgba(2,6,23,0.35) 30%, rgba(2,6,23,0.78) 60%)`,
                    }}
                  />
                  <FocusBrackets x={z.focusX} y={z.focusY} t={focus} />
                  <div className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/10" />
                </div>
                {/* callout */}
                <div className="mt-2.5 flex items-center justify-center gap-2" style={{ opacity: focus, transform: `translateY(${(1 - focus) * 8}px)` }}>
                  <span className="h-px w-4 bg-cyan-300/70" />
                  <span className="text-[11px] sm:text-[13px] font-medium tracking-[0.08em] text-cyan-100/90 text-center leading-tight">{z.lensLabel}</span>
                  <span className="h-px w-4 bg-cyan-300/70" />
                </div>
              </div>

              {/* PHONE — screen split like a dual-lens app: panorama on top, zoom below */}
              <div
                className="relative will-change-transform"
                style={{
                  transform: `translateX(${(1 - inPhone) * 110}%) rotateY(${(1 - inPhone) * -28}deg)`,
                  opacity: inPhone,
                  filter: `blur(${(1 - inPhone) * 10}px)`,
                }}
              >
                <div className="relative mx-auto w-full max-w-[250px] aspect-[9/19.5] rounded-[34px] bg-gradient-to-b from-zinc-400 via-zinc-800 to-zinc-500 p-[3px] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.95)]">
                  <div className="relative w-full h-full rounded-[31px] bg-black p-[6px]">
                    <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-black flex flex-col">
                      {/* notch + home indicator */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[44%] h-[3.4%] bg-black rounded-b-[14px] z-20" />
                      <div className="absolute bottom-[1.2%] left-1/2 -translate-x-1/2 w-[36%] h-[0.6%] min-h-[3px] rounded-full bg-white/85 z-20" />

                      {photoMode ? (
                        <>
                          {/* upper window: panorama */}
                          <div className="relative w-full overflow-hidden shrink-0" style={{ aspectRatio: "816 / 820" }}>
                            <img src={z.sceneImage} alt="Imagine panoramică" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                          </div>
                          <div className="h-[2px] shrink-0 bg-white/90" />
                          {/* lower window: same panorama magnified, then the sharp close-up */}
                          <div className="relative w-full flex-1 overflow-hidden">
                            <img
                              src={z.sceneImage}
                              alt=""
                              aria-hidden
                              className="absolute inset-0 w-full h-full object-cover will-change-transform"
                              style={{
                                transform: `translate(${ptx}%, ${pty}%) scale(${ps})`,
                                opacity: z.zoomImage ? 1 - xfade : 1,
                                filter: `blur(${xblur}px)`,
                              }}
                              draggable={false}
                            />
                            {z.zoomImage && (
                              <img
                                src={z.zoomImage}
                                alt="Imagine cu zoom"
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{ opacity: xfade, transform: `scale(${1.05 - 0.05 * xfade})`, filter: `blur(${xblur}px)` }}
                                draggable={false}
                              />
                            )}
                            <ZoomPill value={shown} />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* vector fallback: same layout, built-in scene (sharp at any zoom) */}
                          <div className="relative w-full overflow-hidden shrink-0" style={{ aspectRatio: "16 / 10" }}>
                            <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" style={{ filter: gradeFilter }}>
                              <Scene image="" />
                            </svg>
                            <CctvGrade />
                          </div>
                          <div className="h-[2px] shrink-0 bg-white/90" />
                          <div className="relative w-full flex-1 overflow-hidden">
                            <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" style={{ filter: gradeFilter }}>
                              <Scene image="" />
                            </svg>
                            <CctvGrade />
                            <ZoomPill value={shown} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* subtitle */}
          {z.subtitle && (
            <p className="mt-4 text-center text-white/60 text-sm sm:text-base max-w-xl mx-auto px-2" style={{ opacity: sub, transform: `translateY(${(1 - sub) * 12}px)` }}>
              {z.subtitle}
            </p>
          )}
        </div>
        {!reduced && (
          // Shown once the first play has finished and stays visible: a tap restarts only the zoom (1x → 10x),
          // not the camera/phone intro, so the effect of the tap is immediate.
          <div
            className="relative z-20 mt-3 flex justify-center transition-opacity duration-500"
            style={{ opacity: played ? 1 : 0, pointerEvents: played ? "auto" : "none" }}
          >
            <button
              type="button"
              onClick={() => replay(0.48)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-300/[0.08] px-5 py-2.5 text-sm font-semibold text-cyan-100 shadow-[0_0_18px_-4px_rgba(103,232,249,0.6)] hover:bg-cyan-300/15 active:scale-[0.97] transition [touch-action:manipulation]"
            >
              <RotateCcw className={`w-4 h-4 ${p < 1 ? "animate-spin" : ""}`} style={{ animationDuration: "1.2s", animationDirection: "reverse" }} />
              Reluați zoom-ul
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

/** "3.4x Zoom" pill in the lower window, styled like the reference image's badge (and covering it). */
const ZoomPill = ({ value }: { value: string }) => (
  <span className="absolute top-[3%] right-[1.5%] z-10 min-w-[28%] h-[9%] min-h-[18px] px-[3%] rounded-full bg-[#2b2e34]/95 text-white flex items-center justify-center text-[10px] sm:text-xs font-medium tabular-nums shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
    {value}x Zoom
  </span>
);

export default HybridZoomShowcase;

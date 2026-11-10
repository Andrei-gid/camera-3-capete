import { useEffect } from "react";
import { useContent } from "@/hooks/useContent";
import { smoothstep, useReducedMotion, usePlayOnView } from "@/hooks/useScrollFx";
import { ShowcaseHeader } from "./CameraHud";

const MIN_FRAMES = 8;

/**
 * Turntable: once on screen the camera turns a full circle by itself
 * (about 4 s), stepping through photos taken all around it. All frames are stacked and only one is visible, so
 * scrolling never waits for an image to decode.
 */
const Rotate360Showcase = () => {
  const { rotate } = useContent().effects;
  const reduced = useReducedMotion();
  const [ref, p] = usePlayOnView<HTMLElement>(4000);
  const frames = rotate.frames;
  const enabled = rotate.enabled && frames.length >= MIN_FRAMES;

  // Warm the browser cache so the first spin is smooth.
  useEffect(() => {
    if (!enabled) return;
    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [enabled, frames]);

  if (!enabled) return null;

  const idx = reduced ? 0 : Math.round(smoothstep(0.05, 0.95, p) * (frames.length - 1));
  const deg = Math.round((idx / frames.length) * 360);

  return (
    <section ref={ref} className="relative w-full py-12 md:py-16">
      <div className="flex flex-col justify-center px-4 md:px-0">
        <ShowcaseHeader title={rotate.title} subtitle={rotate.subtitle} />
        <div className="relative w-full max-w-md mx-auto aspect-square">
          <div className="pointer-events-none absolute inset-6 rounded-full bg-amber-400/15 blur-[60px]" />
          {frames.map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={i === idx ? "Camera, vedere din toate unghiurile" : ""}
              aria-hidden={i !== idx}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ visibility: i === idx ? "visible" : "hidden" }}
              draggable={false}
            />
          ))}
        </div>
        <div className="mt-4 mx-auto w-40">
          <div className="relative h-[2px] rounded-full bg-white/10 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${(idx / (frames.length - 1)) * 100}%` }} />
          </div>
          <p className="mt-2 text-center text-xs tracking-[0.3em] text-white/40 font-mono">{deg}°</p>
        </div>
      </div>
    </section>
  );
};

export default Rotate360Showcase;

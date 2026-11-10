import { useEffect, useState, type ReactNode } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Clock text for the HUD. `baseSeconds` = seconds since midnight to start from. */
export const useHudClock = (baseSeconds: number | null) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  const now = new Date();
  const date = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
  const secs = baseSeconds === null ? now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() : baseSeconds + tick;
  const s = ((Math.floor(secs) % 86400) + 86400) % 86400;
  return `${date}  ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

/**
 * Security-camera overlay: corner brackets, blinking REC, camera name, clock,
 * optional right-hand badge (zoom level, IR ON…). Purely decorative.
 */
export const CameraHud = ({
  clock,
  badge,
  bottom,
  children,
}: {
  clock: string;
  badge?: ReactNode;
  bottom?: ReactNode;
  children?: ReactNode;
}) => (
  <div className="pointer-events-none absolute inset-0 z-20 font-mono text-[10px] sm:text-xs text-white">
    {/* corner brackets */}
    {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map(
      (c) => (
        <span key={c} className={`absolute w-5 h-5 sm:w-7 sm:h-7 border-white/80 ${c}`} />
      ),
    )}
    {/* faint centre cross */}
    <span className="absolute left-1/2 top-1/2 w-6 h-px -translate-x-1/2 bg-white/40" />
    <span className="absolute left-1/2 top-1/2 h-6 w-px -translate-y-1/2 bg-white/40" />

    <div className="absolute top-3 left-4 sm:top-4 sm:left-6 flex items-center gap-2 drop-shadow">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
      <span className="font-bold tracking-wider">REC</span>
      <span className="text-white/70">CAM 01</span>
    </div>
    {badge && <div className="absolute top-3 right-4 sm:top-4 sm:right-6 drop-shadow">{badge}</div>}
    <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6 text-white/90 drop-shadow tabular-nums">{clock}</div>
    {bottom && <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 drop-shadow">{bottom}</div>}
    {children}
  </div>
);

/** Title + subtitle above a showcase, matching the site's section headers. */
export const ShowcaseHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="text-center px-4 mb-4 md:mb-6">
    <h2 className="font-orbitron text-2xl md:text-4xl font-bold text-white tracking-wide drop-shadow-[0_0_20px_rgba(255,180,50,0.35)]">
      {title}
    </h2>
    <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
    {subtitle && <p className="mt-3 text-white/60 text-sm md:text-base max-w-xl mx-auto">{subtitle}</p>}
  </div>
);

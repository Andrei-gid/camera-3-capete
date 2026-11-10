import { Bluetooth, Wifi, Check, Loader2 } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { smoothstep, useReducedMotion, usePlayOnView } from "@/hooks/useScrollFx";

/**
 * "Pairing" scene that plays by itself (about 4.5 s) as soon as the block is
 * on screen — one swipe brings it into view, no extra scrolling needed.
 * Timeline (0…1):
 *  0.00–0.42  while rising to the centre: camera slides in from the left,
 *             phone from the right
 *  0.42–0.62  link icon lights up, connection line draws between them
 *  0.58–0.82  phone screen: searching → found → connecting → connected
 *  0.82–0.94  headline appears
 * Nothing spins; only slides, glow and packets travelling along the line.
 */
const PairingShowcase = () => {
  const c = useContent();
  const cfg = c.effects.pairing;
  const reduced = useReducedMotion();
  const [ref, p] = usePlayOnView<HTMLElement>(4500);

  if (!cfg.enabled) return null;

  const pp = reduced ? 1 : p;
  const inCam = smoothstep(0.04, 0.38, pp);
  const inPhone = smoothstep(0.08, 0.42, pp);
  const icon = smoothstep(0.42, 0.52, pp);
  const line = smoothstep(0.48, 0.62, pp);
  const progress = smoothstep(0.66, 0.8, pp);
  const connected = pp >= 0.81;
  const title = smoothstep(0.82, 0.94, pp);
  const step = pp < 0.58 ? 0 : pp < 0.66 ? 1 : connected ? 3 : 2;

  const LinkIcon = cfg.link === "wifi" ? Wifi : Bluetooth;
  const linkName = cfg.link === "wifi" ? "WiFi" : "Bluetooth";
  const camImg = cfg.cameraImage || c.gallery[0];
  const steps = ["Căutare cameră…", "Cameră găsită", `Conectare prin ${linkName}…`, "Conectat"];

  return (
    <section ref={ref} className="relative w-full py-14 md:py-20">
      <div className="flex flex-col justify-center overflow-hidden px-3">
        <div className="relative w-full max-w-2xl mx-auto">
          {/* soft glow behind the middle */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full bg-cyan-400/20 blur-[70px]"
            style={{ opacity: icon * (connected ? 1 : 0.7) }}
          />

          <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-4" style={{ perspective: "900px" }}>
            {/* CAMERA — slides in from the left */}
            <div
              className="relative will-change-transform"
              style={{
                transform: `translateX(${(1 - inCam) * -110}%) rotateY(${(1 - inCam) * 35}deg)`,
                opacity: inCam,
                filter: `blur(${(1 - inCam) * 10}px)`,
              }}
            >
              <div className="relative aspect-[3/4] rounded-[22px] border border-white/15 bg-white/[0.05] backdrop-blur-xl overflow-hidden shadow-[0_25px_60px_-20px_rgba(0,0,0,0.8)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                {camImg && <img src={camImg} alt="Camera de supraveghere" className="relative w-full h-full object-contain p-2" draggable={false} />}
                {/* status LED */}
                <span
                  className={`absolute top-3 left-3 w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
                    connected ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" : "bg-amber-400 animate-pulse"
                  }`}
                />
              </div>
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-white/50">Cameră</p>
            </div>

            {/* LINK — icon + connection line with travelling packets */}
            <div className="relative w-14 sm:w-24 h-full flex items-center justify-center">
              <svg className="absolute inset-x-[-70%] top-1/2 -translate-y-1/2 w-[240%] h-6 overflow-visible" viewBox="0 0 240 24" preserveAspectRatio="none">
                <line
                  x1="0"
                  y1="12"
                  x2="240"
                  y2="12"
                  stroke={connected ? "rgba(52,211,153,0.9)" : "rgba(103,232,249,0.85)"}
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  pathLength={240}
                  strokeDashoffset={0}
                  style={{ clipPath: `inset(0 ${(1 - line) * 100}% 0 0)`, transition: "stroke 400ms" }}
                />
              </svg>
              {/* packets: only after the line is drawn */}
              {line > 0.98 && !reduced && (
                <div className="pointer-events-none absolute inset-x-[-70%] top-1/2 -translate-y-1/2 h-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`pairing-packet absolute top-0 w-2 h-2 rounded-full ${connected ? "bg-emerald-300" : "bg-cyan-200"}`}
                      style={{ animationDelay: `${i * 0.45}s` }}
                    />
                  ))}
                </div>
              )}
              <div
                className={`relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border backdrop-blur-xl transition-colors duration-500 ${
                  connected ? "bg-emerald-400/20 border-emerald-300/60" : "bg-cyan-400/15 border-cyan-300/50"
                }`}
                style={{
                  transform: `scale(${0.4 + icon * 0.6})`,
                  opacity: icon,
                  boxShadow: connected ? "0 0 30px rgba(52,211,153,0.7)" : `0 0 ${10 + icon * 25}px rgba(34,211,238,0.6)`,
                }}
              >
                <LinkIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${connected ? "text-emerald-200" : "text-cyan-100"}`} />
              </div>
            </div>

            {/* PHONE — slides in from the right, drawn in code */}
            <div
              className="relative will-change-transform"
              style={{
                transform: `translateX(${(1 - inPhone) * 110}%) rotateY(${(1 - inPhone) * -35}deg)`,
                opacity: inPhone,
                filter: `blur(${(1 - inPhone) * 10}px)`,
              }}
            >
              <div className="relative mx-auto w-full max-w-[170px] aspect-[9/18.5] rounded-[26px] border-[3px] border-zinc-700 bg-zinc-900 p-1.5 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-2.5 rounded-full bg-black z-10" />
                <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col">
                  {/* app header */}
                  <div className="pt-6 pb-2 px-3 text-center border-b border-white/10">
                    <p className="font-orbitron text-[10px] sm:text-xs font-bold text-white">{cfg.appName}</p>
                  </div>
                  {/* screen body */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 px-2 text-center">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-colors duration-500 ${
                        connected ? "bg-emerald-400 border-emerald-200" : "bg-cyan-400/10 border-cyan-300/40"
                      }`}
                    >
                      {connected ? (
                        <Check className="w-6 h-6 text-black" strokeWidth={3} />
                      ) : step >= 1 ? (
                        <LinkIcon className="w-5 h-5 text-cyan-200" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-cyan-200 animate-spin" />
                      )}
                    </div>
                    <p className={`text-[9px] sm:text-[11px] font-semibold ${connected ? "text-emerald-300" : "text-white/85"}`}>
                      {steps[step]}
                      {connected && " ✓"}
                    </p>
                    {/* progress bar */}
                    <div className="w-[80%] h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${connected ? "bg-emerald-400" : "bg-cyan-400"}`}
                        style={{ width: `${(step === 0 ? 0 : step === 1 ? 0.15 : progress) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-white/50">Telefon</p>
            </div>
          </div>

          {/* HEADLINE */}
          <h2
            className="mt-8 text-center font-orbitron text-xl sm:text-3xl font-bold text-white leading-snug px-2 drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]"
            style={{ opacity: title, transform: `translateY(${(1 - title) * 20}px)` }}
          >
            {cfg.title}
          </h2>
        </div>
      </div>
    </section>
  );
};

export default PairingShowcase;

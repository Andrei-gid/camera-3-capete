import { useCallback, useEffect, useRef, useState } from "react";
import { Bluetooth, BookOpen, Check, ChevronLeft, ChevronRight, Download, Info, RotateCcw, RotateCw, Smartphone } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { useInView, useReducedMotion } from "@/hooks/useScrollFx";
import { AppScreen } from "./AppScreens";

/**
 * "Connect in N steps" as a 3D cover-flow gallery of phones.
 *  - native horizontal swipe (scroll-snap), neighbours tilt back in 3D
 *  - plays by itself while on screen (one step every AUTO_MS) until the
 *    visitor touches it; the progress rail fills in real time
 *  - tap a side phone → it comes to the centre; tap the centre phone → it
 *    flips over and shows the step's details
 * No vertical pinning: the page keeps scrolling normally.
 */
const AUTO_MS = 3200;
// cards overlap so the neighbours peek in from the sides
const CARD_W = "min(58vw, 240px)";
const OVERLAP = 0.18; // of the card width, on each side
const PITCH = 1 - 2 * OVERLAP; // distance between card centres, in card widths

const SetupSteps = () => {
  const c = useContent();
  const cfg = c.effects.setup;
  const steps = cfg.steps;
  const n = steps.length;
  const reduced = useReducedMotion();

  const [sectionRef, inView] = useInView<HTMLElement>(0.35);
  const scroller = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [flipped, setFlipped] = useState<number | null>(null);
  // "peek": the centred phone half-turns and comes back, to show it has a back side.
  // Plays on each new step until the visitor flips a phone once.
  const [peek, setPeek] = useState<number | null>(null);
  const [everFlipped, setEverFlipped] = useState(false);

  // cover-flow: transform every card from its distance to the centre (no re-render per frame)
  const layout = useCallback(() => {
    const sc = scroller.current;
    if (!sc) return;
    const mid = sc.scrollLeft + sc.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    cards.current.forEach((el, i) => {
      if (!el) return;
      const center = el.offsetLeft + el.offsetWidth / 2;
      const d = (center - mid) / (el.offsetWidth * PITCH); // in steps
      const ad = Math.min(Math.abs(d), 2);
      if (Math.abs(d) < bestD) {
        bestD = Math.abs(d);
        best = i;
      }
      el.style.transform = reduced
        ? `scale(${1 - ad * 0.14})`
        : `perspective(1000px) rotateY(${Math.max(-1, Math.min(1, d)) * -38}deg) scale(${1 - ad * 0.2}) translateZ(${-ad * 60}px)`;
      el.style.opacity = String(Math.max(0, 1 - ad * 0.38));
      el.style.zIndex = String(10 - Math.round(ad * 3));
    });
    setActive((a) => (a === best ? a : best));
  }, [reduced]);

  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    let raf = 0;
    const on = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          layout();
        });
    };
    layout();
    sc.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      sc.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [layout, n]);

  const goTo = useCallback((i: number, smooth = true) => {
    const sc = scroller.current;
    const el = cards.current[i];
    if (!sc || !el) return;
    sc.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - sc.clientWidth / 2, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // autoplay while visible, until the visitor takes over; stops on the last step
  useEffect(() => {
    if (!inView || !auto || reduced || flipped !== null) return;
    if (active >= n - 1) {
      setAuto(false);
      return;
    }
    const t = window.setTimeout(() => goTo(active + 1), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [inView, auto, active, n, reduced, flipped, goTo]);

  // the flipped card turns back when it leaves the centre
  useEffect(() => {
    if (flipped !== null && flipped !== active) setFlipped(null);
  }, [active, flipped]);

  useEffect(() => {
    if (!inView || reduced || everFlipped || flipped !== null) return;
    const i = active;
    const t1 = window.setTimeout(() => setPeek(i), 900);
    const t2 = window.setTimeout(() => setPeek((p) => (p === i ? null : p)), 1550);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      setPeek(null);
    };
  }, [active, inView, reduced, everFlipped, flipped]);

  const takeOver = () => auto && setAuto(false);

  const onCardTap = (i: number) => {
    takeOver();
    if (i !== active) goTo(i);
    else {
      setEverFlipped(true);
      setPeek(null);
      setFlipped((f) => (f === i ? null : i));
    }
  };

  if (!cfg.enabled || n === 0) return null;
  const step = steps[active];

  return (
    <section ref={sectionRef} className="relative w-full py-14 md:py-20">
      {/* heading */}
      <div className="text-center px-4">
        <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-cyan-300/80">{cfg.eyebrow}</p>
        <h2 className="mt-1.5 font-orbitron text-2xl sm:text-4xl font-bold text-white tracking-tight">{cfg.title}</h2>
      </div>

      {/* gallery */}
      <div className="relative mt-6">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[420px] aspect-square rounded-full blur-[70px] transition-colors duration-700"
          style={{ background: active === n - 1 ? "rgba(52,211,153,0.18)" : "rgba(34,211,238,0.16)" }}
        />
        <div
          ref={scroller}
          onPointerDown={takeOver}
          onWheel={takeOver}
          className="setup-flow relative flex overflow-x-auto snap-x snap-mandatory py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingInline: `calc(50% - ${CARD_W} * ${0.5 - OVERLAP})` }}
        >
          {steps.map((s, i) => {
            const isFlipped = flipped === i;
            const isPeek = peek === i && !isFlipped;
            const tips = (s.details ?? "").split("\n").map((t) => t.trim()).filter(Boolean);
            return (
              <div
                key={i}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className="snap-center shrink-0 will-change-transform"
                style={{ width: CARD_W, marginInline: `calc(${CARD_W} * -${OVERLAP})`, transition: "opacity 200ms linear" }}
              >
                <button
                  type="button"
                  onClick={() => onCardTap(i)}
                  aria-label={`Pasul ${i + 1}: ${s.title}${i === active ? " — atingeți pentru detalii" : ""}`}
                  className="relative block w-full aspect-[9/19.5] [perspective:1200px] focus:outline-none"
                >
                  {/* "turn me over" pill, hanging under the centred phone */}
                  {i === active && !isFlipped && tips.length > 0 && (
                    <span className="pointer-events-none absolute left-1/2 bottom-0 z-30 -translate-x-1/2 translate-y-1/2">
                      <span className="absolute inset-0 rounded-full bg-cyan-300/50 animate-ping" style={{ animationDuration: "1.8s" }} />
                      <span className="relative flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-cyan-300 to-sky-400 px-3 py-1.5 font-orbitron text-xs font-bold uppercase tracking-wider text-slate-950 shadow-[0_0_22px_rgba(103,232,249,0.85)]">
                        <RotateCw className="w-3.5 h-3.5" style={{ animation: "spin 2.6s linear infinite" }} />
                        Detalii pe verso
                      </span>
                    </span>
                  )}
                  {/* step number, outside the phone */}
                  <span
                    className="absolute -left-1.5 -top-1.5 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 ring-1 ring-cyan-300/70 font-orbitron text-[13px] font-bold text-cyan-200 shadow-[0_0_14px_rgba(103,232,249,0.6)]"
                  >
                    {i + 1}
                  </span>
                  <div
                    className="relative w-full h-full transition-transform duration-700"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : isPeek ? "rotateY(-34deg)" : "none",
                      transitionDuration: isPeek ? "550ms" : undefined,
                      transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    {/* FRONT — phone with the app screen */}
                    <div
                      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                      className={`absolute inset-0 rounded-[30px] p-[3px] bg-gradient-to-b from-zinc-300 via-zinc-700 to-zinc-500 ${
                        i === active ? "shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95),0_0_40px_-6px_rgba(34,211,238,0.55)]" : "shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9)]"
                      }`}
                    >
                      <div className="relative w-full h-full rounded-[27px] bg-black p-[5px]">
                        <div className="relative w-full h-full rounded-[23px] overflow-hidden bg-[#070b14]">
                          {s.image ? (
                            <img src={s.image} alt={s.title} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                          ) : (
                            <AppScreen kind={s.screen ?? "none"} appName={c.effects.pairing.appName} />
                          )}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[44%] h-[3.4%] bg-black rounded-b-[12px] z-20" />
                          {s.image && i === n - 1 && (
                            <span className="absolute left-[6%] top-[5.5%] z-20 flex items-center gap-1 rounded-full bg-black/55 px-2 py-[2px] text-[10px] font-bold tracking-wider text-white backdrop-blur-sm">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                              LIVE
                            </span>
                          )}
                          {/* "tap me" chip on the centred card */}
                          {i === active && tips.length > 0 && (
                            <span className="absolute right-[5%] top-[5.5%] z-20 flex items-center gap-1 rounded-full bg-cyan-300 px-1.5 py-[2px] text-[10px] font-bold text-slate-900 shadow-[0_0_12px_rgba(103,232,249,0.8)]">
                              <Info className="w-2.5 h-2.5" /> Detalii
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BACK — details */}
                    <div style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }} className="absolute inset-0 rounded-[30px] p-[3px] bg-gradient-to-b from-cyan-300/70 via-sky-500/40 to-violet-500/60 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95),0_0_40px_-6px_rgba(34,211,238,0.55)]">
                      <div className="relative w-full h-full rounded-[27px] p-4 flex flex-col text-left overflow-hidden"
                        style={{ background: "radial-gradient(ellipse at 50% 0%, #12305a, #060b1c 70%)" }}>
                        <span className="font-orbitron text-4xl font-black text-transparent" style={{ WebkitTextStroke: "1.5px rgba(103,232,249,0.8)" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="mt-1 font-orbitron text-[13px] font-bold leading-snug text-white">{s.title}</p>
                        <ul className="mt-3 space-y-2.5">
                          {tips.map((t, k) => (
                            <li key={k} className="flex gap-2 text-[13px] leading-snug text-white/80">
                              <Check className="mt-[1px] w-3.5 h-3.5 shrink-0 text-emerald-300" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                        <span className="mt-auto flex items-center justify-center gap-1.5 text-xs text-cyan-200/80">
                          <RotateCcw className="w-3 h-3" /> Atingeți pentru a reveni
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* arrows (desktop) */}
        <button
          type="button"
          aria-label="Pasul anterior"
          onClick={() => (takeOver(), goTo(Math.max(0, active - 1)))}
          disabled={active === 0}
          className="hidden md:flex absolute left-[calc(50%-260px)] top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md text-white hover:bg-white/15 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Pasul următor"
          onClick={() => (takeOver(), goTo(Math.min(n - 1, active + 1)))}
          disabled={active === n - 1}
          className="hidden md:flex absolute right-[calc(50%-260px)] top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md text-white hover:bg-white/15 disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* progress rail — tappable, fills in real time while autoplaying */}
      <div className="mx-auto mt-1 flex max-w-[300px] gap-1.5 px-4" role="tablist" aria-label="Pași">
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Pasul ${i + 1}`}
            onClick={() => (takeOver(), goTo(i))}
            className="relative h-6 flex-1 flex items-center"
          >
            <span className="relative block h-[3px] w-full rounded-full bg-white/12 overflow-hidden">
              <span
                key={i === active && auto && inView ? `run-${active}` : `idle-${i}`}
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-300 to-sky-400 shadow-[0_0_8px_rgba(103,232,249,0.8)] ${
                  i === active && auto && inView && !reduced && i < n - 1 ? "setup-rail-run" : ""
                }`}
                style={{
                  width: i < active || (i === active && !(auto && inView && !reduced && i < n - 1)) ? "100%" : i === active ? undefined : "0%",
                  animationDuration: `${AUTO_MS}ms`,
                }}
              />
            </span>
          </button>
        ))}
      </div>

      {/* active step caption */}
      <div className="relative mx-auto mt-3 max-w-md px-6 text-center min-h-[96px]">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
          Pasul {active + 1} din {n}
        </p>
        <h3 key={`t-${active}`} className="setup-caption mt-1.5 font-orbitron text-lg md:text-2xl font-bold text-white">
          {step.title}
        </h3>
        <p key={`d-${active}`} className="setup-caption mt-1 text-sm md:text-base text-white/65">
          {step.text}
        </p>
      </div>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[13px] text-white/60">
        <RotateCw className="w-3 h-3 text-cyan-300" />
        Atingeți telefonul din centru: pe spate sunt detaliile pasului
      </p>
      {/* big entry point to the full connection guide (/ghid): a phone showing the guide itself */}
      <div className="mx-auto mt-10 max-w-3xl px-4">
        <a
          href="/ghid/"
          className="group relative block rounded-[28px] p-[2px] bg-gradient-to-br from-cyan-300/80 via-sky-500/50 to-violet-500/70 shadow-[0_30px_70px_-30px_rgba(34,211,238,0.6)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        >
          <div
            className="relative overflow-hidden rounded-[26px] px-5 pb-6 pt-8 sm:px-8"
            style={{ background: "radial-gradient(ellipse at 50% 0%, #12305a, #070c1d 70%)" }}
          >
            <div className="pointer-events-none absolute left-1/2 top-6 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative flex flex-col items-center gap-7 sm:flex-row sm:gap-8">
              {/* phone with the guide open */}
              <div className="relative shrink-0 px-6">
                <div className="relative w-[148px] -rotate-6 rounded-[30px] bg-gradient-to-b from-[#3a4154] to-[#121622] p-[6px] shadow-[0_30px_50px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition-transform duration-500 group-hover:rotate-0">
                  <div className="relative flex flex-col overflow-hidden rounded-[25px] bg-[#0c0f17] px-2.5 pb-3 pt-6" style={{ aspectRatio: "9 / 18.5" }}>
                    <span className="absolute left-1/2 top-1.5 h-3 w-12 -translate-x-1/2 rounded-full bg-black" />
                    <p className="font-orbitron text-[6.5px] font-bold uppercase tracking-[0.18em] text-cyan-300">Ghid V380 Pro</p>
                    <p className="mt-1 text-[7px] font-semibold text-white/70">Pasul 6 din 10</p>
                    <span className="mt-1 block h-[3px] rounded-full bg-white/10">
                      <span className="block h-full w-3/5 rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" />
                    </span>
                    <div className="mt-2 rounded-[12px] bg-white p-2">
                      <p className="text-center text-[6.5px] font-semibold text-slate-900">Adăugare dispozitiv</p>
                      <span className="mx-auto mt-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-[#2f7bf6]">
                        <Bluetooth className="h-3.5 w-3.5" />
                      </span>
                      <div className="mt-2 flex items-center gap-1 rounded-md bg-slate-50 p-1 ring-1 ring-slate-200">
                        <span className="h-4 w-4 rounded bg-slate-200" />
                        <span className="flex-1 text-[6px] font-semibold text-slate-800">Cameră găsită</span>
                        <span className="relative rounded-full bg-[#2f7bf6] px-1.5 py-0.5 text-[5.5px] font-bold text-white">
                          Adăugați
                          <span className="absolute -bottom-1 -right-1 h-3 w-3 animate-ping rounded-full bg-cyan-300/70" />
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-[7.5px] font-bold leading-tight text-white">Adăugați camera prin Bluetooth</p>
                    <p className="mt-1 text-[6px] leading-snug text-white/55">Telefonul găsește singur camera. Apăsați „Adăugați”.</p>
                    <span className="mt-auto flex justify-center gap-[3px] pb-1.5">
                      {Array.from({ length: 10 }, (_, k) => (
                        <span key={k} className={`h-[4px] rounded-full ${k < 5 ? "w-[4px] bg-emerald-400" : k === 5 ? "w-[10px] bg-cyan-300" : "w-[4px] bg-white/20"}`} />
                      ))}
                    </span>
                    <span className="flex h-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-r from-cyan-400 to-blue-500 text-[6.5px] font-bold text-white">Înainte</span>
                  </div>
                </div>
                <span className="absolute -right-1 top-6 rounded-full border border-emerald-300/40 bg-emerald-400/90 px-2.5 py-1 font-orbitron text-[11px] font-black text-[#06222a] shadow-lg">10 pași</span>
                <span className="absolute -left-4 bottom-16 flex items-center gap-1 rounded-full border border-white/15 bg-[#0b1226]/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur">
                  <Smartphone className="h-3 w-3 text-cyan-300" /> Android · iPhone
                </span>
                <span className="absolute -right-3 bottom-6 rounded-full border border-white/15 bg-[#0b1226]/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur">RO · RU</span>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/90">Ghidul de instalare</p>
                <h3 className="mt-2 font-orbitron text-[22px] font-bold leading-tight text-white sm:text-2xl">
                  Instrucțiunea, direct în telefonul dvs.
                </h3>
                <p className="mt-2 text-sm text-white/70 sm:text-base">Deschideți-o în timpul montajului și apăsați exact ce vedeți pe ecran.</p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10">
                  <Download className="h-3.5 w-3.5 text-emerald-300" /> Se salvează pe ecranul telefonului, ca o aplicație
                </p>
              </div>
            </div>
            <span className="relative mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-base font-bold text-white shadow-[0_14px_30px_-12px_rgba(34,211,238,0.9)] transition group-hover:brightness-110">
              <BookOpen className="h-5 w-5" />
              Deschideți ghidul
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </a>
      </div>
    </section>
  );
};

export default SetupSteps;

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useCameraProduct } from "@/hooks/useCameraProduct";
import BigOrderButton from "@/components/BigOrderButton";
import ZtvOurCamera from "@/components/ZtvOurCamera";
import ZtvOldCamera from "@/components/ZtvOldCamera";
import "./ZoomTestVideo.css";

// First block after the order form: 4-second side-by-side zoom test (video made by code).
// Top: ordinary 1+1 camera — fingers only stretch a blurry picture.
// Bottom: our 1+2 camera — hybrid zoom 1x → 10x up to a readable licence plate.
const SRC = "/video/zoom-test-v3.mp4";
const POSTER = "/video/zoom-test-v3-poster.webp";

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const ZoomTestVideo = () => {
  const product = useCameraProduct();
  const wrapRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [load, setLoad] = useState(false);

  // load the file only when the block is near the screen; play only while visible
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setLoad(true); setInView(true); return; }
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setLoad(true); near.disconnect(); } }, { rootMargin: "600px 0px" });
    const vis = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    near.observe(el); vis.observe(el);
    return () => { near.disconnect(); vis.disconnect(); };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !load) return;
    if (inView && !reduced()) v.play().catch(() => {});
    else v.pause();
  }, [inView, load]);

  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  const onCta = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById("comanda");
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section ref={wrapRef} className={"ztv" + (inView ? " is-in" : "")} aria-labelledby="ztv-title">
      <div className="ztv-head">
        <div className="ztv-eyebrow"><i aria-hidden="true" />TEST REAL · ACEEAȘI PARCARE</div>
        <h2 id="ztv-title">
          3 zone de control <span>simultan</span>
        </h2>
        <p>
          Aceeași parcare. La camera obișnuită se rotește doar un cap — stânga și dreapta rămân{" "}
          <b>zone moarte</b>. Camera noastră supraveghează <b>3 zone deodată</b>, fiecare cap se rotește
          separat din telefon.
        </p>
      </div>

      <div className="ztv-stage">
        <div className="ztv-glow" aria-hidden="true" />
        <div className="ztv-bar">
          <span className="ztv-live" aria-hidden="true"><i />DEMO LIVE</span>
          <button type="button" className="ztv-replay" onClick={replay} aria-label="Pornește din nou">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
            </svg>
            Din nou
          </button>
        </div>
        <div className="ztv-frame">
          <div className="ztv-media">
          <video
            ref={videoRef}
            className="ztv-video"
            poster={POSTER}
            src={load ? SRC : undefined}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            aria-label="Comparație: camera obișnuită are un singur cap rotativ și zone moarte; camera noastră are 3 capete rotative și 3 zone de control simultan"
          />
          {/* upper half replaced live: ordinary camera — top lens fixed, only the lower head turns */}
          <ZtvOldCamera active={inView} />
          {/* lower half replaced live: our 3-head camera, each head turns and its window changes */}
          <ZtvOurCamera active={inView} />
          {/* title and bottom bar of the old zoom video, re-written for the 3-head camera */}
          <div className="ztv-cover-title" aria-hidden="true">
            <b>1 zonă sau 3 zone</b>
            <span>de control?</span>
          </div>
          <div className="ztv-cover-bar">
            <div className="ztv-cover-txt">
              <b>3 zone de control simultan — fără zone moarte</b>
              <small>Plată la livrare • Livrare în toată Moldova</small>
            </div>
            <span className="ztv-cover-price">{product.price} lei</span>
            <a className="ztv-cover-cta" href="#comanda" onClick={onCta}>Comandă acum</a>
          </div>
          </div>
        </div>
      </div>

      <div className="ztv-vs">
        <div className="ztv-pill bad">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          <span><b>1 cap rotativ</b>zone moarte stânga și dreapta</span>
        </div>
        <div className="ztv-pill good">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          <span><b>3 capete rotative</b>3 zone de control simultan</span>
        </div>
      </div>

      <div className="ztv-cta-wrap">
        <BigOrderButton href="#comanda" onClick={onCta} price={product.price} sub="3 zone de control · 3 imagini" />
        <div className="ztv-note">Plată la livrare · Verificare colet gratuită</div>
      </div>
    </section>
  );
};

export default ZoomTestVideo;

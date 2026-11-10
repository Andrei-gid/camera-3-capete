import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useCameraProduct } from "@/hooks/useCameraProduct";
import BigOrderButton from "@/components/BigOrderButton";
import "./DualView.css";

// "Dual View": the fixed top lens is shown in the app as two zones (left + right).
// Marketed as an advantage only — the mechanism is not explained on purpose.
//  - DualViewSpecCard: spec card inside SpecsCards (replaces "Obiectiv panoramic")
//  - DualViewCompare: ordinary 2-lens camera (2 images, no zoom) vs ours (3 images + 10x)

const CAM_TOP = "/effects/library/camera-front-top.webp"; // 625 × 581, transparent
const CAM_OURS = "/effects/camera-cutout.webp"; // 485 × 856, transparent
const CAM_OLD = "/effects/old-camera.webp"; // 404 × 800, transparent

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** true once the element has been mostly on screen (same reveal as the other spec cards) */
const useShown = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced() || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }),
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown] as const;
};

/** pair of blinking LED lamps; x/y/d in % of the parent's width/height */
const Leds = ({ pts, d, ratio }: { pts: [number, number][]; d: number; ratio: number }) => (
  <>
    {pts.map(([x, y], i) => (
      <span key={i} aria-hidden="true">
        <i className="dv-led" style={{ left: x + "%", top: y + "%", width: d + "%", height: d * ratio + "%" }} />
        <i className="dv-led halo" style={{ left: x + "%", top: y + "%", width: d * 2.6 + "%", height: d * 2.6 * ratio + "%" }} />
      </span>
    ))}
  </>
);

const Rec = () => <span className="dv-rec" aria-hidden="true" />;

/* ---------------- 1) spec card ---------------- */
// Scene units 390 × 360. Camera image: 70 % wide, centred, top 0 → lens at (195, 152).
export const DualViewSpecCard = () => {
  const [ref, shown] = useShown<HTMLElement>();
  return (
    <article ref={ref} className={"lxs-block dvc" + (shown ? " is-in" : "")}>
      <div className="dvc-view">
        <div className="lxs-halo" aria-hidden="true" />
        <img className="dvc-cam" src={CAM_TOP} alt="Obiectivul de sus al camerei" decoding="async" draggable={false} />
        {/* lamps at (111.7, 147.8) and (279, 147.8) in scene units; 390/360 keeps them round */}
        <Leds pts={[[28.6, 41.1], [71.5, 41.1]]} d={7.5} ratio={390 / 360} />
        <svg className="dvc-svg" viewBox="0 0 390 360" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="dvc-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#67e8f9" stopOpacity=".75" />
              <stop offset="1" stopColor="#38bdf8" stopOpacity=".06" />
            </linearGradient>
          </defs>
          <polygon className="dvc-beam l" points="191,156 16,242 186,242" fill="url(#dvc-g)" />
          <polygon className="dvc-beam r" points="199,156 204,242 374,242" fill="url(#dvc-g)" />
        </svg>
        <i className="dvc-lensring" aria-hidden="true" />
        {!reduced() && <i className="dvc-lensring wave" aria-hidden="true" />}
        <span className="dvc-chip" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          1 OBIECTIV
        </span>
        <div className="dvc-screen l dv-pano">
          <div className="dv-cctv" />
          <div className="dv-scan" />
          <span className="dv-tag">ZONA 1 · STÂNGA</span>
          <span className="dvc-live"><Rec />LIVE</span>
        </div>
        <div className="dvc-screen r dv-pano">
          <div className="dv-cctv" />
          <div className="dv-scan" style={{ animationDelay: "1.8s" }} />
          <span className="dv-tag">ZONA 2 · DREAPTA</span>
          <span className="dvc-live"><Rec />LIVE</span>
        </div>
      </div>
      <div className="lxs-txt">
        <div className="lxs-eyebrow"><span className="dvc-badge">AI</span>Tehnologie Dual View</div>
        <h3>Un obiectiv — <span>două zone</span>, simultan</h3>
        <p>Procesarea inteligentă împarte imaginea obiectivului de sus în două ecrane separate. Vezi stânga și dreapta în același timp — cu o singură cameră.</p>
        <div className="dvc-pills">
          <span>1 obiectiv</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <span className="hot">2 ecrane live</span>
        </div>
      </div>
    </article>
  );
};

/* ---------------- 2) comparison block ---------------- */

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
);
const Cross = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const DualViewCompare = () => {
  const product = useCameraProduct();
  const onCta = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById("comanda");
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="dvx" aria-labelledby="dvx-title">
      <div className="dvx-head">
        <div className="dvx-eyebrow">TEHNOLOGIE NOUĂ · DUAL VIEW</div>
        <h2 id="dvx-title">
          Un obiectiv — <span>două ecrane</span>
        </h2>
        <p>Obiectivul de sus vede două zone deodată și ți le arată pe telefon în ferestre separate. Plus a treia imagine — cu zoom hibrid 10x.</p>
      </div>

      <div className="dvx-grid">
        {/* ordinary camera */}
        <div className="dvx-col">
          <div className="dvx-ttl">
            <small>CAMERĂ OBIȘNUITĂ</small>
            <b>2 imagini</b>
          </div>
          <div className="dvx-cam old" style={{ aspectRatio: "404 / 800" }}>
            <img src={CAM_OLD} alt="Cameră obișnuită cu două obiective: unul sus, unul jos" loading="lazy" decoding="async" draggable={false} />
          </div>
          <div className="dvx-notes">
            <div><i />Sus: 1 obiectiv = 1 imagine</div>
            <div><i />Jos: 1 obiectiv — fără zoom</div>
          </div>
          <div className="dvx-phone">
            <div className="dvx-notch" />
            <div className="dvx-scr">
              <div className="dvx-win far top dv-pano">
                <div className="dv-cctv" />
                <span className="dv-tag grey">CAM 1</span>
              </div>
              <div className="dvx-win far bot dv-pano">
                <div className="dv-cctv" />
                <span className="dv-tag grey">CAM 2</span>
                <span className="dvx-z1">Zoom: 1x</span>
              </div>
            </div>
          </div>
          <div className="dvx-foot"><Cross />Fără zoom</div>
        </div>

        {/* our camera */}
        <div className="dvx-col ours">
          <div className="dvx-flag">CAMERA NOASTRĂ</div>
          <div className="dvx-ttl">
            <small>DUAL VIEW</small>
            <b>3 imagini <span>+ zoom 10x</span></b>
          </div>
          <div className="dvx-cam" style={{ aspectRatio: "485 / 856" }}>
            <img src={CAM_OURS} alt="Camera noastră: un obiectiv sus și două obiective jos, pe capul rotativ" loading="lazy" decoding="async" draggable={false} />
            {/* measured on the 485 × 856 render, in % */}
            <Leds pts={[[28.9, 37.4], [85.6, 37.4]]} d={20} ratio={485 / 856} />
            <i className="dvx-ring dv-pulse" style={{ left: "60.2%", top: "39.6%", width: "20%", height: 20 * (485 / 856) + "%" }} aria-hidden="true" />
            <i className="dvx-box dv-pulse" style={{ left: "46.6%", top: "63%", width: "19.4%", height: "22.6%" }} aria-hidden="true" />
          </div>
          <div className="dvx-notes">
            <div><i className="c" /><span><b>Sus: 1 obiectiv</b> → 2 zone pe ecran</span></div>
            <div><i className="a" /><span><b>Jos: 2 obiective</b> → zoom hibrid 10x, clar</span></div>
          </div>
          <div className="dvx-phone">
            <div className="dvx-notch" />
            <div className="dvx-scr">
              <div className="dvx-zones">
                <div className="dvx-win zone l dv-pano">
                  <div className="dv-cctv" />
                  <div className="dv-scan" />
                  <span className="dv-tag">ZONA 1</span>
                  <span className="dvx-recpos"><Rec /></span>
                </div>
                <div className="dvx-win zone r dv-pano">
                  <div className="dv-cctv" />
                  <div className="dv-scan" style={{ animationDelay: "1.6s" }} />
                  <span className="dv-tag">ZONA 2</span>
                  <span className="dvx-recpos"><Rec /></span>
                </div>
              </div>
              <div className="dvx-div" aria-hidden="true"><span /><b>1 OBIECTIV</b><span /></div>
              <div className="dvx-win zoom dv-zoomimg">
                <div className="dv-cctv" />
                <div className="dv-scan" style={{ animationDelay: ".8s" }} />
                <span className="dv-tag amber">ZOOM <span className="dvx-x">10x</span></span>
                <span className="dvx-recpos"><Rec /></span>
              </div>
            </div>
          </div>
          <div className="dvx-foot"><Check />Zoom puternic doar cu 2 obiective</div>
        </div>
      </div>

      <div className="dvx-stats">
        <div className="dvx-stat"><b><s>2</s> → <span>3</span></b><small>imagini pe telefon</small></div>
        <div className="dvx-stat"><b><s>1</s> → <span>2</span></b><small>zone dintr-un obiectiv</small></div>
        <div className="dvx-stat"><b><s>—</s> → <span>10x</span></b><small>zoom hibrid</small></div>
      </div>

      <div className="dvx-cta-wrap">
        <BigOrderButton href="#comanda" onClick={onCta} price={product.price} sub="3 imagini + zoom hibrid 10x" />
        <div className="dvx-note">Imaginile de pe ecran sunt ilustrative.</div>
      </div>
    </section>
  );
};

export default DualViewCompare;

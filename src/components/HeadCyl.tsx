import { useEffect, useMemo, useRef } from "react";
import "./HeadCyl.css";

/**
 * A camera head drawn as a real 3D cylinder instead of a flat picture.
 * The front photo is wrapped around the front 150° of the cylinder (each vertical slice gets its own
 * part of the photo, stretched by 1/cos so the lens slides around the curve), the remaining 210°
 * is the back texture (matte plastic + label). Each slice is shaded by the angle it faces, so when
 * the head turns 90°+ you see its side and back, like the real camera — not a flat card turning.
 *
 * Parent drives it imperatively (no re-render per frame): bind((deg) => ...) gives a setter.
 */
type Props = { front: string; back: string; mask: string; bind: (set: (deg: number) => void) => void; className?: string };

const TH_MAX = 75; // half-arc of the front photo, degrees
const NF = 24; // slices on the front arc
const NB = 14; // slices on the back arc
const R = 50 / Math.sin((TH_MAX * Math.PI) / 180); // radius in cqw (head box width = 100cqw)
const rad = (d: number) => (d * Math.PI) / 180;

type Slice = { mid: number; w: number; bgW: number; bgX: number; back: boolean };

const buildSlices = (): Slice[] => {
  const out: Slice[] = [];
  const df = (2 * TH_MAX) / NF;
  for (let i = 0; i < NF; i++) {
    const a = -TH_MAX + i * df, b = a + df;
    const w = R * rad(df);
    const k = w / (R * (Math.sin(rad(b)) - Math.sin(rad(a))));
    out.push({ mid: (a + b) / 2, w, bgW: 100 * k, bgX: -(50 + R * Math.sin(rad(a))) * k, back: false });
  }
  const span = 360 - 2 * TH_MAX, db = span / NB, half = span / 2;
  for (let i = 0; i < NB; i++) {
    const a = TH_MAX + i * db, b = a + db;
    // φ = angle from the very back; mirrored so the label reads correctly from behind
    const pa = a - 180, pb = b - 180;
    const xa = 50 - (pb / half) * 50, xb = 50 - (pa / half) * 50;
    const w = R * rad(db);
    const k = w / (xb - xa);
    out.push({ mid: (a + b) / 2, w, bgW: 100 * k, bgX: -xa * k, back: true });
  }
  return out;
};

const HeadCyl = ({ front, back, mask, bind, className }: Props) => {
  const slices = useMemo(buildSlices, []);
  const rotRef = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const set = (deg: number) => {
      const r = rotRef.current;
      if (r) r.style.transform = `translateZ(${(-R * 0.94).toFixed(2)}cqw) rotateY(${deg.toFixed(2)}deg)`;
      slices.forEach((s, i) => {
        const el = els.current[i];
        if (!el) return;
        const c = Math.cos(rad(s.mid + deg)); // how much this slice faces the viewer
        const lum = 0.22 + 0.78 * Math.pow(Math.max(0, c), 0.7);
        el.style.filter = `brightness(${lum.toFixed(3)})`;
      });
    };
    set(0);
    bind(set);
  }, [bind, slices]);

  return (
    // the head is a body of revolution, so its outline stays the same at any angle: clip the whole
    // cylinder to the head silhouette → clean edges, no slice shards at 90°
    <div className={"hcyl " + (className || "")} style={{ WebkitMask: `url(${mask}) center / 100% 100% no-repeat`, mask: `url(${mask}) center / 100% 100% no-repeat` }}>
      <div className="hcyl-rot" ref={rotRef}>
        {slices.map((s, i) => (
          <div
            key={i}
            ref={(el) => { els.current[i] = el; }}
            className="hcyl-s"
            style={{
              width: `calc(${s.w.toFixed(3)}cqw + 0.6px)`,
              marginLeft: `calc(${(-s.w / 2).toFixed(3)}cqw - 0.3px)`,
              transform: `rotateY(${s.mid.toFixed(3)}deg) translateZ(${R.toFixed(3)}cqw)`,
              backgroundImage: `url(${s.back ? back : front})`,
              backgroundSize: `${s.bgW.toFixed(3)}cqw 100%`,
              backgroundPosition: `${s.bgX.toFixed(3)}cqw 0`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeadCyl;

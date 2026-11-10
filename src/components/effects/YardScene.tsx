// Built-in yard/street scene "as seen by the camera", drawn as vector so the
// 10x zoom stays perfectly sharp. Coordinates: viewBox 0 0 1600 900.
// The licence plate is tiny at 1x and readable at 10x — that's the demo.
// Plate centre ≈ (1170, 678) → 73.1% / 75.3% (defaults in siteContent).

export const SCENE_W = 1600;
export const SCENE_H = 900;

const windows = (x: number, y: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number, lit: number[]) =>
  Array.from({ length: cols * rows }, (_, i) => {
    const cx = x + (i % cols) * (w + gx);
    const cy = y + Math.floor(i / cols) * (h + gy);
    return <rect key={i} x={cx} y={cy} width={w} height={h} rx={2} fill={lit.includes(i) ? "#fde68a" : "#94a3b8"} opacity={0.9} />;
  });

export const YardScene = () => (
  <g>
    <defs>
      <linearGradient id="ys-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7cc4f2" />
        <stop offset="100%" stopColor="#dff1fb" />
      </linearGradient>
      <linearGradient id="ys-road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4b5563" />
        <stop offset="100%" stopColor="#374151" />
      </linearGradient>
      <linearGradient id="ys-car" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="100%" stopColor="#9ca3af" />
      </linearGradient>
      <linearGradient id="ys-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="55%" stopColor="#334155" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="ys-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e2eef7" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#e2eef7" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id="ys-drive" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9aa0a8" />
        <stop offset="100%" stopColor="#6b7078" />
      </linearGradient>
      <linearGradient id="ys-body-side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
        <stop offset="18%" stopColor="#000" stopOpacity="0" />
        <stop offset="82%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
      </linearGradient>
      <filter id="ys-dof" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="3.2" />
      </filter>
      <filter id="ys-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>

    {/* sky + soft clouds */}
    <rect width="1600" height="900" fill="url(#ys-sky)" />
    {/* far background is out of focus (depth of field) */}
    <g filter="url(#ys-dof)">
    <g fill="#ffffff" opacity="0.75">
      <ellipse cx="260" cy="110" rx="120" ry="28" />
      <ellipse cx="330" cy="95" rx="80" ry="26" />
      <ellipse cx="1180" cy="140" rx="140" ry="30" />
      <ellipse cx="1260" cy="122" rx="90" ry="26" />
    </g>

    {/* houses in the background */}
    <g>
      <rect x="40" y="250" width="300" height="240" fill="#e7d8c6" />
      <polygon points="20,255 190,150 360,255" fill="#9f3a2a" />
      {windows(70, 290, 3, 2, 60, 55, 30, 40, [1, 3])}
      <rect x="170" y="410" width="50" height="80" fill="#6b4f3a" />

      <rect x="420" y="220" width="360" height="270" fill="#d9dee5" />
      <polygon points="400,226 600,120 800,226" fill="#475569" />
      {windows(450, 260, 4, 2, 58, 58, 26, 46, [0, 6])}

      <rect x="860" y="240" width="320" height="250" fill="#efe3d0" />
      <polygon points="840,246 1020,140 1200,246" fill="#8b3c2b" />
      {windows(890, 280, 3, 2, 64, 56, 34, 44, [2])}

      <rect x="1260" y="230" width="320" height="260" fill="#dde3ea" />
      <polygon points="1240,236 1420,130 1600,236" fill="#334155" />
      {windows(1290, 270, 3, 2, 64, 58, 34, 44, [4])}
    </g>

    {/* trees */}
    <g>
      {[
        [380, 430, 70],
        [820, 420, 64],
        [1220, 425, 60],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <rect x={x - 9} y={y} width="18" height="80" fill="#5b4636" />
          <circle cx={x} cy={y - 10} r={r} fill="#3f7d3a" />
          <circle cx={x - r * 0.55} cy={y + 8} r={r * 0.7} fill="#4a8f43" />
          <circle cx={x + r * 0.55} cy={y + 6} r={r * 0.72} fill="#357034" />
        </g>
      ))}
    </g>

    </g>
    {/* atmospheric haze over the far background */}
    <rect x="0" y="0" width="1600" height="500" fill="url(#ys-haze)" />

    {/* sidewalk + curb */}
    <rect x="0" y="490" width="1600" height="62" fill="#c9ccd1" />
    <rect x="0" y="548" width="1600" height="8" fill="#9ca3af" />

    {/* street */}
    <rect x="0" y="556" width="1600" height="200" fill="url(#ys-road)" />
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={i * 190 + 20} y="650" width="110" height="8" rx="3" fill="#f8fafc" opacity="0.85" />
    ))}

    {/* lamp post */}
    <rect x="1480" y="300" width="10" height="250" fill="#334155" />
    <rect x="1440" y="296" width="60" height="10" rx="4" fill="#334155" />
    <ellipse cx="1446" cy="310" rx="16" ry="6" fill="#fef3c7" />

    {/* person walking on the sidewalk */}
    <g transform="translate(690 410)">
      <circle cx="0" cy="0" r="13" fill="#e0b48f" />
      <rect x="-15" y="14" width="30" height="52" rx="10" fill="#1f2937" />
      <rect x="-13" y="62" width="11" height="44" rx="4" fill="#334155" transform="rotate(8 -7 62)" />
      <rect x="2" y="62" width="11" height="44" rx="4" fill="#334155" transform="rotate(-10 7 62)" />
      <rect x="-24" y="18" width="9" height="40" rx="4" fill="#1f2937" transform="rotate(14 -20 18)" />
      <rect x="15" y="18" width="9" height="40" rx="4" fill="#1f2937" transform="rotate(-12 19 18)" />
    </g>

    {/* soft shadows on the sidewalk */}
    <ellipse cx="380" cy="590" rx="300" ry="10" fill="#000" opacity="0.22" filter="url(#ys-soft)" />
    <ellipse cx="692" cy="518" rx="30" ry="6" fill="#000" opacity="0.3" filter="url(#ys-soft)" />

    {/* metal sliding gate */}
    <g>
      <rect x="120" y="430" width="520" height="12" fill="#1f2937" />
      <rect x="120" y="560" width="520" height="12" fill="#1f2937" />
      {Array.from({ length: 27 }, (_, i) => (
        <rect key={i} x={124 + i * 19.2} y="442" width="7" height="118" fill="#273244" />
      ))}
      <rect x="104" y="410" width="22" height="180" fill="#111827" />
      <rect x="634" y="410" width="22" height="180" fill="#111827" />
    </g>

    {/* parked car, front facing the camera */}
    <g>
      <ellipse cx="1170" cy="716" rx="200" ry="20" fill="#000" opacity="0.38" filter="url(#ys-soft)" />
      {/* roof + windshield */}
      <path d="M1060 600 Q1075 548 1120 540 L1222 540 Q1266 548 1282 600 Z" fill="url(#ys-car)" />
      <path d="M1076 600 Q1090 560 1126 554 L1216 554 Q1252 560 1266 600 Z" fill="url(#ys-glass)" />
      {/* body */}
      <rect x="1010" y="596" width="322" height="104" rx="26" fill="url(#ys-car)" />
      <rect x="1010" y="596" width="322" height="104" rx="26" fill="url(#ys-body-side)" />
      <path d="M1100 560 L1150 556 L1112 596 L1090 598 Z" fill="#ffffff" opacity="0.16" />
      <rect x="1040" y="612" width="262" height="3" rx="1.5" fill="#f8fafc" opacity="0.55" />
      {/* mirrors */}
      <rect x="994" y="598" width="26" height="16" rx="5" fill="#9ca3af" />
      <rect x="1322" y="598" width="26" height="16" rx="5" fill="#9ca3af" />
      {/* headlights */}
      <rect x="1028" y="618" width="70" height="20" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
      <rect x="1244" y="618" width="70" height="20" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
      {/* grille */}
      <rect x="1112" y="620" width="116" height="30" rx="8" fill="#1f2937" />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={1120} y={624 + i * 5} width="100" height="2" fill="#4b5563" />
      ))}
      {/* bumper */}
      <rect x="1018" y="686" width="306" height="16" rx="8" fill="#6b7280" />
      {/* licence plate — EU style, fictional number */}
      <g>
        <rect x="1128" y="666" width="84" height="22" rx="2" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
        <rect x="1128" y="666" width="12" height="22" rx="2" fill="#1d4ed8" />
        <text x="1176" y="682" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="14" fill="#111827" letterSpacing="0.5">
          B 123 XYZ
        </text>
      </g>
      {/* wheels peeking under the body */}
      <rect x="1030" y="698" width="44" height="18" rx="6" fill="#111827" />
      <rect x="1268" y="698" width="44" height="18" rx="6" fill="#111827" />
    </g>

    {/* driveway in the foreground */}
    <rect x="0" y="756" width="1600" height="144" fill="url(#ys-drive)" />
    {Array.from({ length: 12 }, (_, i) => (
      <line key={i} x1={i * 140} y1="756" x2={i * 140 - 60} y2="900" stroke="#8e939b" strokeWidth="3" />
    ))}
    <line x1="0" y1="820" x2="1600" y2="820" stroke="#8e939b" strokeWidth="3" />
  </g>
);

/**
 * Static hero orrery. Deliberately not a live scene: the home page should be
 * fast and must not imply tracking. Marker positions are illustrative only.
 */
export function Orrery() {
  const cx = 280;
  const cy = 280;

  const rings = [
    { r: 78, dashed: false, opacity: 0.16 },
    { r: 124, dashed: true, opacity: 0.14 },
    { r: 172, dashed: false, opacity: 0.12 },
    { r: 218, dashed: true, opacity: 0.1 },
    { r: 252, dashed: false, opacity: 0.08 },
  ];

  const markers = [
    { label: "EARTH ORBIT", sub: "1,075 objects", r: 124, angle: 208, color: "#55C8FF" },
    { label: "MOON", sub: "43 artefacts", r: 78, angle: 32, color: "#E5B45C" },
    { label: "MARS", sub: "15 sites", r: 172, angle: 338, color: "#E07A5F" },
    { label: "JUPITER", sub: "reference orbit", r: 218, angle: 118, color: "#C9A227" },
    { label: "VOYAGER 1", sub: "172.3 AU", r: 252, angle: 58, color: "#9B8CFF" },
  ];

  const points = markers.map((marker) => {
    const radians = (marker.angle * Math.PI) / 180;
    return {
      ...marker,
      x: cx + marker.r * Math.cos(radians),
      y: cy + marker.r * Math.sin(radians),
    };
  });

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-white/10 bg-ink-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(85,200,255,0.1),transparent_62%)]" />
      <svg viewBox="0 0 560 560" className="relative h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE2A8" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#E5B45C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#E5B45C" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g stroke="rgba(255,255,255,0.06)">
          {Array.from({ length: 12 }).map((_, index) => {
            const angle = (index * Math.PI) / 6;
            return (
              <line
                key={index}
                x1={cx + 34 * Math.cos(angle)}
                y1={cy + 34 * Math.sin(angle)}
                x2={cx + 260 * Math.cos(angle)}
                y2={cy + 260 * Math.sin(angle)}
              />
            );
          })}
        </g>

        {rings.map((ring) => (
          <circle
            key={ring.r}
            cx={cx}
            cy={cy}
            r={ring.r}
            fill="none"
            stroke="rgba(195,202,212,0.5)"
            strokeOpacity={ring.opacity}
            strokeWidth="1"
            strokeDasharray={ring.dashed ? "2 7" : undefined}
          />
        ))}

        <circle cx={cx} cy={cy} r="64" fill="url(#sunGlow)" />
        <circle cx={cx} cy={cy} r="6" fill="#F5E6C8" />
        <circle cx={cx} cy={cy} r="1.6" fill="#FFFAF0" />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="10" fill={point.color} fillOpacity="0.1" />
            <circle cx={point.x} cy={point.y} r="3.2" fill={point.color} />
            <line
              x1={point.x}
              y1={point.y}
              x2={point.x + (point.x - cx) * 0.07}
              y2={point.y + (point.y - cy) * 0.07}
              stroke={point.color}
              strokeOpacity="0.45"
            />
          </g>
        ))}

        <g fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing="1.6">
          {points.map((point) => {
            const right = point.x >= cx;
            return (
              <g key={`${point.label}-label`}>
                <text
                  x={point.x + (right ? 16 : -16)}
                  y={point.y - 4}
                  textAnchor={right ? "start" : "end"}
                  fill="#C3CAD4"
                  fillOpacity="0.9"
                >
                  {point.label}
                </text>
                <text
                  x={point.x + (right ? 16 : -16)}
                  y={point.y + 7}
                  textAnchor={right ? "start" : "end"}
                  fill="#6F7B8A"
                >
                  {point.sub.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>

        <g fontFamily="ui-monospace, monospace" fontSize="7.5" fill="#6F7B8A" letterSpacing="1.4">
          <text x="18" y="24">
            ORRERY · ILLUSTRATIVE
          </text>
          <text x="542" y="24" textAnchor="end">
            EPOCH 2026-11-14
          </text>
          <text x="18" y="542">
            NOT TO SCALE
          </text>
          <text x="542" y="542" textAnchor="end">
            SPACE ARCHIVE / 01
          </text>
        </g>

        <g stroke="rgba(255,255,255,0.18)">
          <line x1="18" y1="34" x2="58" y2="34" />
          <line x1="502" y1="34" x2="542" y2="34" />
          <line x1="18" y1="526" x2="58" y2="526" />
          <line x1="502" y1="526" x2="542" y2="526" />
        </g>
      </svg>
    </div>
  );
}

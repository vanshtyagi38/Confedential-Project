import { useState, useEffect, useRef } from "react";
import { Zap, RotateCw } from "lucide-react";

/* ─── 5 segments ─── */
export type Segment = {
  label: string;
  minutes: number;
  type: "minutes" | "free_spin" | "locked";
  weight: number;
  color: string;
  textColor: string;
  icon?: string;
};

export const SEGMENTS: Segment[] = [
  {
    label: "5 min",
    minutes: 5,
    type: "minutes",
    weight: 30,
    color: "hsl(348, 83%, 55%)",
    textColor: "#fff",
    icon: "⏱️",
  },
  {
    label: "10 min",
    minutes: 10,
    type: "minutes",
    weight: 25,
    color: "hsl(24, 95%, 56%)",
    textColor: "#fff",
    icon: "🔥",
  },
  {
    label: "6 min",
    minutes: 6,
    type: "minutes",
    weight: 20,
    color: "hsl(280, 70%, 58%)",
    textColor: "#fff",
    icon: "✨",
  },
  {
    label: "20 min",
    minutes: 20,
    type: "locked",
    weight: 10,
    color: "hsl(210, 80%, 50%)",
    textColor: "#fff",
    icon: "👑",
  },
  {
    label: "5 min",
    minutes: 5,
    type: "minutes",
    weight: 20,
    color: "hsl(348, 75%, 68%)",
    textColor: "#fff",
    icon: "💫",
  },
  {
    label: "Free\nSpin",
    minutes: 0,
    type: "free_spin",
    weight: 15,
    color: "hsl(150, 65%, 42%)",
    textColor: "#fff",
    icon: "🎡",
  },
];

/* ─── geometry helpers ─── */
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(
  cx: number,
  cy: number,
  r: number,
  s: number,
  e: number
) {
  const p1 = polar(cx, cy, r, s);
  const p2 = polar(cx, cy, r, e);
  const lg = e - s > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${lg} 1 ${p2.x} ${p2.y} Z`;
}

function midPoint(cx: number, cy: number, r: number, s: number, e: number) {
  return polar(cx, cy, r * 0.62, (s + e) / 2);
}

/* ─── precompute angles ─── */
const totalW = SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
export const segAngles = SEGMENTS.map((_, i) => {
  const before = SEGMENTS.slice(0, i).reduce((s, seg) => s + seg.weight, 0);
  const after = before + SEGMENTS[i].weight;
  return {
    start: (before / totalW) * 360,
    end: (after / totalW) * 360,
    center: ((before + after) / 2 / totalW) * 360,
  };
});

/* ─── component ─── */
type Props = {
  spinning: boolean;
  rotation: number;
  onSpinClick: () => void;
  disabled: boolean;
  hasReferral10: boolean;
};

const SpinWheel = ({
  spinning,
  rotation,
  onSpinClick,
  disabled,
  hasReferral10,
}: Props) => {
  const [idleAngle, setIdleAngle] = useState(0);
  const idleRef = useRef<number>();
  const timeRef = useRef(0);

  // idle wobble animation
  useEffect(() => {
    if (spinning) return;
    let raf: number;
    const animate = (t: number) => {
      if (!timeRef.current) timeRef.current = t;
      const elapsed = (t - timeRef.current) / 1000;
      setIdleAngle(Math.sin(elapsed * 1.2) * 8);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [spinning]);

  const currentRotation = spinning ? rotation : rotation + idleAngle;
  const CX = 160,
    CY = 160,
    R = 148;

  return (
    <div className="relative mb-2 select-none" onClick={onSpinClick}>
      {/* Outer glow ring */}
      <div className="absolute inset-[-8px] rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 blur-md" />

      {/* Pointer */}
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
        <div className="relative">
          <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-foreground drop-shadow-lg" />
          <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-l-[8px] border-r-[8px] border-t-[14px] border-l-transparent border-r-transparent border-t-primary/60" />
        </div>
      </div>

      {/* Wheel container */}
      <div
        className="relative h-80 w-80 cursor-pointer rounded-full"
        style={{
          transform: `rotate(${currentRotation}deg)`,
          transition: spinning
            ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
            : "none",
          filter: "drop-shadow(0 8px 32px hsl(var(--primary) / 0.25))",
        }}
      >
        {/* Outer ring */}
        <svg
          width="320"
          height="320"
          className="absolute inset-0"
          viewBox="0 0 320 320"
        >
          {/* Decorative outer ring */}
          <circle
            cx={CX}
            cy={CY}
            r={R + 6}
            fill="none"
            stroke="hsl(var(--foreground) / 0.1)"
            strokeWidth="3"
          />
          {/* Tick marks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * 10 * Math.PI) / 180 - Math.PI / 2;
            const r1 = R + 2;
            const r2 = R + 8;
            return (
              <line
                key={i}
                x1={CX + r1 * Math.cos(a)}
                y1={CY + r1 * Math.sin(a)}
                x2={CX + r2 * Math.cos(a)}
                y2={CY + r2 * Math.sin(a)}
                stroke="hsl(var(--foreground) / 0.15)"
                strokeWidth={i % 3 === 0 ? "2" : "1"}
              />
            );
          })}

          {/* Segments */}
          {SEGMENTS.map((seg, i) => {
            const isLocked = seg.type === "locked" && !hasReferral10;
            const { start, end } = segAngles[i];
            const mp = midPoint(CX, CY, R, start, end);
            const midAngle = (start + end) / 2;

            return (
              <g key={i}>
                {/* Slice */}
                <path
                  d={arc(CX, CY, R, start, end)}
                  fill={isLocked ? "hsl(var(--muted))" : seg.color}
                  stroke="hsl(var(--background))"
                  strokeWidth="2.5"
                  style={{
                    filter: isLocked ? "grayscale(0.7)" : "none",
                  }}
                />
                {/* Inner shadow arc for depth */}
                <path
                  d={arc(CX, CY, R * 0.95, start, end)}
                  fill="transparent"
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="1"
                />
                {/* Icon */}
                <text
                  x={polar(CX, CY, R * 0.8, midAngle).x}
                  y={polar(CX, CY, R * 0.8, midAngle).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="16"
                  className="select-none"
                >
                  {isLocked ? "🔒" : seg.icon}
                </text>
                {/* Label */}
                {seg.type === "free_spin" ? (
                  <>
                    <text
                      x={mp.x}
                      y={mp.y - 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={seg.textColor}
                      fontSize="12"
                      fontWeight="800"
                      className="select-none"
                    >
                      Free
                    </text>
                    <text
                      x={mp.x}
                      y={mp.y + 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={seg.textColor}
                      fontSize="12"
                      fontWeight="800"
                      className="select-none"
                    >
                      Spin
                    </text>
                  </>
                ) : (
                  <text
                    x={mp.x}
                    y={mp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isLocked ? "hsl(var(--muted-foreground))" : seg.textColor}
                    fontSize="13"
                    fontWeight="800"
                    className="select-none"
                  >
                    {isLocked ? "10+ inv" : seg.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Center button */}
        <div className="absolute left-1/2 top-1/2 flex h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-background bg-card shadow-elevated">
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;

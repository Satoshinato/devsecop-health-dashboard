"use client";

interface GaugeProps {
  value: number; // 0-100
  label: string;
  unit?: string;
  color?: string;
  size?: number;
}

export default function Gauge({ value, label, unit = "%", color = "#3b82f6", size = 80 }: GaugeProps) {
  const r = 32;
  const cx = 40;
  const cy = 40;
  const startAngle = 200;
  const sweep = 320;

  function polar(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(start: number, end: number, stroke: string, strokeW: number, opacity = 1) {
    const s = polar(start);
    const e = polar(end);
    const large = end - start > 180 ? 1 : 0;
    return (
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeW}
        strokeLinecap="round"
        opacity={opacity}
      />
    );
  }

  const endAngle = startAngle + (value / 100) * sweep;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 80 80" style={{ width: size, height: size }}>
        {arc(startAngle, startAngle + sweep, "#f1f5f9", 8)}
        {value > 0 && arc(startAngle, endAngle, color, 8)}
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
          {value}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="#94a3b8">
          {unit}
        </text>
      </svg>
      <span className="text-[11px] text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

"use client";

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

export default function DonutChart({
  data,
  size = 120,
  centerLabel,
  centerValue,
  className = "",
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 40;
  const cx = 55;
  const cy = 55;
  const stroke = 18;

  function polarToXY(angle: number, radius: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function slicePath(startAngle: number, endAngle: number, radius: number) {
    const start = polarToXY(startAngle, radius);
    const end = polarToXY(endAngle, radius);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg viewBox="0 0 110 110" style={{ width: size, height: size }}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {data.map((slice, i) => {
          if (slice.value === 0) return null;
          const startAngle =
            -90 + (data.slice(0, i).reduce((s, d) => s + d.value, 0) / (total || 1)) * 360;
          const angle = (slice.value / (total || 1)) * 360;
          return (
            <path
              key={i}
              d={slicePath(startAngle, startAngle + angle - 0.5, r)}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          );
        })}
        {/* Center */}
        {centerValue !== undefined && (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">
              {centerValue}
            </text>
            {centerLabel && (
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
                {centerLabel}
              </text>
            )}
          </>
        )}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {data.map((slice, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="text-[10px] text-slate-500">{slice.label} ({slice.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

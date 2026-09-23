"use client";

interface Point {
  label: string;
  value: number;
  value2?: number;
}

interface LineChartProps {
  data: Point[];
  height?: number;
  color?: string;
  color2?: string;
  label1?: string;
  label2?: string;
  showArea?: boolean;
  className?: string;
  minY?: number;
}

export default function LineChart({
  data,
  height = 120,
  color = "#3b82f6",
  color2 = "#10b981",
  label1 = "Principal",
  label2,
  showArea = true,
  className = "",
  minY = 0,
}: LineChartProps) {
  if (data.length < 2) return null;

  const vals = data.map(d => d.value);
  const vals2 = label2 ? data.map(d => d.value2 ?? 0) : [];
  const allVals = [...vals, ...vals2];
  const maxV = Math.max(...allVals, 1);
  const minV = Math.min(minY, ...allVals);

  const W = 300;
  const H = height - 24; // leave room for labels
  const pad = 8;

  const toX = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2);
  const toY = (v: number) => H - pad - ((v - minV) / (maxV - minV || 1)) * (H - pad * 2);

  const pathD = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.value)}`)
    .join(" ");

  const path2D = label2
    ? data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.value2 ?? 0)}`).join(" ")
    : "";

  const areaD = showArea
    ? `${pathD} L ${toX(data.length - 1)} ${H - pad} L ${toX(0)} ${H - pad} Z`
    : "";

  return (
    <div className={`flex flex-col ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={t}
            x1={pad} y1={pad + (1 - t) * (H - pad * 2)}
            x2={W - pad} y2={pad + (1 - t) * (H - pad * 2)}
            stroke="#e2e8f0" strokeWidth="1"
          />
        ))}
        {/* Area fill */}
        {showArea && (
          <path d={areaD} fill={color} fillOpacity="0.08" />
        )}
        {/* Second line */}
        {label2 && (
          <path d={path2D} fill="none" stroke={color2} strokeWidth="2" strokeLinejoin="round" />
        )}
        {/* Main line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.value)} r="3.5" fill={color} />
        ))}
        {label2 && data.map((d, i) => (
          <circle key={`b${i}`} cx={toX(i)} cy={toY(d.value2 ?? 0)} r="3" fill={color2} />
        ))}
        {/* Value labels on endpoints */}
        <text x={toX(0)} y={toY(vals[0]) - 6} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">
          {vals[0]}
        </text>
        <text x={toX(data.length - 1)} y={toY(vals[vals.length - 1]) - 6} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">
          {vals[vals.length - 1]}
        </text>
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between px-2">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-slate-400">{d.label}</span>
        ))}
      </div>
      {label2 && (
        <div className="flex gap-4 mt-1 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-500">{label1}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color2 }} />
            <span className="text-[10px] text-slate-500">{label2}</span>
          </div>
        </div>
      )}
    </div>
  );
}

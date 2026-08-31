"use client";

interface Bar {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: Bar[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
  horizontal?: boolean;
  className?: string;
}

export default function BarChart({
  data,
  maxValue,
  height = 160,
  showValues = true,
  horizontal = false,
  className = "",
}: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);

  if (horizontal) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {data.map((bar, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-32 text-xs text-right text-slate-500 shrink-0 truncate">
              {bar.label}
            </span>
            <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max((bar.value / max) * 100, 2)}%`,
                  backgroundColor: bar.color ?? "#3b82f6",
                }}
              >
                {showValues && bar.value > 0 && (
                  <span className="text-[10px] font-semibold text-white">{bar.value}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-1 ${className}`} style={{ height }}>
      {data.map((bar, i) => {
        const pct = max > 0 ? (bar.value / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
            {showValues && (
              <span className="text-[10px] font-semibold text-slate-600">{bar.value}</span>
            )}
            <div
              className="w-full rounded-t transition-all duration-500"
              style={{
                height: `${Math.max(pct, 2)}%`,
                backgroundColor: bar.color ?? "#3b82f6",
                minHeight: bar.value > 0 ? 4 : 0,
              }}
            />
            <span className="text-[9px] text-slate-400 text-center leading-tight max-w-full">
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

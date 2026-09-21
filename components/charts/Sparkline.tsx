"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Cuando la serie es toda cero se dibuja una línea plana al piso. */
  emptyColor?: string;
  className?: string;
}

export default function Sparkline({
  data,
  width = 96,
  height = 24,
  color = "#0f9b8e",
  emptyColor = "#cbd5e1",
  className = "",
}: SparklineProps) {
  if (data.length === 0) return null;

  const pad = 2;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const vacio = max === 0;
  const trazo = vacio ? emptyColor : color;

  const toX = (i: number) =>
    data.length === 1 ? width / 2 : pad + (i / (data.length - 1)) * (width - pad * 2);
  const toY = (v: number) => {
    if (max === min) return height - pad;
    return height - pad - ((v - min) / (max - min)) * (height - pad * 2);
  };

  const linea = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const area = `${linea} L ${toX(data.length - 1)} ${height - pad} L ${toX(0)} ${height - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width, height }}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {!vacio && <path d={area} fill={trazo} fillOpacity="0.16" />}
      <path d={linea} fill="none" stroke={trazo} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

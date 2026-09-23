"use client";

interface HeatmapRow {
  reviewer: { nombre: string; avatar: string };
  days: { date: string; count: number }[];
}

interface HeatmapProps {
  data: HeatmapRow[];
  className?: string;
  /** Encabezado de la primera columna. */
  rowLabel?: string;
  /** Sustantivo usado en el tooltip de cada celda. */
  unitLabel?: string;
}

const INTENSITY = [
  "bg-slate-100",
  "bg-blue-100",
  "bg-blue-300",
  "bg-blue-500",
  "bg-blue-700",
];

function intensityClass(count: number) {
  if (count === 0) return INTENSITY[0];
  if (count === 1) return INTENSITY[1];
  if (count === 2) return INTENSITY[2];
  if (count === 3) return INTENSITY[3];
  return INTENSITY[4];
}

export default function Heatmap({
  data,
  className = "",
  rowLabel = "Revisor",
  unitLabel = "revisión(es)",
}: HeatmapProps) {
  // Show last 28 days grouped in 4 weeks
  const days = data[0]?.days?.slice(-28) ?? [];

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="w-20 text-left font-medium text-slate-400 pb-1 pr-2">{rowLabel}</th>
            {days.map((d, i) => (
              <th
                key={i}
                className="w-5 font-normal text-slate-400 pb-1"
                title={d.date}
              >
                {i % 7 === 0
                  ? (() => { const [, mm, dd] = d.date.split("-"); return `${parseInt(dd)}/${parseInt(mm)}`; })()
                  : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri}>
              <td className="pr-2 py-0.5 whitespace-nowrap font-medium text-slate-600">
                {row.reviewer.avatar}
              </td>
              {row.days.slice(-28).map((d, di) => (
                <td key={di} className="py-0.5 px-px">
                  <div
                    className={`w-4 h-4 rounded-sm ${intensityClass(d.count)}`}
                    title={`${row.reviewer.nombre} — ${d.date}: ${d.count} ${unitLabel}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-1 mt-2">
        <span className="text-[10px] text-slate-400">Menos</span>
        {INTENSITY.map((cls, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-slate-400">Más</span>
      </div>
    </div>
  );
}

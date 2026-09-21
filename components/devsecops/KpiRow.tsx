import Sparkline from "@/components/charts/Sparkline";

export interface Kpi {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  /** "bueno" pinta el delta en verde, "malo" en rojo. */
  tonoDelta?: "bueno" | "malo" | "neutro";
  serie?: number[];
  destacado?: "riesgo" | "atencion";
}

const TONO_DELTA: Record<string, string> = {
  bueno: "text-emerald-600",
  malo: "text-rose-600",
  neutro: "text-slate-400",
};

function KpiCard({ kpi }: { kpi: Kpi }) {
  const borde =
    kpi.destacado === "riesgo"
      ? "border-rose-200"
      : kpi.destacado === "atencion"
        ? "border-amber-200"
        : "border-slate-200";

  const colorValor =
    kpi.destacado === "riesgo"
      ? "text-rose-700"
      : kpi.destacado === "atencion"
        ? "text-amber-700"
        : "text-slate-800";

  return (
    <div className={`flex-1 min-w-[170px] rounded-xl border bg-white px-4 py-3 shadow-sm ${borde}`}>
      <p className="text-[11px] text-slate-500">{kpi.label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <span className={`text-[30px] font-semibold leading-none ${colorValor}`}>{kpi.value}</span>
        {kpi.serie && <Sparkline data={kpi.serie} width={68} height={22} />}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {kpi.sub && <span className="text-[10px] text-slate-400">{kpi.sub}</span>}
        {kpi.delta && (
          <span className={`text-[10px] font-semibold ${TONO_DELTA[kpi.tonoDelta ?? "neutro"]}`}>
            {kpi.delta}
          </span>
        )}
      </div>
    </div>
  );
}

export default function KpiRow({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {kpis.map(kpi => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}

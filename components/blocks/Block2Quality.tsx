"use client";

import DonutChart from "@/components/charts/DonutChart";
import BarChart from "@/components/charts/BarChart";

interface Props {
  severityDist: { blocker: number; critical: number; major: number; minor: number; info: number };
  totalFindings: number;
  falsePositives: number;
  topCategories: { cat: string; count: number }[];
  qgPassRate: number;
}

const SEV_COLORS: Record<string, string> = {
  blocker:  "#dc2626",
  critical: "#ea580c",
  major:    "#ca8a04",
  minor:    "#4ade80",
  info:     "#94a3b8",
};

const SEV_LABELS: Record<string, string> = {
  blocker:  "Blocker",
  critical: "Critical",
  major:    "Major",
  minor:    "Minor",
  info:     "Info",
};

function StatPill({
  label, value, accent = "bg-slate-100 text-slate-600",
}: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center bg-slate-50 rounded-lg p-3 gap-0.5 min-w-24">
      <span className={`text-xl font-bold ${accent}`}>{value}</span>
      <span className="text-[10px] text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function Block2Quality({ severityDist, totalFindings, falsePositives, topCategories, qgPassRate }: Props) {
  const donutData = Object.entries(severityDist).map(([k, v]) => ({
    label: SEV_LABELS[k],
    value: v as number,
    color: SEV_COLORS[k],
  }));

  const densityPerReview = totalFindings > 0 ? (totalFindings / 37).toFixed(1) : "0";
  const fpRate = totalFindings > 0 ? Math.round((falsePositives / totalFindings) * 100) : 0;
  const accepted = donutData.reduce((s, d) => s + d.value, 0) - falsePositives;
  const acceptRate = totalFindings > 0 ? Math.round((accepted / totalFindings) * 100) : 0;
  const blockerCritical = severityDist.blocker + severityDist.critical;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <span className="text-base">🔬</span>
        Bloque 2 — Calidad de las Revisiones
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Severity donut */}
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-xs font-medium text-slate-500">Distribución por severidad</h3>
          <DonutChart
            data={donutData}
            size={130}
            centerValue={totalFindings}
            centerLabel="hallazgos"
          />
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-slate-500">Indicadores de calidad</h3>
          <div className="flex flex-wrap gap-2">
            <StatPill
              label="Densidad hallazgos / rev."
              value={densityPerReview}
              accent="text-blue-600"
            />
            <StatPill
              label="Tasa aceptación"
              value={`${acceptRate}%`}
              accent={acceptRate >= 75 ? "text-emerald-600" : "text-amber-600"}
            />
            <StatPill
              label="Falsos positivos"
              value={`${fpRate}%`}
              accent={fpRate > 10 ? "text-rose-600" : "text-slate-600"}
            />
            <StatPill
              label="Quality Gate"
              value={`${qgPassRate}%`}
              accent={qgPassRate >= 70 ? "text-emerald-600" : "text-rose-600"}
            />
          </div>

          {/* Blocker / Critical alert */}
          {blockerCritical > 0 && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-lg p-3">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <div className="text-xs font-semibold text-rose-700">
                  {blockerCritical} hallazgo{blockerCritical > 1 ? "s" : ""} críticos
                </div>
                <div className="text-[10px] text-rose-500 mt-0.5">
                  {severityDist.blocker} Blocker · {severityDist.critical} Critical — requieren atención inmediata
                </div>
              </div>
            </div>
          )}

          {/* Quality gate breakdown */}
          <div className="flex gap-2 mt-1">
            {[
              { label: "Passed", count: Math.round(37 * 0.51 * (qgPassRate / 100)), color: "bg-emerald-500" },
              { label: "Warning", count: 5, color: "bg-amber-400" },
              { label: "Failed", count: 4, color: "bg-rose-500" },
            ].map(qg => (
              <div key={qg.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${qg.color}`} />
                <span className="text-[10px] text-slate-500">{qg.label}: <strong>{qg.count}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Top categories */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-slate-500">Top categorías de hallazgos</h3>
          <BarChart
            data={topCategories.map(c => ({ label: c.cat.replace(/-/g, " "), value: c.count, color: "#8b5cf6" }))}
            horizontal
            height={200}
            className="flex-1"
          />
        </div>
      </div>
    </section>
  );
}

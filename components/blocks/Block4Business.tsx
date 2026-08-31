"use client";

import Gauge from "@/components/charts/Gauge";
import LineChart from "@/components/charts/LineChart";

interface Props {
  qgPassRate: number;
  complianceRate: number;
  deudaAhorrada: number;
  projectsAtRisk: string[];
  totalFindings: number;
}

const DEBT_TREND = [
  { label: "Sem -5", value: 3200 },
  { label: "Sem -4", value: 2800 },
  { label: "Sem -3", value: 2400 },
  { label: "Sem -2", value: 1950 },
  { label: "Sem -1", value: 1620 },
];

// ROI calculation: early detection costs ~1x effort; late detection ~6x
// Assume avg 30 min/finding saved, $85/h team cost
const COST_PER_MIN = 85 / 60;
const AVG_SAVED_MIN = 30;
const MULTIPLIER = 4.5;

interface RiskBadgeProps {
  project: string;
}

function RiskBadge({ project }: RiskBadgeProps) {
  return (
    <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
      <span className="text-xs text-rose-700 font-medium">{project}</span>
    </div>
  );
}

export default function Block4Business({
  qgPassRate, complianceRate, deudaAhorrada, projectsAtRisk, totalFindings,
}: Props) {
  const deudaH = Math.round(deudaAhorrada / 60);
  const roiEarly = Math.round(totalFindings * AVG_SAVED_MIN * COST_PER_MIN);
  const roiLate = Math.round(roiEarly * MULTIPLIER);
  const roiSaved = roiLate - roiEarly;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <span className="text-base">📊</span>
        Bloque 4 — Indicadores de Negocio
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Gauges */}
        <div className="flex flex-col gap-4 items-center md:items-start">
          <h3 className="text-xs font-medium text-slate-500 self-start">Compliance y calidad</h3>
          <div className="flex gap-4">
            <Gauge
              value={qgPassRate}
              label="Quality Gate OK"
              color={qgPassRate >= 70 ? "#10b981" : "#f59e0b"}
              size={90}
            />
            <Gauge
              value={complianceRate}
              label="Compliance OK"
              color={complianceRate >= 80 ? "#10b981" : complianceRate >= 60 ? "#f59e0b" : "#ef4444"}
              size={90}
            />
          </div>
        </div>

        {/* Technical debt trend */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <h3 className="text-xs font-medium text-slate-500">Tendencia de deuda técnica (minutos)</h3>
          <LineChart
            data={DEBT_TREND}
            height={130}
            color="#ef4444"
            showArea
          />
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <span className="text-emerald-600 text-sm font-bold">↓ {deudaH}h</span>
            <span className="text-xs text-emerald-600">de deuda técnica eliminada en el período</span>
          </div>
        </div>

        {/* ROI + Projects at risk */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-2">ROI detección temprana</h3>
            <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500">Costo detección temprana</span>
                <span className="text-xs font-semibold text-slate-700">${roiEarly.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500">Costo si se detecta tarde</span>
                <span className="text-xs font-semibold text-rose-600">${roiLate.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="text-[10px] font-semibold text-violet-700">Ahorro estimado</span>
                <span className="text-sm font-bold text-violet-700">${roiSaved.toLocaleString()}</span>
              </div>
              <p className="text-[9px] text-slate-400">*Modelo {MULTIPLIER}x: corrección tardía vs. temprana</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-2">
              Proyectos en riesgo
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
                {projectsAtRisk.length}
              </span>
            </h3>
            {projectsAtRisk.length === 0 ? (
              <div className="text-xs text-emerald-600 bg-emerald-50 rounded-lg p-2">
                ✅ Todos los proyectos están al día
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {projectsAtRisk.map(p => (
                  <RiskBadge key={p} project={p} />
                ))}
                <p className="text-[10px] text-slate-400 mt-1">
                  Sin revisión reciente o último Quality Gate fallido
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

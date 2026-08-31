"use client";

import Gauge from "@/components/charts/Gauge";
import BarChart from "@/components/charts/BarChart";

interface Props {
  avgTimeByType: { tipo: string; avgMin: number }[];
}

const TYPE_LABELS: Record<string, string> = {
  codigo:       "Código",
  documentacion:"Documentación",
  tests:        "Tests",
  seguridad:    "Seguridad",
  compliance:   "Compliance",
  sonarqube:    "SonarQube",
};

const TYPE_COLORS: Record<string, string> = {
  codigo:       "#3b82f6",
  documentacion:"#8b5cf6",
  tests:        "#10b981",
  seguridad:    "#ef4444",
  compliance:   "#f59e0b",
  sonarqube:    "#06b6d4",
};

// Simulated backlog aging data
const AGING = [
  { label: "< 1 día",  count: 3,  color: "#10b981" },
  { label: "1–3 días", count: 2,  color: "#f59e0b" },
  { label: "4–7 días", count: 1,  color: "#ef4444" },
  { label: "> 7 días", count: 0,  color: "#dc2626" },
];

function TimeCard({
  label, value, unit = "min", accent = "text-blue-600",
}: { label: string; value: number; unit?: string; accent?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 flex flex-col items-center gap-0.5">
      <span className={`text-2xl font-bold ${accent}`}>{value}</span>
      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{unit}</span>
      <span className="text-[10px] text-slate-500 text-center leading-tight mt-1">{label}</span>
    </div>
  );
}

export default function Block3Times({ avgTimeByType }: Props) {
  const overall = avgTimeByType.filter(t => t.avgMin > 0);
  const avgOverall = overall.length
    ? Math.round(overall.reduce((a, t) => a + t.avgMin, 0) / overall.length)
    : 0;

  // Efficiency score: inverse of avg time (lower = more efficient), normalized 0-100
  const maxTime = Math.max(...overall.map(t => t.avgMin), 1);
  const efficiencyScore = Math.round(100 - (avgOverall / maxTime) * 60);

  // Simulated values
  const firstCommentTime = 47;
  const devResponseTime = 2.3;
  const avgCycles = 1.5;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <span className="text-base">⏱️</span>
        Bloque 3 — Tiempos y Eficiencia
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gauges */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-medium text-slate-500">Métricas de tiempo</h3>
          <div className="grid grid-cols-2 gap-3">
            <TimeCard
              label="Tiempo prom. de revisión"
              value={avgOverall}
              unit="min"
              accent="text-blue-600"
            />
            <TimeCard
              label="Hasta primer comentario"
              value={firstCommentTime}
              unit="min"
              accent="text-violet-600"
            />
            <TimeCard
              label="Respuesta del equipo dev"
              value={devResponseTime}
              unit="días"
              accent={devResponseTime > 3 ? "text-rose-600" : "text-emerald-600"}
            />
            <TimeCard
              label="Ciclos promedio"
              value={avgCycles}
              unit="ciclos"
              accent={avgCycles > 2 ? "text-amber-600" : "text-emerald-600"}
            />
          </div>

          {/* Efficiency gauge */}
          <div className="flex justify-center mt-2">
            <Gauge
              value={efficiencyScore}
              label="Índice de eficiencia"
              color={efficiencyScore > 70 ? "#10b981" : efficiencyScore > 50 ? "#f59e0b" : "#ef4444"}
              size={90}
            />
          </div>
        </div>

        {/* Avg time by type */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-slate-500">Tiempo promedio por tipo de revisión</h3>
          <BarChart
            data={avgTimeByType.map(t => ({
              label: TYPE_LABELS[t.tipo] ?? t.tipo,
              value: t.avgMin,
              color: TYPE_COLORS[t.tipo] ?? "#94a3b8",
            }))}
            horizontal
            height={200}
          />
          <p className="text-[10px] text-slate-400 mt-1">Minutos desde inicio hasta cierre</p>
        </div>

        {/* Backlog aging */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-slate-500">Aging del backlog (revisiones abiertas)</h3>
          <div className="flex flex-col gap-2">
            {AGING.map(a => (
              <div key={a.label} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: a.color }}
                >
                  {a.count}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-slate-600">{a.label}</span>
                    <span className="text-[10px] text-slate-400">{a.count} tarea{a.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(a.count / 6) * 100}%`, backgroundColor: a.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-lg p-3 mt-1">
            <div className="text-xs font-semibold text-blue-700 mb-1">Carga diaria</div>
            <div className="grid grid-cols-5 gap-1">
              {["L","M","X","J","V"].map((d, i) => {
                const val = [2,3,1,2,1][i];
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <div
                      className="w-6 rounded-t bg-blue-300"
                      style={{ height: `${val * 10}px` }}
                    />
                    <span className="text-[9px] text-blue-400">{d}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-blue-400 mt-1">Revisiones por día (última semana)</p>
          </div>
        </div>
      </div>
    </section>
  );
}

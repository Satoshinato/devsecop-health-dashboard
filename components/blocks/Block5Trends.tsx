"use client";

import LineChart from "@/components/charts/LineChart";
import Heatmap from "@/components/charts/Heatmap";
import BarChart from "@/components/charts/BarChart";

interface DefectWeek { week: string; abiertos: number; cerrados: number }
interface VelocityWeek { week: string; count: number }
interface ScoreWeek { week: string; score: number }
interface HeatmapRow {
  reviewer: { nombre: string; avatar: string };
  days: { date: string; count: number }[];
}

interface Props {
  defectsByWeek: DefectWeek[];
  velocityByWeek: VelocityWeek[];
  scoreTrend: ScoreWeek[];
  heatmap: HeatmapRow[];
  topCategories: { cat: string; count: number }[];
}

export default function Block5Trends({
  defectsByWeek, velocityByWeek, scoreTrend, heatmap, topCategories,
}: Props) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <span className="text-base">📈</span>
        Bloque 5 — Tendencias y Progreso
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Burndown */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-slate-500">Burndown de defectos (por semana)</h3>
          <LineChart
            data={defectsByWeek.map(d => ({
              label: d.week,
              value: d.abiertos,
              value2: d.cerrados,
            }))}
            height={140}
            color="#ef4444"
            color2="#10b981"
            label2="Cerrados"
            showArea={false}
          />
          <p className="text-[10px] text-slate-400">Rojo: hallazgos abiertos · Verde: hallazgos cerrados</p>
        </div>

        {/* Velocity + Score */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-slate-500">Velocidad del equipo (revisiones cerradas / semana)</h3>
            <BarChart
              data={velocityByWeek.map(v => ({ label: v.week, value: v.count, color: "#3b82f6" }))}
              height={80}
              showValues
            />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-slate-500">Evolución del score QA (% hallazgos aceptados)</h3>
            <LineChart
              data={scoreTrend.map(s => ({ label: s.week, value: s.score }))}
              height={100}
              color="#8b5cf6"
              showArea
              minY={0}
            />
          </div>
        </div>

        {/* Heatmap */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <h3 className="text-xs font-medium text-slate-500">Mapa de actividad — Revisor × Día (últimas 4 semanas)</h3>
          <Heatmap data={heatmap} />
        </div>

        {/* Top recurrentes */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <h3 className="text-xs font-medium text-slate-500">
            Top hallazgos recurrentes
            <span className="ml-1 text-[10px] text-slate-400">(para planes de capacitación y mejora de estándares)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {topCategories.map((c, i) => (
              <div
                key={c.cat}
                className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5"
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: ["#3b82f6","#8b5cf6","#ef4444","#f59e0b","#10b981","#06b6d4","#ec4899","#64748b"][i % 8] }}
                >
                  {i + 1}
                </span>
                <div>
                  <div className="text-xs font-medium text-slate-700 capitalize">{c.cat.replace(/-/g, " ")}</div>
                  <div className="text-[10px] text-slate-400">{c.count} ocurrencia{c.count !== 1 ? "s" : ""}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Las categorías más frecuentes indican áreas donde el equipo de desarrollo necesita refuerzo o donde los estándares deben actualizarse.
          </p>
        </div>
      </div>
    </section>
  );
}

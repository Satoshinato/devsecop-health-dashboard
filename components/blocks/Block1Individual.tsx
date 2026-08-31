"use client";

import { REVIEWERS, reviewerStats } from "@/lib/data";
import BarChart from "@/components/charts/BarChart";

const TYPE_LABELS: Record<string, string> = {
  codigo: "Código",
  documentacion: "Docs",
  tests: "Tests",
  seguridad: "Segur.",
  compliance: "Comp.",
  sonarqube: "Sonar",
};

const TYPE_COLORS: Record<string, string> = {
  codigo:       "#3b82f6",
  documentacion:"#8b5cf6",
  tests:        "#10b981",
  seguridad:    "#ef4444",
  compliance:   "#f59e0b",
  sonarqube:    "#06b6d4",
};

export default function Block1Individual() {
  const stats = REVIEWERS.map(r => ({ reviewer: r, ...reviewerStats(r.id) }));
  const sorted = [...stats].sort((a, b) => b.cerradas - a.cerradas);

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <span className="text-base">👤</span>
        Bloque 1 — Productividad Individual
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left font-medium text-slate-500 pb-2 pr-3">Revisor</th>
              <th className="text-center font-medium text-slate-500 pb-2 px-2">Total</th>
              <th className="text-center font-medium text-slate-500 pb-2 px-2">Cerradas</th>
              <th className="text-center font-medium text-slate-500 pb-2 px-2">En curso</th>
              <th className="text-center font-medium text-slate-500 pb-2 px-2">Hallazgos</th>
              <th className="text-center font-medium text-slate-500 pb-2 px-2">Aceptados</th>
              <th className="text-center font-medium text-slate-500 pb-2 px-2">F. Positivos</th>
              <th className="text-center font-medium text-slate-500 pb-2 px-2">Reincidencias</th>
              <th className="text-center font-medium text-slate-500 pb-2 px-2">Ciclos prom.</th>
              <th className="text-center font-medium text-slate-500 pb-2 px-2">T. prom. (min)</th>
              <th className="text-left font-medium text-slate-500 pb-2 pl-3">Distribución por tipo</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const acceptPct = s.hallazgos > 0 ? Math.round((s.aceptados / s.hallazgos) * 100) : 0;
              return (
                <tr key={s.reviewer.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {s.reviewer.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-slate-700">{s.reviewer.nombre}</div>
                        {i === 0 && (
                          <div className="text-[9px] text-amber-500 font-semibold">★ Top revisor</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="font-semibold text-slate-700">{s.total}</span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="text-emerald-600 font-semibold">{s.cerradas}</span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className={s.abiertas > 0 ? "text-amber-500 font-semibold" : "text-slate-400"}>
                      {s.abiertas}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">{s.hallazgos}</td>
                  <td className="text-center py-3 px-2">
                    <span className={acceptPct >= 80 ? "text-emerald-600 font-semibold" : "text-slate-600"}>
                      {acceptPct}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className={s.falsos > 2 ? "text-rose-500 font-semibold" : "text-slate-400"}>
                      {s.falsos}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className={s.reincidencias > 2 ? "text-amber-500 font-semibold" : "text-slate-400"}>
                      {s.reincidencias}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className={s.avgCycles > 2 ? "text-rose-500" : "text-slate-600"}>
                      {s.avgCycles}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">{s.avgTimeMin || "—"}</td>
                  <td className="py-3 pl-3 min-w-52">
                    <BarChart
                      height={40}
                      showValues={false}
                      data={Object.entries(s.byType).map(([t, v]) => ({
                        label: TYPE_LABELS[t],
                        value: v as number,
                        color: TYPE_COLORS[t],
                      }))}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Type legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
        {Object.entries(TYPE_LABELS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TYPE_COLORS[k] }} />
            <span className="text-[10px] text-slate-500">{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

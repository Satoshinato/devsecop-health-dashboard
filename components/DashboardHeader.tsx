"use client";

interface DashboardHeaderProps {
  period: string;
}

export default function DashboardHeader({ period }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
            QA
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800">Tablero de Revisiones QA</h1>
            <p className="text-[10px] text-slate-400">Procesado por MCP de IA · Actualizado: {period}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {["Semana", "Mes", "Trimestre"].map((p, i) => (
              <button
                key={p}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  i === 1
                    ? "bg-white text-slate-700 shadow-sm font-medium"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            En vivo
          </div>

          <button
            className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
            onClick={() => window.print()}
          >
            🖨️ Exportar
          </button>
        </div>
      </div>
    </header>
  );
}

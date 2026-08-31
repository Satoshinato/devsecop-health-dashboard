"use client";

interface KpiCardProps {
  value: string | number;
  label: string;
  sub?: string;
  accent?: string;
  icon: string;
}

function KpiCard({ value, label, sub, accent = "bg-blue-50 text-blue-700", icon }: KpiCardProps) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex-1 min-w-36">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

interface KpiHeaderProps {
  total: number;
  cerradas: number;
  abiertas: number;
  qgPassRate: number;
  complianceRate: number;
  deudaAhorrada: number;
  totalFindings: number;
}

export default function KpiHeader({
  total, cerradas, abiertas, qgPassRate, complianceRate, deudaAhorrada, totalFindings,
}: KpiHeaderProps) {
  const deudaH = Math.round(deudaAhorrada / 60);
  return (
    <div className="flex flex-wrap gap-3">
      <KpiCard
        value={total}
        label="Revisiones totales"
        sub={`${cerradas} cerradas · ${abiertas} en curso`}
        icon="📋"
        accent="bg-blue-50 text-blue-700"
      />
      <KpiCard
        value={`${qgPassRate}%`}
        label="Quality Gates OK"
        sub="Proyectos con gate pasado"
        icon="✅"
        accent="bg-emerald-50 text-emerald-700"
      />
      <KpiCard
        value={`${complianceRate}%`}
        label="Compliance aprobado"
        sub="Artefactos que pasan norma"
        icon="🛡️"
        accent="bg-violet-50 text-violet-700"
      />
      <KpiCard
        value={totalFindings}
        label="Hallazgos registrados"
        sub="En todas las revisiones"
        icon="🔍"
        accent="bg-amber-50 text-amber-700"
      />
      <KpiCard
        value={`${deudaH}h`}
        label="Deuda técnica reducida"
        sub="Ahorro acumulado del equipo"
        icon="⚡"
        accent="bg-rose-50 text-rose-700"
      />
    </div>
  );
}

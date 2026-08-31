import DashboardHeader from "@/components/DashboardHeader";
import KpiHeader from "@/components/blocks/KpiHeader";
import Block1Individual from "@/components/blocks/Block1Individual";
import Block2Quality from "@/components/blocks/Block2Quality";
import Block3Times from "@/components/blocks/Block3Times";
import Block4Business from "@/components/blocks/Block4Business";
import Block5Trends from "@/components/blocks/Block5Trends";
import { teamSummary, activityHeatmap, scoreTrend } from "@/lib/data";

export default function DashboardPage() {
  const summary = teamSummary();
  const heatmap = activityHeatmap();
  const score = scoreTrend();

  const period = new Date().toLocaleDateString("es-AR", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader period={period} />

      <main className="max-w-screen-2xl mx-auto px-6 py-6 flex flex-col gap-6">
        <KpiHeader
          total={summary.total}
          cerradas={summary.cerradas}
          abiertas={summary.abiertas}
          qgPassRate={summary.qgPassRate}
          complianceRate={summary.complianceRate}
          deudaAhorrada={summary.deudaAhorrada}
          totalFindings={summary.totalFindings}
        />

        <Block1Individual />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Block2Quality
            severityDist={summary.severityDist}
            totalFindings={summary.totalFindings}
            falsePositives={summary.falsePositives}
            topCategories={summary.topCategories}
            qgPassRate={summary.qgPassRate}
          />
          <Block3Times avgTimeByType={summary.avgTimeByType} />
        </div>

        <Block4Business
          qgPassRate={summary.qgPassRate}
          complianceRate={summary.complianceRate}
          deudaAhorrada={summary.deudaAhorrada}
          projectsAtRisk={summary.projectsAtRisk}
          totalFindings={summary.totalFindings}
        />

        <Block5Trends
          defectsByWeek={summary.defectsByWeek}
          velocityByWeek={summary.velocityByWeek}
          scoreTrend={score}
          heatmap={heatmap}
          topCategories={summary.topCategories}
        />

        <footer className="text-center text-[10px] text-slate-400 py-4 border-t border-slate-200">
          Tablero de Revisiones QA · Datos procesados por MCP de IA ·{" "}
          <span className="font-medium">Período: últimos 30 días</span>
          {" · "}Los datos de muestra deben reemplazarse con la integración al MCP real.
        </footer>
      </main>
    </div>
  );
}

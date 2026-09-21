import BaseImagesPanel from "@/components/devsecops/BaseImagesPanel";
import CvePanel from "@/components/devsecops/CvePanel";
import DevSecOpsHeader from "@/components/devsecops/DevSecOpsHeader";
import KpiRow, { type Kpi } from "@/components/devsecops/KpiRow";
import SampleDataBanner from "@/components/devsecops/SampleDataBanner";
import { AdopcionPanel, QualityGatePanel, SeveridadesPanel } from "@/components/devsecops/SummaryPanels";
import { AdopcionPorScanPanel, DeudaYCriticosPanel } from "@/components/devsecops/TrendPanel";
import { HISTORIAL_SCANS } from "@/lib/devsecops-data";
import { resumenGlobal } from "@/lib/devsecops-metrics";

export default function PortadaEjecutivaPage() {
  const resumen = resumenGlobal();

  const kpis: Kpi[] = [
    {
      label: "Repos escaneados",
      value: `${resumen.reposConSonar}/${resumen.reposTotal}`,
      sub: `${resumen.adopcionSonar} % del inventario`,
      delta: `${resumen.deltaRepos >= 0 ? "+" : ""}${resumen.deltaRepos} vs. scan anterior`,
      tonoDelta: resumen.deltaRepos >= 0 ? "bueno" : "malo",
      serie: HISTORIAL_SCANS.map(s => s.reposConSonar),
    },
    {
      label: "Adopción SonarQube",
      value: `${resumen.adopcionSonar} %`,
      sub: `${resumen.proyectosConAdopcion} de ${resumen.proyectosTotal} proyectos`,
      destacado: "atencion",
    },
    {
      label: "Adopción Trivy",
      value: `${resumen.adopcionTrivy} %`,
      sub: `${resumen.reposConTrivy} repos con imagen escaneada`,
      serie: HISTORIAL_SCANS.map(s => s.reposConTrivy),
      destacado: "atencion",
    },
    {
      label: "Deuda técnica",
      value: `${resumen.deudaDias} d`,
      sub: "Suma del sqale_index",
      delta: `+${resumen.deltaDeudaDias} d`,
      tonoDelta: "malo",
      serie: HISTORIAL_SCANS.map(s => s.deudaDias),
    },
    {
      label: "CVE críticos abiertos",
      value: String(resumen.criticos),
      sub: `${resumen.altos} altos · ${resumen.medios} medios`,
      delta: `${resumen.deltaCriticos >= 0 ? "+" : ""}${resumen.deltaCriticos} vs. scan anterior`,
      tonoDelta: resumen.deltaCriticos <= 0 ? "bueno" : "malo",
      serie: HISTORIAL_SCANS.map(s => s.criticos),
      destacado: "riesgo",
    },
    {
      label: "Cobertura ponderada",
      value: `${resumen.cobertura.toLocaleString("es-AR")} %`,
      sub: `Código nuevo: ${resumen.coberturaNueva.toLocaleString("es-AR")} %`,
      serie: HISTORIAL_SCANS.map(s => s.cobertura),
      destacado: "atencion",
    },
  ];

  return (
    <>
      <DevSecOpsHeader
        titulo="Salud DevSecOps"
        subtitulo="Estado de calidad de código y seguridad de contenedores por proyecto de Azure DevOps"
      />
      <SampleDataBanner />

      <KpiRow kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <AdopcionPanel resumen={resumen} />
          <AdopcionPorScanPanel />
          <DeudaYCriticosPanel />
          <CvePanel />
        </div>
        <div className="flex flex-col gap-4">
          <BaseImagesPanel />
          <SeveridadesPanel resumen={resumen} />
          <QualityGatePanel />
        </div>
      </div>

      <footer className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
        Maqueta del tablero DevSecOps de Accusys · Todos los valores son de muestra · Los datos están
        centralizados en <code className="text-slate-500">lib/devsecops-data.ts</code>
      </footer>
    </>
  );
}

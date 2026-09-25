import BaseImagesPanel from "@/components/devsecops/BaseImagesPanel";
import CvePanel from "@/components/devsecops/CvePanel";
import DevSecOpsHeader from "@/components/devsecops/DevSecOpsHeader";
import KpiRow, { type Kpi } from "@/components/devsecops/KpiRow";
import { AdopcionPanel, QualityGatePanel, SeveridadesPanel } from "@/components/devsecops/SummaryPanels";
import { AdopcionPorScanPanel, DeudaYCriticosPanel } from "@/components/devsecops/TrendPanel";
import {
  cvesTransversales,
  historialScans,
  imagenesBasePorImpacto,
  resumenGlobal,
} from "@/lib/metrics";
import { cargarScans, scanActual } from "@/lib/scans";

export default function PortadaEjecutivaPage() {
  const scans = cargarScans();
  const actual = scanActual(scans);
  const historial = historialScans(scans);
  const resumen = resumenGlobal(scans);
  const imagenes = imagenesBasePorImpacto(scans);
  const cves = cvesTransversales(actual);

  const kpis: Kpi[] = [
    {
      label: "Repos escaneados",
      value: `${resumen.reposConSonar}/${resumen.reposTotal}`,
      sub: `${resumen.adopcionSonar} % del inventario`,
      delta: `${resumen.deltaRepos >= 0 ? "+" : ""}${resumen.deltaRepos} vs. scan anterior`,
      tonoDelta: resumen.deltaRepos >= 0 ? "bueno" : "malo",
      serie: historial.map(s => s.reposConSonar),
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
      sub: `${resumen.reposConTrivy} de ${resumen.reposConImagen} repos con imagen`,
      serie: historial.map(s => s.reposConTrivy),
      destacado: "atencion",
    },
    {
      label: "Deuda técnica",
      value: `${resumen.deudaDias} d`,
      sub: "Suma del sqale_index",
      delta: `${resumen.deltaDeudaDias >= 0 ? "+" : ""}${resumen.deltaDeudaDias} d`,
      tonoDelta: resumen.deltaDeudaDias > 0 ? "malo" : "bueno",
      serie: historial.map(s => s.deudaDias),
    },
    {
      label: "CVE críticos abiertos",
      value: String(resumen.criticos),
      sub: `${resumen.altos} altos · ${resumen.medios} medios`,
      delta: `${resumen.deltaCriticos >= 0 ? "+" : ""}${resumen.deltaCriticos} vs. scan anterior`,
      tonoDelta: resumen.deltaCriticos <= 0 ? "bueno" : "malo",
      serie: historial.map(s => s.criticos),
      destacado: "riesgo",
    },
    {
      label: "Cobertura ponderada",
      value: `${resumen.cobertura.toLocaleString("es-AR")} %`,
      sub: `Código nuevo: ${resumen.coberturaNueva.toLocaleString("es-AR")} %`,
      serie: historial.map(s => s.cobertura),
      destacado: "atencion",
    },
  ];

  return (
    <>
      <DevSecOpsHeader
        subtitulo="Portada ejecutiva · deuda técnica, calidad de código y seguridad de contenedores por proyecto de Azure DevOps"
        historial={historial}
        fechaScan={actual.fecha}
      />

      <KpiRow kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <AdopcionPanel resumen={resumen} />
          <AdopcionPorScanPanel historial={historial} />
          <DeudaYCriticosPanel historial={historial} />
          <CvePanel cves={cves} />
        </div>
        <div className="flex flex-col gap-4">
          <BaseImagesPanel imagenes={imagenes} />
          <SeveridadesPanel resumen={resumen} />
          <QualityGatePanel />
        </div>
      </div>

      <footer className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
        DevSecOps health (Deuda Técnica) · Accusys · snapshot {actual.fecha} · datos en{" "}
        <code className="text-slate-500">data/scans/</code>
      </footer>
    </>
  );
}

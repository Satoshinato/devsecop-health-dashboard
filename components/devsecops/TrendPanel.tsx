import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import Panel from "@/components/devsecops/Panel";
import { HISTORIAL_SCANS } from "@/lib/devsecops-data";
import { etiquetaFecha } from "@/lib/devsecops-metrics";

export function AdopcionPorScanPanel() {
  return (
    <Panel title="Tendencia" hint={`Últimos ${HISTORIAL_SCANS.length} scans`}>
      <p className="mb-2 text-[11px] text-slate-500">
        Repos con análisis de SonarQube en cada scan. Cada scan diario produce un snapshot
        inmutable, así la tendencia sale sin base de datos.
      </p>
      <BarChart
        height={190}
        data={HISTORIAL_SCANS.map(scan => ({
          label: etiquetaFecha(scan.fecha),
          value: scan.reposConSonar,
          color: "#0f9b8e",
        }))}
      />
    </Panel>
  );
}

export function DeudaYCriticosPanel() {
  return (
    <Panel title="Deuda técnica y CVE críticos por scan" hint="Días de deuda · CVE críticos">
      <LineChart
        height={170}
        color="#7c3aed"
        color2="#e11d48"
        label2="CVE críticos"
        showArea
        data={HISTORIAL_SCANS.map(scan => ({
          label: etiquetaFecha(scan.fecha),
          value: scan.deudaDias,
          value2: scan.criticos,
        }))}
      />
      <p className="mt-2 text-[10px] text-slate-400">
        La deuda crece porque se suman repos al análisis, no porque el código empeore. Es el efecto
        esperado mientras avanza la adopción.
      </p>
    </Panel>
  );
}

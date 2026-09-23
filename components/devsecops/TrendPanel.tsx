import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import Panel from "@/components/devsecops/Panel";
import type { ScanHistorico } from "@/lib/metrics";
import { etiquetaFecha } from "@/lib/metrics";

export function AdopcionPorScanPanel({ historial }: { historial: ScanHistorico[] }) {
  return (
    <Panel title="Tendencia" hint={`Últimos ${historial.length} scans`}>
      <p className="mb-2 text-[11px] text-slate-500">
        Repos con análisis de SonarQube en cada scan. Cada scan diario produce un snapshot
        inmutable, así la tendencia sale sin base de datos.
      </p>
      <BarChart
        height={190}
        fillHeight
        data={historial.map(scan => ({
          label: etiquetaFecha(scan.fecha),
          value: scan.reposConSonar,
          color: "#0f9b8e",
        }))}
      />
    </Panel>
  );
}

export function DeudaYCriticosPanel({ historial }: { historial: ScanHistorico[] }) {
  return (
    <Panel title="Deuda técnica y CVE críticos por scan" hint="Escalas independientes">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-[11px] font-medium text-slate-500">Deuda técnica (días)</h3>
          <LineChart
            height={150}
            color="#7c3aed"
            showArea
            data={historial.map(scan => ({
              label: etiquetaFecha(scan.fecha),
              value: scan.deudaDias,
            }))}
          />
        </div>
        <div>
          <h3 className="mb-1 text-[11px] font-medium text-slate-500">CVE críticos abiertos</h3>
          <LineChart
            height={150}
            color="#e11d48"
            showArea
            data={historial.map(scan => ({
              label: etiquetaFecha(scan.fecha),
              value: scan.criticos,
            }))}
          />
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">
        Las dos series van en gráficos separados a propósito: comparten un rango muy distinto y en un
        eje común la curva de críticos queda aplastada contra el piso. La deuda crece porque se suman
        repos al análisis, no porque el código empeore.
      </p>
    </Panel>
  );
}

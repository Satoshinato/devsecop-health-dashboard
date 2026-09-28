import DonutChart from "@/components/charts/DonutChart";
import Gauge from "@/components/charts/Gauge";
import Panel from "@/components/devsecops/Panel";
import type { ResumenGlobal } from "@/lib/metrics";
import { formatearNumero } from "@/lib/metrics";
import { ALCANCE_TRIVY, QUALITY_GATE } from "@/lib/quality-gate";

export function AdopcionPanel({ resumen }: { resumen: ResumenGlobal }) {
  return (
    <Panel title="Adopción y cobertura" hint="Sobre el inventario real de Azure DevOps">
      <div className="flex flex-wrap items-start justify-around gap-4 py-1">
        <Gauge
          value={resumen.adopcionSonar}
          label={`Adopción SonarQube (${resumen.reposConSonar}/${resumen.reposTotal} repos)`}
          color="#0f9b8e"
          size={92}
        />
        <Gauge
          value={resumen.adopcionTrivy}
          label={`Adopción Trivy (${resumen.reposConTrivy}/${resumen.reposConImagen} con imagen)`}
          color="#2563eb"
          size={92}
        />
        <Gauge
          value={Math.round(resumen.cobertura)}
          label="Cobertura ponderada"
          color="#f59e0b"
          size={92}
        />
        <Gauge
          value={Math.round(resumen.coberturaNueva)}
          label="Cobertura código nuevo"
          color="#7c3aed"
          size={92}
        />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-slate-100 pt-3 text-[11px] sm:grid-cols-4">
        <div>
          <dt className="text-slate-400">Proyectos</dt>
          <dd className="font-semibold text-slate-700">
            {resumen.proyectosConAdopcion} de {resumen.proyectosTotal} con adopción
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Sin adopción</dt>
          <dd className="font-semibold text-rose-600">{resumen.proyectosSinAdopcion} proyectos</dd>
        </div>
        <div>
          <dt className="text-slate-400">Líneas analizadas</dt>
          <dd className="font-semibold text-slate-700">{formatearNumero(resumen.ncloc)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Repos que publican imagen</dt>
          <dd className="font-semibold text-slate-700">
            {resumen.reposConImagen} de {resumen.reposInventario}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[10px] text-slate-400">
        La adopción de Trivy se mide solo contra los repos que publican imagen de contenedor: las
        librerías no generan imagen y bajarían el porcentaje sin motivo.
      </p>
    </Panel>
  );
}

export function SeveridadesPanel({ resumen }: { resumen: ResumenGlobal }) {
  const total = resumen.criticos + resumen.altos + resumen.medios + resumen.bajos;
  return (
    <Panel title="Vulnerabilidades por severidad" hint={`Trivy Fase 1 · ${ALCANCE_TRIVY.toLowerCase()}`}>
      <div className="flex items-center gap-4">
        <DonutChart
          size={128}
          centerValue={total}
          centerLabel="hallazgos"
          data={[
            { label: "Críticas", value: resumen.criticos, color: "#e11d48" },
            { label: "Altas", value: resumen.altos, color: "#f97316" },
            { label: "Medias", value: resumen.medios, color: "#fbbf24" },
            { label: "Bajas", value: resumen.bajos, color: "#94a3b8" },
          ]}
        />
        <ul className="flex-1 space-y-1.5 text-[11px]">
          <li className="flex justify-between">
            <span className="text-slate-500">Repos con Quality Gate en verde</span>
            <span className="font-semibold text-emerald-600">{resumen.gatesOk}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-500">Repos con Quality Gate en rojo</span>
            <span className="font-semibold text-rose-600">{resumen.gatesError}</span>
          </li>
          <li className="flex justify-between border-t border-slate-100 pt-1.5">
            <span className="text-slate-500">CVE críticos abiertos</span>
            <span className="font-semibold text-rose-600">{resumen.criticos}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-500">Deuda técnica acumulada</span>
            <span className="font-semibold text-slate-700">{resumen.deudaDias} días</span>
          </li>
        </ul>
      </div>
    </Panel>
  );
}

export function QualityGatePanel() {
  return (
    <Panel title={QUALITY_GATE.nombre} hint={QUALITY_GATE.alcance}>
      <table className="w-full text-[11px]">
        <tbody>
          {QUALITY_GATE.condiciones.map(condicion => (
            <tr key={condicion.metrica} className="border-b border-slate-100 last:border-0">
              <td className="py-1.5 pr-2 text-slate-600">{condicion.metrica}</td>
              <td className="py-1.5 pr-2 text-slate-400">{condicion.operador}</td>
              <td className="py-1.5 text-right font-semibold text-slate-700">{condicion.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-slate-400">
        Gate propio de QA, no el default de SonarQube. Todas las condiciones aplican sobre código
        nuevo, así que sin reporte de cobertura publicado el gate falla con 0 %.
      </p>
    </Panel>
  );
}

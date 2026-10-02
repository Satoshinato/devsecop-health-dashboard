"use client";

import BaseImagesPanel from "@/components/devsecops/BaseImagesPanel";
import DevSecOpsHeader from "@/components/devsecops/DevSecOpsHeader";
import KpiRow, { type Kpi } from "@/components/devsecops/KpiRow";
import Panel from "@/components/devsecops/Panel";
import ProjectsTable from "@/components/devsecops/ProjectsTable";
import { filasProyectos, historialScans, imagenesBasePorImpacto, resumenGlobal } from "@/lib/metrics";
import { scanActual } from "@/lib/history";
import DataStatus from "@/components/devsecops/DataStatus";
import { useDashboardData } from "@/lib/use-dashboard-data";

export default function RankingClient() {
  const state = useDashboardData();
  if (state.status !== "ok") return <DataStatus state={state} />;

  const scans = state.scans;
  const actual = scanActual(scans);
  const historial = historialScans(scans);
  const filas = filasProyectos(actual, scans);
  const resumen = resumenGlobal(scans);
  const imagenes = imagenesBasePorImpacto(scans);

  const peorDeuda = [...filas]
    .filter(f => f.reposConSonar > 0)
    .sort((a, b) => b.deudaPor1kLineas - a.deudaPor1kLineas)[0];
  const masCriticos = [...filas].sort((a, b) => b.criticos - a.criticos)[0];

  const kpis: Kpi[] = [
    {
      label: "Proyectos en el inventario",
      value: String(resumen.proyectosTotal),
      sub: `${resumen.reposInventario} repos en Azure DevOps (${resumen.reposTotal} en alcance Sonar)`,
    },
    {
      label: "Con adopción iniciada",
      value: String(resumen.proyectosConAdopcion),
      sub: `${resumen.adopcionSonar} % de los repos analizados`,
    },
    {
      label: "Sin adopción",
      value: String(resumen.proyectosSinAdopcion),
      sub: "Ningún repo con Sonar ni Trivy",
      destacado: "riesgo",
    },
    {
      label: "Peor deuda normalizada",
      value: peorDeuda ? `${peorDeuda.deudaPor1kLineas} min` : "—",
      sub: peorDeuda ? `${peorDeuda.nombre} · por 1k líneas` : "Sin datos",
      destacado: "atencion",
    },
    {
      label: "Más CVE críticos",
      value: masCriticos ? String(masCriticos.criticos) : "—",
      sub: masCriticos?.nombre,
      destacado: "riesgo",
    },
  ];

  return (
    <>
      <DevSecOpsHeader
        subtitulo="Ranking de proyectos · ordenado por deuda cada 1.000 líneas, ordenable por cualquier columna"
        historial={historial}
        fechaScan={actual.fecha}
      />

      <KpiRow kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Proyectos" hint={`${filas.length} proyectos`}>
          <ProjectsTable filas={filas} buscador />
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Cómo leer esta tabla">
            <ul className="space-y-2 text-[11px] text-slate-600">
              <li>
                <strong className="font-semibold text-slate-700">Deuda / 1k líneas</strong> =
                minutos de <code>sqale_index</code> cada 1.000 líneas, y es el orden por defecto.
                Permite comparar Probatch (35 repos) con Afrodita (5 repos) sin que el tamaño domine
                el ranking. La deuda total usa jornadas de 8 h.
              </li>
              <li>
                <strong className="font-semibold text-slate-700">Adopción</strong> = repos con
                proyecto en SonarQube sobre el total de repos que Azure DevOps reporta para ese
                proyecto. Es el indicador de avance del plan.
              </li>
              <li>
                <strong className="font-semibold text-slate-700">Actividad</strong> = repos
                analizados en cada uno de los últimos scans. Una línea plana en cero es un proyecto
                que todavía no arrancó.
              </li>
              <li>
                <strong className="font-semibold text-slate-700">Críticos Trivy</strong> = CVE de
                severidad crítica en las imágenes de contenedor del proyecto, sumados por repo.
              </li>
              <li className="border-t border-slate-100 pt-2 text-slate-500">
                Los nombres van siempre completos. Hacer clic en el nombre abre el detalle con el
                desglose por repo.
              </li>
            </ul>
          </Panel>

          <BaseImagesPanel imagenes={imagenes} limite={6} />
        </div>
      </div>

      <footer className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
        DevSecOps health (Deuda Técnica) · Accusys · snapshot {actual.fecha}
      </footer>
    </>
  );
}

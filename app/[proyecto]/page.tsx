import { notFound } from "next/navigation";
import DevSecOpsHeader from "@/components/devsecops/DevSecOpsHeader";
import Panel from "@/components/devsecops/Panel";
import ProjectDetailPanel from "@/components/devsecops/ProjectDetailPanel";
import ProjectsTable from "@/components/devsecops/ProjectsTable";
import { buscarProyecto, filasProyectos, historialScans } from "@/lib/metrics";
import { cargarScans, scanActual } from "@/lib/scans";

export const dynamicParams = false;

export function generateStaticParams() {
  const actual = scanActual(cargarScans());
  return actual.projects.map(proyecto => ({ proyecto: proyecto.key }));
}

export default async function DetalleProyectoPage({
  params,
}: {
  params: Promise<{ proyecto: string }>;
}) {
  const { proyecto } = await params;
  const scans = cargarScans();
  const actual = scanActual(scans);
  const historial = historialScans(scans);
  const fila = buscarProyecto(actual, proyecto, scans);
  if (!fila) notFound();

  return (
    <>
      <DevSecOpsHeader
        subtitulo={`Detalle de proyecto · ${fila.nombre} · ruta propia y enlazable, con la lista al costado para no perder el contexto del ranking`}
        historial={historial}
        fechaScan={actual.fecha}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Panel title="Proyectos" hint="Clic para cambiar">
          <ProjectsTable filas={filasProyectos(actual, scans)} seleccionada={fila.key} compacta />
        </Panel>

        <ProjectDetailPanel
          fila={fila}
          historial={historial}
        />
      </div>

      <footer className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
        DevSecOps health (Deuda Técnica) · Accusys · snapshot {actual.fecha}
      </footer>
    </>
  );
}

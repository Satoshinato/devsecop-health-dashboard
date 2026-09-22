import { notFound } from "next/navigation";
import DevSecOpsHeader from "@/components/devsecops/DevSecOpsHeader";
import Panel from "@/components/devsecops/Panel";
import ProjectDetailPanel from "@/components/devsecops/ProjectDetailPanel";
import ProjectsTable from "@/components/devsecops/ProjectsTable";
import SampleDataBanner from "@/components/devsecops/SampleDataBanner";
import { PROYECTOS } from "@/lib/devsecops-data";
import { buscarProyecto, filasProyectos } from "@/lib/devsecops-metrics";

// El export estático exige conocer todas las rutas en build y no admite params fuera de la lista.
export const dynamicParams = false;

export function generateStaticParams() {
  return PROYECTOS.map(proyecto => ({ proyecto: proyecto.key }));
}

export default async function DetalleProyectoPage(
  props: PageProps<"/devsecops/proyectos/[proyecto]">
) {
  const { proyecto } = await props.params;
  const fila = buscarProyecto(proyecto);
  if (!fila) notFound();

  return (
    <>
      <DevSecOpsHeader subtitulo={`Detalle de proyecto · ${fila.nombre} · ruta propia y enlazable, con la lista al costado para no perder el contexto del ranking`} />
      <SampleDataBanner />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Panel title="Proyectos" hint="Clic para cambiar">
          <ProjectsTable filas={filasProyectos()} seleccionada={fila.key} compacta />
        </Panel>

        <ProjectDetailPanel fila={fila} />
      </div>

      <footer className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
        Maqueta del tablero DevSecOps de Accusys · Todos los valores son de muestra · Los datos están
        centralizados en <code className="text-slate-500">lib/devsecops-data.ts</code>
      </footer>
    </>
  );
}

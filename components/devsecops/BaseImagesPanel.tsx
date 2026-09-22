import Sparkline from "@/components/charts/Sparkline";
import Panel from "@/components/devsecops/Panel";
import { imagenesBasePorImpacto } from "@/lib/devsecops-metrics";

/**
 * Análogo de "Widespread dependencies" del tablero de obsolescencia. Se ordena
 * por CVE críticos × repos afectados: actualizar una imagen muy difundida con
 * pocos críticos baja más riesgo que una imagen aislada con muchos.
 */
export default function BaseImagesPanel({ limite = 8 }: { limite?: number }) {
  const imagenes = imagenesBasePorImpacto();

  return (
    <Panel
      title="Top hallazgos transversales"
      hint={`Top ${Math.min(limite, imagenes.length)} por impacto`}
      bodyClassName="flex flex-col"
    >
      <p className="mb-2 text-[11px] text-slate-500">
        Imágenes base de contenedor ordenadas por <strong>CVE críticos × repos afectados</strong>.
        Actualizar una imagen baja el riesgo de todos los repos que la usan de una sola vez.
      </p>
      <ul className="divide-y divide-slate-100">
        {imagenes.slice(0, limite).map(imagen => (
          <li key={imagen.imagen} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-teal-700">{imagen.imagen}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {imagen.criticosUnicos} críticos · {imagen.reposAfectados} repositorios ·{" "}
                {imagen.proyectosAfectados} proyectos
                {imagen.finDeSoporte && (
                  <span className="ml-1.5 rounded bg-rose-100 px-1.5 py-px font-semibold text-rose-700">
                    fin de soporte
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-[13px] font-semibold text-rose-600">{imagen.impacto}</span>
              <Sparkline data={imagen.tendencia} width={84} height={20} color="#e11d48" />
              <span className="text-[9px] text-slate-400">
                {imagen.criticosUnicos} × {imagen.reposAfectados}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

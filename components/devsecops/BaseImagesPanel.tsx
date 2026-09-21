import Sparkline from "@/components/charts/Sparkline";
import Panel from "@/components/devsecops/Panel";
import { IMAGENES_BASE } from "@/lib/devsecops-data";

/**
 * Análogo de "Widespread dependencies" del tablero de obsolescencia: las imágenes
 * base que concentran más CVE críticos son el dato más accionable, porque
 * arreglar una sola imagen baja el riesgo de varios proyectos a la vez.
 */
export default function BaseImagesPanel({ limite = 8 }: { limite?: number }) {
  return (
    <Panel
      title="Top hallazgos transversales"
      hint={`Top ${Math.min(limite, IMAGENES_BASE.length)}`}
      bodyClassName="flex flex-col"
    >
      <p className="mb-2 text-[11px] text-slate-500">
        Imágenes base que concentran CVE críticos. Actualizar una imagen baja el riesgo de todos los
        repos que la usan.
      </p>
      <ul className="divide-y divide-slate-100">
        {IMAGENES_BASE.slice(0, limite).map(imagen => (
          <li key={imagen.imagen} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-teal-700">{imagen.imagen}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {imagen.reposAfectados} repositorios · {imagen.proyectosAfectados} proyectos
                {imagen.finDeSoporte && (
                  <span className="ml-1.5 rounded bg-rose-100 px-1.5 py-px font-semibold text-rose-700">
                    fin de soporte
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-[11px] font-semibold text-rose-600">
                {imagen.criticosUnicos} críticos
              </span>
              <Sparkline data={imagen.tendencia} width={84} height={20} color="#e11d48" />
              <span className="text-[9px] text-slate-400">{imagen.altosUnicos} altos</span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

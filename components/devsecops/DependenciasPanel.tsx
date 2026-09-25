import Panel from "@/components/devsecops/Panel";
import type { DependenciaTransversal } from "@/lib/metrics";

function etiquetaKind(kind: DependenciaTransversal["kind"]): string {
  return kind === "eol" ? "Fin de soporte" : "Deprecada";
}

function colorKind(kind: DependenciaTransversal["kind"]): string {
  return kind === "eol" ? "text-rose-600" : "text-amber-600";
}

export default function DependenciasPanel({
  dependencias,
  scanDate,
  pipelineUrl,
}: {
  dependencias: DependenciaTransversal[];
  scanDate?: string;
  pipelineUrl?: string;
}) {
  return (
    <Panel
      title="Dependencias en más de un repo"
      hint={
        scanDate
          ? `Dependency Health · scan ${scanDate}${
              pipelineUrl ? " · enlace al pipeline Renovate" : ""
            }`
          : "Fin de soporte o deprecadas (Renovate)"
      }
    >
      {pipelineUrl && scanDate && (
        <p className="mb-3 text-[10px] text-slate-500">
          Datos de{" "}
          <a
            href={pipelineUrl}
            className="font-medium text-teal-700 underline decoration-teal-300 underline-offset-2"
          >
            Renovate ({scanDate})
          </a>
          . Solo repos con manifiestos de dependencias detectados.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3 text-left font-medium">Tipo</th>
              <th className="pb-2 pr-3 text-left font-medium">Dependencia</th>
              <th className="pb-2 pr-3 text-left font-medium">Gestor</th>
              <th className="pb-2 pr-3 text-right font-medium">Repos</th>
              <th className="pb-2 text-left font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {dependencias.slice(0, 15).map(dep => (
              <tr
                key={`${dep.kind}-${dep.depName}-${dep.version}-${dep.source}`}
                className="border-b border-slate-100"
              >
                <td className="py-2 pr-3">
                  <span className={`text-[10px] font-semibold ${colorKind(dep.kind)}`}>
                    {etiquetaKind(dep.kind)}
                  </span>
                </td>
                <td className="py-2 pr-3 font-medium text-teal-700">
                  {dep.depName}{" "}
                  <span className="font-normal text-slate-400">{dep.version}</span>
                </td>
                <td className="py-2 pr-3 text-slate-500">{dep.source}</td>
                <td className="py-2 pr-3 text-right font-semibold text-slate-700">
                  {dep.reposAfectados}
                </td>
                <td className="max-w-xs truncate py-2 text-[10px] text-slate-500" title={dep.detail}>
                  {dep.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dependencias.length === 0 && (
          <p className="py-4 text-center text-[11px] text-slate-400">
            Ninguna dependencia problemática aparece en más de un repo en este scan.
          </p>
        )}
      </div>
    </Panel>
  );
}

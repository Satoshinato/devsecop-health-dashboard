import Panel from "@/components/devsecops/Panel";
import { SeverityPill } from "@/components/devsecops/Badges";
import type { CveTransversal } from "@/lib/metrics";

export default function CvePanel({ cves }: { cves: CveTransversal[] }) {
  return (
    <Panel title="CVE presentes en más de un repo" hint="Ordenado por repos afectados">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3 text-left font-medium">Severidad</th>
              <th className="pb-2 pr-3 text-left font-medium">CVE</th>
              <th className="pb-2 pr-3 text-left font-medium">Paquete</th>
              <th className="pb-2 pr-3 text-right font-medium">Repos</th>
              <th className="pb-2 pr-3 text-left font-medium">Corregido en</th>
              <th className="pb-2 text-left font-medium">Fix</th>
            </tr>
          </thead>
          <tbody>
            {cves.map(cve => (
              <tr key={cve.cve} className="border-b border-slate-100">
                <td className="py-2 pr-3">
                  <SeverityPill severidad={cve.severidad} />
                </td>
                <td className="py-2 pr-3 font-medium text-teal-700">{cve.cve}</td>
                <td className="py-2 pr-3 text-slate-600">
                  {cve.paquete} <span className="text-slate-400">{cve.version}</span>
                </td>
                <td className="py-2 pr-3 text-right font-semibold text-slate-700">{cve.reposAfectados}</td>
                <td className="py-2 pr-3 text-slate-500">
                  {cve.versionCorregida ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="py-2">
                  {cve.versionCorregida ? (
                    <span className="text-[10px] font-semibold text-emerald-600">Disponible</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">Sin fix</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cves.length === 0 && (
          <p className="py-4 text-center text-[11px] text-slate-400">
            Ningún CVE aparece en más de un repo en este scan.
          </p>
        )}
      </div>
    </Panel>
  );
}

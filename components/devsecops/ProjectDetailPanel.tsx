import DonutChart from "@/components/charts/DonutChart";
import Gauge from "@/components/charts/Gauge";
import Heatmap from "@/components/charts/Heatmap";
import Sparkline from "@/components/charts/Sparkline";
import { GateBadge, RatingBadge } from "@/components/devsecops/Badges";
import type { FilaProyecto, ScanHistorico } from "@/lib/metrics";
import { etiquetaFecha, formatearDeuda, formatearNumero } from "@/lib/metrics";
import { ALCANCE_TRIVY, AZDO_BASE_URL, SONAR_BASE_URL } from "@/lib/quality-gate";

function Metrica({
  label,
  value,
  tono = "text-slate-800",
}: {
  label: string;
  value: string;
  tono?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`text-lg font-semibold leading-tight ${tono}`}>{value}</p>
    </div>
  );
}

export default function ProjectDetailPanel({
  fila,
  historial,
}: {
  fila: FilaProyecto;
  historial: ScanHistorico[];
}) {
  const conSonar = fila.repos.filter(r => r.sonar !== null);
  const sinAnalizar = fila.repos.filter(r => r.sonar === null);
  const noDescubiertos = fila.reposTotal - fila.repos.length;
  const totalTrivy = fila.criticos + fila.altos + fila.medios + fila.bajos;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-800">{fila.nombre}</h2>
            {fila.esPoc && (
              <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">
                POC Fase 1
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Líder técnico: {fila.lider} · {fila.reposTotal} repos en el inventario (
            {fila.reposConImagen} publican imagen) ·{" "}
            {fila.ultimoAnalisis
              ? `último análisis ${fila.ultimoAnalisis}`
              : "sin análisis registrados"}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-5">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] text-slate-400">Repos analizados por scan</span>
            <Sparkline data={fila.historial} width={96} height={24} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <a
              href={`${AZDO_BASE_URL}/${fila.azdoProject}`}
              className="text-[11px] font-medium text-teal-700 underline decoration-teal-300 underline-offset-2"
            >
              Abrir en Azure DevOps
            </a>
            <a
              href={`${SONAR_BASE_URL}/projects?search=${encodeURIComponent(fila.key)}`}
              className="text-[11px] font-medium text-teal-700 underline decoration-teal-300 underline-offset-2"
            >
              Abrir en SonarQube
            </a>
          </div>
        </div>
      </header>

      {fila.adopcionSonar === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-600">Todavía sin adopción</p>
          <p className="mx-auto mt-1 max-w-md text-[11px] text-slate-500">
            Ninguno de los {fila.reposTotal} repos de este proyecto tiene análisis de SonarQube ni
            escaneo de Trivy. Este es el estado inicial de todos los proyectos fuera de la POC y es
            justamente lo que el tablero muestra avanzar scan a scan.
          </p>
          {fila.repos.length > 0 && (
            <div className="mx-auto mt-4 max-w-md text-left">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Repos detectados en Azure DevOps
              </p>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {fila.repos.map(repo => (
                  <li
                    key={repo.name}
                    className="flex items-center justify-between rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600"
                  >
                    <span className="truncate">{repo.name}</span>
                    <span className="ml-2 shrink-0 text-[10px] text-slate-400">sin Sonar</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Metrica label="Repos analizados" value={`${fila.reposConSonar}/${fila.reposTotal}`} />
            <Metrica label="Adopción" value={`${fila.adopcionSonar} %`} />
            <Metrica
              label="Deuda / 1k líneas"
              value={`${fila.deudaPor1kLineas} min`}
              tono={fila.deudaPor1kLineas > 150 ? "text-rose-600" : "text-slate-800"}
            />
            <Metrica
              label="Cobertura"
              value={`${fila.cobertura.toLocaleString("es-AR")} %`}
              tono={fila.cobertura >= 80 ? "text-emerald-600" : "text-amber-600"}
            />
            <Metrica
              label="CVE críticos"
              value={String(fila.criticos)}
              tono={fila.criticos > 0 ? "text-rose-600" : "text-emerald-600"}
            />
            <Metrica label="Líneas" value={formatearNumero(fila.ncloc)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="grid grid-cols-3 items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-3">
              <Gauge
                value={fila.adopcionSonar}
                label={`Adopción Sonar (${fila.reposConSonar}/${fila.reposTotal})`}
                color="#0f9b8e"
                size={84}
              />
              <Gauge
                value={fila.adopcionTrivy}
                label={`Adopción Trivy (${fila.reposConTrivy}/${fila.reposConImagen} con imagen)`}
                color="#2563eb"
                size={84}
              />
              <Gauge
                value={Math.round(fila.coberturaNueva)}
                label="Cobertura código nuevo"
                color="#7c3aed"
                size={84}
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-3">
              <DonutChart
                size={112}
                centerValue={totalTrivy}
                centerLabel="CVE"
                data={[
                  { label: "Críticas", value: fila.criticos, color: "#e11d48" },
                  { label: "Altas", value: fila.altos, color: "#f97316" },
                  { label: "Medias", value: fila.medios, color: "#fbbf24" },
                  { label: "Bajas", value: fila.bajos, color: "#94a3b8" },
                ]}
              />
              <ul className="flex-1 space-y-1 text-[11px]">
                <li className="flex justify-between">
                  <span className="text-slate-500">Quality Gates en verde</span>
                  <span className="font-semibold text-emerald-600">{fila.gatesOk}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Quality Gates en rojo</span>
                  <span className="font-semibold text-rose-600">{fila.gatesError}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Bugs / Vulnerabilidades</span>
                  <span className="font-semibold text-slate-700">
                    {fila.bugs} / {fila.vulnerabilidades}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Hotspots a revisar</span>
                  <span className="font-semibold text-slate-700">{fila.hotspots}</span>
                </li>
                <li className="border-t border-slate-200 pt-1.5 text-[10px] text-slate-400">
                  Trivy Fase 1: {ALCANCE_TRIVY.toLowerCase()}.
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-teal-700">Desglose por repo</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-2 text-left font-medium">Repo</th>
                    <th className="pb-2 pr-2 text-left font-medium">Gate</th>
                    <th className="pb-2 pr-2 text-right font-medium">Cob.</th>
                    <th className="pb-2 pr-2 text-right font-medium">Cob. nueva</th>
                    <th className="pb-2 pr-2 text-right font-medium">Dup.</th>
                    <th className="pb-2 pr-2 text-right font-medium">Deuda</th>
                    <th className="pb-2 pr-2 text-right font-medium">Bugs</th>
                    <th className="pb-2 pr-2 text-right font-medium">Vuln.</th>
                    <th className="pb-2 pr-2 text-right font-medium">Hot.</th>
                    <th className="pb-2 pr-2 text-center font-medium" title="Confiabilidad · Seguridad · Mantenibilidad">
                      C·S·M
                    </th>
                    <th className="pb-2 text-right font-medium">Trivy C/A/M/B</th>
                  </tr>
                </thead>
                <tbody>
                  {conSonar.map(repo => {
                    const s = repo.sonar!;
                    return (
                      <tr key={repo.name} className="border-b border-slate-100">
                        <td className="py-1.5 pr-2">
                          <a
                            href={`${SONAR_BASE_URL}/dashboard?id=${encodeURIComponent(repo.sonarProjectKey ?? "")}`}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            {repo.name}
                          </a>
                          <div className="text-[9px] text-slate-400" title={repo.sonarProjectKey ?? ""}>
                            {repo.sonarProjectName}
                          </div>
                        </td>
                        <td className="py-1.5 pr-2">
                          <GateBadge estado={s.alertStatus} />
                        </td>
                        <td
                          className={`py-1.5 pr-2 text-right font-semibold ${
                            s.coverage >= 80 ? "text-emerald-600" : s.coverage >= 60 ? "text-amber-600" : "text-rose-600"
                          }`}
                        >
                          {s.coverage.toLocaleString("es-AR")} %
                        </td>
                        <td
                          className={`py-1.5 pr-2 text-right ${
                            s.newCoverage >= 80 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {s.newCoverage.toLocaleString("es-AR")} %
                        </td>
                        <td
                          className={`py-1.5 pr-2 text-right ${
                            s.duplications > 3 ? "text-rose-600" : "text-slate-600"
                          }`}
                        >
                          {s.duplications.toLocaleString("es-AR")} %
                        </td>
                        <td className="py-1.5 pr-2 text-right text-slate-600">{formatearDeuda(s.sqaleIndex)}</td>
                        <td className="py-1.5 pr-2 text-right text-slate-600">{s.bugs}</td>
                        <td className="py-1.5 pr-2 text-right text-slate-600">{s.vulnerabilities}</td>
                        <td className="py-1.5 pr-2 text-right text-slate-600">{s.hotspotsToReview}</td>
                        <td className="py-1.5 pr-2">
                          <div className="flex justify-center gap-1">
                            <RatingBadge rating={s.reliabilityRating} title="Confiabilidad" />
                            <RatingBadge rating={s.securityRating} title="Seguridad" />
                            <RatingBadge rating={s.maintainabilityRating} title="Mantenibilidad" />
                          </div>
                        </td>
                        <td className="py-1.5 text-right">
                          {repo.trivy ? (
                            <span className="tabular-nums">
                              <span className="font-semibold text-rose-600">{repo.trivy.critical}</span>
                              <span className="text-slate-300"> / </span>
                              <span className="text-orange-600">{repo.trivy.high}</span>
                              <span className="text-slate-300"> / </span>
                              <span className="text-amber-600">{repo.trivy.medium}</span>
                              <span className="text-slate-300"> / </span>
                              <span className="text-slate-500">{repo.trivy.low}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {repo.publicaImagen ? "sin escanear" : "no publica imagen"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-[10px] text-slate-400">
              Columna C·S·M: ratings de confiabilidad, seguridad y mantenibilidad. Debajo de cada
              repo, el nombre del proyecto en SonarQube. El Quality Gate es por repo; el
              proyecto no tiene semáforo propio, solo el conteo de verdes y rojos.
            </p>

            {sinAnalizar.length > 0 && (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Sin medidas de Sonar en este scan ({sinAnalizar.length})
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {sinAnalizar.map(repo => (
                    <span
                      key={repo.name}
                      className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500"
                    >
                      {repo.name}
                    </span>
                  ))}
                </div>
                {noDescubiertos > 0 && (
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    Además quedan {noDescubiertos} repos del inventario sin incorporar al scan.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-teal-700">Actividad de análisis por repo</h3>
            <Heatmap
              rowLabel="Repo"
              unitLabel="análisis"
              data={fila.repos.map((repo, i) => ({
                reviewer: { nombre: repo.name, avatar: repo.name },
                days: historial.map((scan, j) => ({
                  date: scan.fecha,
                  count: fila.actividad[i]?.[j] ?? 0,
                })),
              }))}
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Una celda por scan ({historial.map(s => etiquetaFecha(s.fecha))[0]} al{" "}
              {etiquetaFecha(historial[historial.length - 1].fecha)}). Las filas vacías son repos
              que todavía no entraron al pipeline de análisis.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

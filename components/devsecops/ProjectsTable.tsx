"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import Sparkline from "@/components/charts/Sparkline";
import { SinDatosBadge } from "@/components/devsecops/Badges";
import type { FilaProyecto } from "@/lib/devsecops-metrics";
import { etiquetaFecha } from "@/lib/devsecops-metrics";

type Columna =
  | "nombre"
  | "reposConSonar"
  | "adopcionSonar"
  | "deudaPor1kLineas"
  | "deudaDias"
  | "cobertura"
  | "criticos"
  | "ultimoAnalisis";

type CriterioBusqueda = "proyecto" | "referente";

interface Props {
  filas: FilaProyecto[];
  /** Clave del proyecto abierto en el panel de detalle. */
  seleccionada?: string;
  /** Versión reducida para convivir con el panel lateral de detalle. */
  compacta?: boolean;
  /** Buscador por proyecto o referente, arriba de la tabla. */
  buscador?: boolean;
}

const COLUMNAS_COMPLETAS: { key: Columna; label: string; align: string; ayuda?: string }[] = [
  { key: "nombre", label: "Proyecto", align: "text-left" },
  { key: "reposConSonar", label: "Repos analizados", align: "text-right" },
  { key: "adopcionSonar", label: "Adopción", align: "text-right", ayuda: "Repos con proyecto en Sonar sobre el total del proyecto" },
  { key: "deudaPor1kLineas", label: "Deuda / 1k líneas", align: "text-right", ayuda: "Minutos de deuda técnica cada 1.000 líneas" },
  { key: "deudaDias", label: "Deuda total", align: "text-right", ayuda: "sqale_index convertido a días de 8 h" },
  { key: "cobertura", label: "Cobertura", align: "text-right" },
  { key: "criticos", label: "Críticos Trivy", align: "text-right" },
  { key: "ultimoAnalisis", label: "Último análisis", align: "text-right" },
];

const COLUMNAS_COMPACTAS: Columna[] = ["nombre", "reposConSonar", "adopcionSonar", "criticos"];

function valorOrden(fila: FilaProyecto, columna: Columna): string | number {
  if (columna === "nombre") return fila.nombre.toLowerCase();
  if (columna === "ultimoAnalisis") return fila.ultimoAnalisis ?? "";
  return fila[columna];
}

function colorCobertura(valor: number): string {
  if (valor === 0) return "text-slate-300";
  if (valor >= 80) return "text-emerald-600";
  if (valor >= 60) return "text-amber-600";
  return "text-rose-600";
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function ProjectsTable({
  filas,
  seleccionada,
  compacta = false,
  buscador = false,
}: Props) {
  // El orden por defecto es deuda normalizada, que es la métrica que da nombre al tablero.
  const [orden, setOrden] = useState<{ columna: Columna; desc: boolean }>({
    columna: "deudaPor1kLineas",
    desc: true,
  });
  const [criterio, setCriterio] = useState<CriterioBusqueda>("proyecto");
  const [texto, setTexto] = useState("");
  const idCriterio = useId();
  const idTexto = useId();

  const columnas = compacta
    ? COLUMNAS_COMPLETAS.filter(c => COLUMNAS_COMPACTAS.includes(c.key))
    : COLUMNAS_COMPLETAS;

  const filtradas = useMemo(() => {
    const busqueda = normalizar(texto.trim());
    if (!busqueda) return filas;
    return filas.filter(fila => {
      const campo = criterio === "proyecto" ? fila.nombre : fila.lider;
      return normalizar(campo).includes(busqueda);
    });
  }, [filas, criterio, texto]);

  const ordenadas = useMemo(() => {
    const copia = [...filtradas];
    copia.sort((a, b) => {
      // Los proyectos sin adopción van siempre al final, ordene por donde ordene.
      const sinA = a.adopcionSonar === 0 ? 1 : 0;
      const sinB = b.adopcionSonar === 0 ? 1 : 0;
      if (sinA !== sinB) return sinA - sinB;

      const va = valorOrden(a, orden.columna);
      const vb = valorOrden(b, orden.columna);
      if (va === vb) return a.nombre.localeCompare(b.nombre);
      const cmp = va > vb ? 1 : -1;
      return orden.desc ? -cmp : cmp;
    });
    return copia;
  }, [filtradas, orden]);

  function alternar(columna: Columna) {
    setOrden(actual =>
      actual.columna === columna
        ? { columna, desc: !actual.desc }
        : { columna, desc: columna !== "nombre" }
    );
  }

  return (
    <div>
      {buscador && (
        <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
          <div className="flex flex-col gap-1">
            <label htmlFor={idCriterio} className="text-[10px] text-slate-500">
              Buscar por
            </label>
            <select
              id={idCriterio}
              value={criterio}
              onChange={e => setCriterio(e.target.value as CriterioBusqueda)}
              className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
            >
              <option value="proyecto">Proyecto</option>
              <option value="referente">Referente</option>
            </select>
          </div>
          <div className="flex min-w-56 flex-1 flex-col gap-1">
            <label htmlFor={idTexto} className="text-[10px] text-slate-500">
              {criterio === "proyecto" ? "Nombre del proyecto" : "Nombre del líder técnico"}
            </label>
            <input
              id={idTexto}
              type="search"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder={criterio === "proyecto" ? "Gema - Ophir, Mep Contingencia - Poseidón…" : "Fernando Luna…"}
              className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <p className="py-1.5 text-[10px] text-slate-400">
            {ordenadas.length} de {filas.length} proyectos
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200">
              {columnas.map(columna => (
                <th
                  key={columna.key}
                  className={`pb-2 pr-3 font-medium text-slate-500 ${columna.align}`}
                  title={columna.ayuda}
                >
                  <button
                    type="button"
                    onClick={() => alternar(columna.key)}
                    className="inline-flex items-center gap-1 hover:text-slate-700"
                  >
                    {columna.label}
                    <span className="text-[9px] text-slate-400">
                      {orden.columna === columna.key ? (orden.desc ? "▼" : "▲") : "⇅"}
                    </span>
                  </button>
                </th>
              ))}
              {!compacta && (
                <th className="pb-2 text-right font-medium text-slate-500">Actividad</th>
              )}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map(fila => {
              const sinAdopcion = fila.adopcionSonar === 0;
              const activa = fila.key === seleccionada;
              return (
                <tr
                  key={fila.key}
                  className={`border-b border-slate-100 ${
                    activa ? "bg-teal-50/70" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="py-2 pr-3">
                    <Link
                      href={`/devsecops/proyectos/${fila.key}`}
                      className={`font-medium ${activa ? "text-teal-800" : "text-teal-700 hover:underline"}`}
                    >
                      {fila.nombre}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {fila.esPoc && (
                        <span className="rounded bg-teal-100 px-1.5 py-px text-[9px] font-semibold text-teal-700">
                          POC
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{fila.lider}</span>
                    </div>
                  </td>

                  <td className="py-2 pr-3 text-right">
                    <span className={sinAdopcion ? "text-slate-300" : "font-semibold text-slate-700"}>
                      {fila.reposConSonar}
                    </span>
                    <span className="text-slate-400"> / {fila.reposTotal}</span>
                  </td>

                  <td className="py-2 pr-3 text-right">
                    {sinAdopcion ? (
                      <SinDatosBadge texto="0 %" />
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {!compacta && (
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-teal-600"
                              style={{ width: `${fila.adopcionSonar}%` }}
                            />
                          </div>
                        )}
                        <span className="whitespace-nowrap font-semibold text-slate-700">
                          {fila.adopcionSonar}&nbsp;%
                        </span>
                      </div>
                    )}
                  </td>

                  {!compacta && (
                    <>
                      <td className="py-2 pr-3 text-right">
                        {sinAdopcion ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <span
                            className={`whitespace-nowrap ${
                              fila.deudaPor1kLineas > 150
                                ? "font-semibold text-rose-600"
                                : fila.deudaPor1kLineas > 90
                                  ? "font-semibold text-amber-600"
                                  : "text-slate-700"
                            }`}
                          >
                            {fila.deudaPor1kLineas} min
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-right text-slate-600">
                        {sinAdopcion ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          `${fila.deudaDias.toLocaleString("es-AR")} d`
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {sinAdopcion ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <span
                            className={`whitespace-nowrap font-semibold ${colorCobertura(fila.cobertura)}`}
                          >
                            {fila.cobertura.toLocaleString("es-AR")} %
                          </span>
                        )}
                      </td>
                    </>
                  )}

                  <td className="py-2 pr-3 text-right">
                    {fila.reposConTrivy === 0 ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span
                        className={
                          fila.criticos > 0 ? "font-semibold text-rose-600" : "text-emerald-600"
                        }
                      >
                        {fila.criticos}
                      </span>
                    )}
                  </td>

                  {!compacta && (
                    <>
                      <td className="whitespace-nowrap py-2 pr-3 text-right text-slate-500">
                        {fila.ultimoAnalisis ? etiquetaFecha(fila.ultimoAnalisis) : "—"}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end">
                          <Sparkline data={fila.historial} width={84} height={22} />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {ordenadas.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-400">
            Ningún proyecto coincide con la búsqueda.
          </p>
        )}
      </div>

      {!compacta && (
        <p className="mt-3 text-[10px] text-slate-400">
          Ordenada por deuda cada 1.000 líneas. La normalización por tamaño es deliberada: sin ella,
          los proyectos grandes como Probatch quedan siempre últimos y la conversación con los
          líderes se desvía. Los proyectos sin adopción quedan siempre al final.
        </p>
      )}
    </div>
  );
}

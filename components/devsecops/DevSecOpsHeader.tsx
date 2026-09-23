"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Sparkline from "@/components/charts/Sparkline";
import type { ScanHistorico } from "@/lib/metrics";

const SOLAPAS = [
  { href: "/", label: "Portada ejecutiva" },
  { href: "/ranking", label: "Ranking de proyectos" },
  { href: "/gema", label: "Detalle de proyecto" },
];

function esActiva(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (href === "/") return path === "/";
  if (href === "/ranking") return path === "/ranking";
  return path !== "/" && path !== "/ranking";
}

const TITULO = "DevSecOps health (Deuda Técnica)";

interface Props {
  subtitulo?: string;
  historial: ScanHistorico[];
  fechaScan: string;
}

export default function DevSecOpsHeader({ subtitulo, historial, fechaScan }: Props) {
  const pathname = usePathname() ?? "/";
  const serie = historial.map(s => s.reposConSonar);
  const delta = serie.length >= 2 ? serie[serie.length - 1] - serie[serie.length - 2] : 0;

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Inteligencia de ingeniería · Accusys
          </p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight text-slate-800">{TITULO}</h1>
          {subtitulo && <p className="mt-1 text-xs text-slate-500">{subtitulo}</p>}
        </div>

        <div className="flex flex-col items-end gap-1 pt-1">
          <Sparkline data={serie} width={104} height={28} />
          <p className="text-[10px] text-slate-400">
            Actividad: {delta >= 0 ? "+" : ""}
            {delta} repos vs. scan anterior
          </p>
          <p className="text-[10px] text-slate-400">Scan {fechaScan}</p>
          <p className="text-[10px] text-slate-400">accusys/devsecops-dashboard</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 border-b border-slate-200">
        {SOLAPAS.map(solapa => {
          const activa = esActiva(pathname, solapa.href);
          return (
            <Link
              key={solapa.href}
              href={solapa.href}
              className={`-mb-px border-b-2 px-3 py-2 text-xs transition-colors ${
                activa
                  ? "border-teal-600 font-semibold text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {solapa.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

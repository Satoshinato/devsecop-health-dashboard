// Agregaciones derivadas de lib/devsecops-data.ts. Todo se calcula en el front,
// igual que en el plan, para poder recalcular sobre snapshots viejos sin volver
// a recolectar.

import {
  HISTORIAL_SCANS,
  IMAGENES_BASE,
  PROYECTOS,
  type ImagenBase,
  type ProyectoSample,
  type RepoSample,
} from "@/lib/devsecops-data";

/** Minutos de una jornada de 8 h, para pasar sqale_index a días. */
const MINUTOS_POR_DIA = 480;

export interface FilaProyecto {
  key: string;
  /** Nombre completo, para el detalle. */
  nombre: string;
  /** Nombre corto, para las tablas. */
  nombreCorto: string;
  azdoProject: string;
  lider: string;
  esPoc: boolean;
  reposTotal: number;
  /** Denominador de la adopción de Trivy: repos que publican imagen de contenedor. */
  reposConImagen: number;
  reposConSonar: number;
  reposConTrivy: number;
  adopcionSonar: number;
  adopcionTrivy: number;
  ncloc: number;
  deudaMin: number;
  deudaDias: number;
  /** Minutos de deuda por cada 1.000 líneas, para comparar proyectos de tamaños distintos. */
  deudaPor1kLineas: number;
  cobertura: number;
  coberturaNueva: number;
  criticos: number;
  altos: number;
  medios: number;
  bajos: number;
  bugs: number;
  vulnerabilidades: number;
  hotspots: number;
  gatesOk: number;
  gatesError: number;
  ultimoAnalisis: string | null;
  historial: number[];
  repos: RepoSample[];
}

function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 100);
}

function promedioPonderado(repos: RepoSample[], campo: "coverage" | "newCoverage"): number {
  let peso = 0;
  let acumulado = 0;
  for (const repo of repos) {
    if (!repo.sonar) continue;
    peso += repo.sonar.ncloc;
    acumulado += repo.sonar.ncloc * repo.sonar[campo];
  }
  if (peso === 0) return 0;
  return Math.round((acumulado / peso) * 10) / 10;
}

export function filaProyecto(proyecto: ProyectoSample): FilaProyecto {
  const conSonar = proyecto.repos.filter(r => r.sonar !== null);
  const conTrivy = proyecto.repos.filter(r => r.trivy !== null);

  const ncloc = conSonar.reduce((s, r) => s + r.sonar!.ncloc, 0);
  const deudaMin = conSonar.reduce((s, r) => s + r.sonar!.sqaleIndex, 0);
  const ultimas = conSonar.map(r => r.sonar!.lastAnalysis).sort();

  return {
    key: proyecto.key,
    nombre: proyecto.name,
    nombreCorto: proyecto.nombreCorto,
    azdoProject: proyecto.azdoProject,
    lider: proyecto.lider,
    esPoc: proyecto.esPoc ?? false,
    reposTotal: proyecto.reposTotal,
    reposConImagen: proyecto.reposConImagen,
    reposConSonar: conSonar.length,
    reposConTrivy: conTrivy.length,
    adopcionSonar: porcentaje(conSonar.length, proyecto.reposTotal),
    adopcionTrivy: porcentaje(conTrivy.length, proyecto.reposConImagen),
    ncloc,
    deudaMin,
    deudaDias: Math.round((deudaMin / MINUTOS_POR_DIA) * 10) / 10,
    deudaPor1kLineas: ncloc > 0 ? Math.round(deudaMin / (ncloc / 1000)) : 0,
    cobertura: promedioPonderado(conSonar, "coverage"),
    coberturaNueva: promedioPonderado(conSonar, "newCoverage"),
    criticos: conTrivy.reduce((s, r) => s + r.trivy!.critical, 0),
    altos: conTrivy.reduce((s, r) => s + r.trivy!.high, 0),
    medios: conTrivy.reduce((s, r) => s + r.trivy!.medium, 0),
    bajos: conTrivy.reduce((s, r) => s + r.trivy!.low, 0),
    bugs: conSonar.reduce((s, r) => s + r.sonar!.bugs, 0),
    vulnerabilidades: conSonar.reduce((s, r) => s + r.sonar!.vulnerabilities, 0),
    hotspots: conSonar.reduce((s, r) => s + r.sonar!.hotspotsToReview, 0),
    gatesOk: conSonar.filter(r => r.sonar!.alertStatus === "OK").length,
    gatesError: conSonar.filter(r => r.sonar!.alertStatus !== "OK").length,
    ultimoAnalisis: ultimas.length > 0 ? ultimas[ultimas.length - 1] : null,
    historial: proyecto.historial,
    repos: proyecto.repos,
  };
}

export function filasProyectos(): FilaProyecto[] {
  return PROYECTOS.map(filaProyecto);
}

export function buscarProyecto(key: string): FilaProyecto | undefined {
  const proyecto = PROYECTOS.find(p => p.key === key);
  return proyecto ? filaProyecto(proyecto) : undefined;
}

export interface ResumenGlobal {
  proyectosTotal: number;
  proyectosConAdopcion: number;
  proyectosSinAdopcion: number;
  reposTotal: number;
  reposConImagen: number;
  reposConSonar: number;
  reposConTrivy: number;
  adopcionSonar: number;
  adopcionTrivy: number;
  deudaDias: number;
  criticos: number;
  altos: number;
  medios: number;
  bajos: number;
  cobertura: number;
  coberturaNueva: number;
  gatesOk: number;
  gatesError: number;
  ncloc: number;
  /** Diferencia de repos escaneados contra el scan anterior. */
  deltaRepos: number;
  deltaCriticos: number;
  deltaDeudaDias: number;
}

export function resumenGlobal(): ResumenGlobal {
  const filas = filasProyectos();
  const todosLosRepos = PROYECTOS.flatMap(p => p.repos);
  const conSonar = todosLosRepos.filter(r => r.sonar !== null);

  const reposTotal = filas.reduce((s, f) => s + f.reposTotal, 0);
  const reposConImagen = filas.reduce((s, f) => s + f.reposConImagen, 0);
  const reposConSonar = conSonar.length;
  const reposConTrivy = todosLosRepos.filter(r => r.trivy !== null).length;
  const deudaMin = conSonar.reduce((s, r) => s + r.sonar!.sqaleIndex, 0);

  const ultimo = HISTORIAL_SCANS[HISTORIAL_SCANS.length - 1];
  const anterior = HISTORIAL_SCANS[HISTORIAL_SCANS.length - 2] ?? ultimo;

  return {
    proyectosTotal: filas.length,
    proyectosConAdopcion: filas.filter(f => f.adopcionSonar > 0).length,
    proyectosSinAdopcion: filas.filter(f => f.adopcionSonar === 0).length,
    reposTotal,
    reposConImagen,
    reposConSonar,
    reposConTrivy,
    adopcionSonar: porcentaje(reposConSonar, reposTotal),
    adopcionTrivy: porcentaje(reposConTrivy, reposConImagen),
    deudaDias: Math.round(deudaMin / MINUTOS_POR_DIA),
    criticos: filas.reduce((s, f) => s + f.criticos, 0),
    altos: filas.reduce((s, f) => s + f.altos, 0),
    medios: filas.reduce((s, f) => s + f.medios, 0),
    bajos: filas.reduce((s, f) => s + f.bajos, 0),
    cobertura: promedioPonderado(conSonar, "coverage"),
    coberturaNueva: promedioPonderado(conSonar, "newCoverage"),
    gatesOk: filas.reduce((s, f) => s + f.gatesOk, 0),
    gatesError: filas.reduce((s, f) => s + f.gatesError, 0),
    ncloc: conSonar.reduce((s, r) => s + r.sonar!.ncloc, 0),
    deltaRepos: ultimo.reposConSonar - anterior.reposConSonar,
    deltaCriticos: ultimo.criticos - anterior.criticos,
    deltaDeudaDias: ultimo.deudaDias - anterior.deudaDias,
  };
}

export interface ImagenBaseConImpacto extends ImagenBase {
  /** CVE críticos × repos afectados: cuánto baja el riesgo actualizar esta imagen. */
  impacto: number;
}

/** Imágenes base ordenadas por impacto, que es el criterio acordado para el top. */
export function imagenesBasePorImpacto(): ImagenBaseConImpacto[] {
  return IMAGENES_BASE.map(imagen => ({
    ...imagen,
    impacto: imagen.criticosUnicos * imagen.reposAfectados,
  })).sort((a, b) => b.impacto - a.impacto || b.criticosUnicos - a.criticosUnicos);
}

/** Etiqueta corta de fecha para los ejes de los gráficos: "21/9". */
export function etiquetaFecha(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${parseInt(dia, 10)}/${parseInt(mes, 10)}`;
}

export function formatearNumero(n: number): string {
  return n.toLocaleString("es-AR");
}

/** Convierte minutos de deuda a un texto corto: "12,4 d" o "3,5 h". */
export function formatearDeuda(minutos: number): string {
  if (minutos === 0) return "—";
  const dias = minutos / MINUTOS_POR_DIA;
  if (dias >= 1) return `${dias.toLocaleString("es-AR", { maximumFractionDigits: 1 })} d`;
  return `${(minutos / 60).toLocaleString("es-AR", { maximumFractionDigits: 1 })} h`;
}

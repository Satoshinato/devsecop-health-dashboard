import type {
  AzdoProject,
  Repo,
  ScanSnapshot,
  SeveridadCve,
  TrivyFinding,
} from "./snapshot";

/** Minutos de una jornada de 8 h, para pasar sqale_index a días. */
export const MINUTOS_POR_DIA = 480;

export interface FilaProyecto {
  key: string;
  nombre: string;
  azdoProject: string;
  lider: string;
  esPoc: boolean;
  reposTotal: number;
  reposConImagen: number;
  reposConSonar: number;
  reposConTrivy: number;
  adopcionSonar: number;
  adopcionTrivy: number;
  ncloc: number;
  deudaMin: number;
  deudaDias: number;
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
  repos: Repo[];
  actividad: number[][];
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
  deltaRepos: number;
  deltaCriticos: number;
  deltaDeudaDias: number;
}

export interface ScanHistorico {
  fecha: string;
  reposConSonar: number;
  reposConTrivy: number;
  criticos: number;
  deudaDias: number;
  cobertura: number;
}

export interface ImagenBaseConImpacto {
  imagen: string;
  criticosUnicos: number;
  altosUnicos: number;
  reposAfectados: number;
  proyectosAfectados: number;
  finDeSoporte?: boolean;
  tendencia: number[];
  impacto: number;
}

export interface CveTransversal {
  cve: string;
  paquete: string;
  version: string;
  severidad: SeveridadCve;
  reposAfectados: number;
  versionCorregida: string | null;
}

export function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 100);
}

export function deudaDiasDesdeSqale(sqaleIndex: number): number {
  return sqaleIndex / MINUTOS_POR_DIA;
}

export function impactoImagen(criticosUnicos: number, reposAfectados: number): number {
  return criticosUnicos * reposAfectados;
}

function promedioPonderado(repos: Repo[], campo: "coverage" | "newCoverage"): number {
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

function reposConImagen(proyecto: AzdoProject): number {
  return proyecto.repos.filter(r => r.publicaImagen).length;
}

/** Adopción Sonar = repos con project key / total del inventario. */
export function adopcionSonarDe(proyecto: AzdoProject): number {
  const conKey = proyecto.repos.filter(r => r.sonarProjectKey).length;
  return porcentaje(conKey, proyecto.reposTotal);
}

/** Adopción Trivy = repos con scan Trivy / repos que publican imagen. */
export function adopcionTrivyDe(proyecto: AzdoProject): number {
  const conTrivy = proyecto.repos.filter(r => r.trivy !== null).length;
  return porcentaje(conTrivy, reposConImagen(proyecto));
}

function historialProyecto(key: string, historial: ScanSnapshot[]): number[] {
  return historial.map(
    scan =>
      scan.projects.find(p => p.key === key)?.repos.filter(r => r.sonar !== null).length ?? 0,
  );
}

function actividadRepo(projectKey: string, repoName: string, historial: ScanSnapshot[]): number[] {
  return historial.map(scan => {
    const repo = scan.projects.find(p => p.key === projectKey)?.repos.find(r => r.name === repoName);
    return repo?.sonar ? 1 : 0;
  });
}

export function filaProyecto(proyecto: AzdoProject, historial: ScanSnapshot[] = []): FilaProyecto {
  const conSonarMedidas = proyecto.repos.filter(r => r.sonar !== null);
  const conKey = proyecto.repos.filter(r => r.sonarProjectKey);
  const conTrivy = proyecto.repos.filter(r => r.trivy !== null);
  const ncloc = conSonarMedidas.reduce((s, r) => s + r.sonar!.ncloc, 0);
  const deudaMin = conSonarMedidas.reduce((s, r) => s + r.sonar!.sqaleIndex, 0);
  const ultimas = conSonarMedidas.map(r => r.sonar!.lastAnalysis).sort();
  const imagenes = reposConImagen(proyecto);

  return {
    key: proyecto.key,
    nombre: proyecto.name,
    azdoProject: proyecto.azdoProject,
    lider: proyecto.leader,
    esPoc: proyecto.esPoc ?? false,
    reposTotal: proyecto.reposTotal,
    reposConImagen: imagenes,
    reposConSonar: conSonarMedidas.length,
    reposConTrivy: conTrivy.length,
    adopcionSonar: porcentaje(conKey.length, proyecto.reposTotal),
    adopcionTrivy: porcentaje(conTrivy.length, imagenes),
    ncloc,
    deudaMin,
    deudaDias: Math.round(deudaDiasDesdeSqale(deudaMin) * 10) / 10,
    deudaPor1kLineas: ncloc > 0 ? Math.round(deudaMin / (ncloc / 1000)) : 0,
    cobertura: promedioPonderado(conSonarMedidas, "coverage"),
    coberturaNueva: promedioPonderado(conSonarMedidas, "newCoverage"),
    criticos: conTrivy.reduce((s, r) => s + r.trivy!.critical, 0),
    altos: conTrivy.reduce((s, r) => s + r.trivy!.high, 0),
    medios: conTrivy.reduce((s, r) => s + r.trivy!.medium, 0),
    bajos: conTrivy.reduce((s, r) => s + r.trivy!.low, 0),
    bugs: conSonarMedidas.reduce((s, r) => s + r.sonar!.bugs, 0),
    vulnerabilidades: conSonarMedidas.reduce((s, r) => s + r.sonar!.vulnerabilities, 0),
    hotspots: conSonarMedidas.reduce((s, r) => s + r.sonar!.hotspotsToReview, 0),
    gatesOk: conSonarMedidas.filter(r => r.sonar!.alertStatus === "OK").length,
    gatesError: conSonarMedidas.filter(r => r.sonar!.alertStatus !== "OK").length,
    ultimoAnalisis: ultimas.length > 0 ? ultimas[ultimas.length - 1] : null,
    historial: historialProyecto(proyecto.key, historial),
    repos: proyecto.repos,
    actividad: proyecto.repos.map(r => actividadRepo(proyecto.key, r.name, historial)),
  };
}

export function filasProyectos(scan: ScanSnapshot, historial: ScanSnapshot[] = []): FilaProyecto[] {
  return scan.projects.map(p => filaProyecto(p, historial));
}

export function buscarProyecto(
  scan: ScanSnapshot,
  key: string,
  historial: ScanSnapshot[] = [],
): FilaProyecto | undefined {
  const proyecto = scan.projects.find(p => p.key === key);
  return proyecto ? filaProyecto(proyecto, historial) : undefined;
}

export function resumenDeScan(scan: ScanSnapshot): Omit<
  ResumenGlobal,
  "deltaRepos" | "deltaCriticos" | "deltaDeudaDias"
> {
  const filas = filasProyectos(scan, [scan]);
  const todosLosRepos = scan.projects.flatMap(p => p.repos);
  const conSonar = todosLosRepos.filter(r => r.sonar !== null);
  const conKey = todosLosRepos.filter(r => r.sonarProjectKey);
  const reposTotal = filas.reduce((s, f) => s + f.reposTotal, 0);
  const reposConImagenTotal = filas.reduce((s, f) => s + f.reposConImagen, 0);
  const reposConTrivy = todosLosRepos.filter(r => r.trivy !== null).length;
  const deudaMin = conSonar.reduce((s, r) => s + r.sonar!.sqaleIndex, 0);

  return {
    proyectosTotal: filas.length,
    proyectosConAdopcion: filas.filter(f => f.adopcionSonar > 0).length,
    proyectosSinAdopcion: filas.filter(f => f.adopcionSonar === 0).length,
    reposTotal,
    reposConImagen: reposConImagenTotal,
    reposConSonar: conSonar.length,
    reposConTrivy,
    adopcionSonar: porcentaje(conKey.length, reposTotal),
    adopcionTrivy: porcentaje(reposConTrivy, reposConImagenTotal),
    deudaDias: Math.round(deudaDiasDesdeSqale(deudaMin)),
    criticos: filas.reduce((s, f) => s + f.criticos, 0),
    altos: filas.reduce((s, f) => s + f.altos, 0),
    medios: filas.reduce((s, f) => s + f.medios, 0),
    bajos: filas.reduce((s, f) => s + f.bajos, 0),
    cobertura: promedioPonderado(conSonar, "coverage"),
    coberturaNueva: promedioPonderado(conSonar, "newCoverage"),
    gatesOk: filas.reduce((s, f) => s + f.gatesOk, 0),
    gatesError: filas.reduce((s, f) => s + f.gatesError, 0),
    ncloc: conSonar.reduce((s, r) => s + r.sonar!.ncloc, 0),
  };
}

export function historialScans(scans: ScanSnapshot[]): ScanHistorico[] {
  return scans.map(scan => {
    const r = resumenDeScan(scan);
    return {
      fecha: scan.fecha,
      reposConSonar: r.reposConSonar,
      reposConTrivy: r.reposConTrivy,
      criticos: r.criticos,
      deudaDias: r.deudaDias,
      cobertura: r.cobertura,
    };
  });
}

export function resumenGlobal(scans: ScanSnapshot[]): ResumenGlobal {
  const historial = historialScans(scans);
  const ultimo = historial[historial.length - 1];
  const anterior = historial[historial.length - 2] ?? ultimo;
  const actual = scans[scans.length - 1];
  const base = resumenDeScan(actual);

  return {
    ...base,
    deltaRepos: ultimo.reposConSonar - anterior.reposConSonar,
    deltaCriticos: ultimo.criticos - anterior.criticos,
    deltaDeudaDias: ultimo.deudaDias - anterior.deudaDias,
  };
}

function hallazgosDe(scan: ScanSnapshot): {
  repo: Repo;
  project: AzdoProject;
  finding: TrivyFinding;
}[] {
  const out: { repo: Repo; project: AzdoProject; finding: TrivyFinding }[] = [];
  for (const project of scan.projects) {
    for (const repo of project.repos) {
      if (!repo.trivy) continue;
      for (const finding of repo.trivy.findings) {
        out.push({ repo, project, finding });
      }
    }
  }
  return out;
}

export function imagenesBasePorImpacto(scans: ScanSnapshot[]): ImagenBaseConImpacto[] {
  const actual = scans[scans.length - 1];
  if (!actual) return [];

  const grupos = new Map<string, { repos: Set<string>; proyectos: Set<string>; findings: TrivyFinding[] }>();
  for (const project of actual.projects) {
    for (const repo of project.repos) {
      if (!repo.trivy) continue;
      const key = repo.trivy.baseImage || repo.trivy.image;
      let grupo = grupos.get(key);
      if (!grupo) {
        grupo = { repos: new Set(), proyectos: new Set(), findings: [] };
        grupos.set(key, grupo);
      }
      grupo.repos.add(`${project.key}/${repo.name}`);
      grupo.proyectos.add(project.key);
      grupo.findings.push(...repo.trivy.findings);
    }
  }

  const imagenes: ImagenBaseConImpacto[] = [];
  for (const [imagen, grupo] of grupos) {
    const criticosUnicos = new Set(
      grupo.findings.filter(f => f.severity === "CRÍTICA").map(f => f.id),
    ).size;
    const altosUnicos = new Set(grupo.findings.filter(f => f.severity === "ALTA").map(f => f.id)).size;
    const tendencia = scans.map(scan => {
      const ids = new Set<string>();
      for (const project of scan.projects) {
        for (const repo of project.repos) {
          if (!repo.trivy) continue;
          const key = repo.trivy.baseImage || repo.trivy.image;
          if (key !== imagen) continue;
          for (const f of repo.trivy.findings) {
            if (f.severity === "CRÍTICA") ids.add(f.id);
          }
        }
      }
      return ids.size;
    });

    imagenes.push({
      imagen,
      criticosUnicos,
      altosUnicos,
      reposAfectados: grupo.repos.size,
      proyectosAfectados: grupo.proyectos.size,
      finDeSoporte: imagen.includes("openjdk:11"),
      tendencia,
      impacto: impactoImagen(criticosUnicos, grupo.repos.size),
    });
  }

  return imagenes.sort((a, b) => b.impacto - a.impacto || b.criticosUnicos - a.criticosUnicos);
}

export function cvesTransversales(scan: ScanSnapshot): CveTransversal[] {
  const porCve = new Map<
    string,
    { finding: TrivyFinding; repos: Set<string> }
  >();
  for (const { repo, project, finding } of hallazgosDe(scan)) {
    let entry = porCve.get(finding.id);
    if (!entry) {
      entry = { finding, repos: new Set() };
      porCve.set(finding.id, entry);
    }
    entry.repos.add(`${project.key}/${repo.name}`);
  }

  return [...porCve.values()]
    .filter(e => e.repos.size > 1)
    .map(e => ({
      cve: e.finding.id,
      paquete: e.finding.package,
      version: e.finding.version,
      severidad: e.finding.severity,
      reposAfectados: e.repos.size,
      versionCorregida: e.finding.fixedVersion,
    }))
    .sort((a, b) => b.reposAfectados - a.reposAfectados || a.cve.localeCompare(b.cve));
}

export function etiquetaFecha(iso: string): string {
  const parts = iso.split("-");
  const mes = parts[1];
  const dia = parts[2];
  return `${parseInt(dia, 10)}/${parseInt(mes, 10)}`;
}

export function formatearNumero(n: number): string {
  return n.toLocaleString("es-AR");
}

export function formatearDeuda(minutos: number): string {
  if (minutos === 0) return "—";
  const dias = minutos / MINUTOS_POR_DIA;
  if (dias >= 1) return `${dias.toLocaleString("es-AR", { maximumFractionDigits: 1 })} d`;
  return `${(minutos / 60).toLocaleString("es-AR", { maximumFractionDigits: 1 })} h`;
}

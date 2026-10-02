import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { rollHistory } from "../lib/history.ts";
import type { AzdoProject, Repo, ScanSnapshot } from "../lib/snapshot.ts";

export { rollHistory };

function mergeRepo(base: Repo, extra: Repo | undefined): Repo {
  if (!extra) return base;
  const trivyPr = extra.trivyPr !== undefined ? extra.trivyPr : base.trivyPr;
  const trivyBuild = extra.trivyBuild !== undefined ? extra.trivyBuild : base.trivyBuild;
  const sonar = extra.sonar !== undefined && extra.sonar !== null ? extra.sonar : base.sonar;
  const trivy =
    extra.trivy !== undefined && extra.trivy !== null
      ? extra.trivy
      : trivyBuild ?? trivyPr ?? base.trivy;
  return {
    ...base,
    ...extra,
    sonar: sonar ?? base.sonar ?? null,
    trivyPr,
    trivyBuild,
    trivy: trivy ?? null,
    sonarProjectKey: extra.sonarProjectKey ?? base.sonarProjectKey,
    sonarProjectName: extra.sonarProjectName ?? base.sonarProjectName,
    aplicaSonar: extra.aplicaSonar ?? base.aplicaSonar,
  };
}

function mergeProject(base: AzdoProject, overlay: AzdoProject | undefined): AzdoProject {
  if (!overlay) return base;
  const overlayRepos = new Map(overlay.repos.map(r => [r.name, r]));
  const names = new Set([...base.repos.map(r => r.name), ...overlay.repos.map(r => r.name)]);
  const repos = [...names].map(name => {
    const a = base.repos.find(r => r.name === name);
    const b = overlayRepos.get(name);
    return a ? mergeRepo(a, b) : b!;
  });
  return {
    ...base,
    ...overlay,
    repos,
    reposTotal: overlay.reposTotal || base.reposTotal || repos.length,
  };
}

/** Une inventario+Trivy (azure) con métricas Sonar. Base = azure si existe. */
export function mergeSnapshots(azure: ScanSnapshot | null, sonar: ScanSnapshot | null): ScanSnapshot {
  if (!azure && !sonar) {
    throw new Error("merge: hace falta al menos un snapshot (azure o sonar)");
  }
  if (!azure) return sonar!;
  if (!sonar) return azure;

  const sonarByKey = new Map(sonar.projects.map(p => [p.key, p]));
  const keys = new Set([...azure.projects.map(p => p.key), ...sonar.projects.map(p => p.key)]);
  const projects = [...keys].map(key => {
    const fromAzure = azure.projects.find(p => p.key === key);
    const fromSonar = sonarByKey.get(key);
    return fromAzure ? mergeProject(fromAzure, fromSonar) : fromSonar!;
  });

  return {
    fecha: azure.fecha || sonar.fecha,
    organizacionAzdo: azure.organizacionAzdo || sonar.organizacionAzdo,
    organizacionSonar: sonar.organizacionSonar || azure.organizacionSonar,
    projects,
  };
}

export function readSnapshot(path: string): ScanSnapshot {
  return JSON.parse(readFileSync(path, "utf8")) as ScanSnapshot;
}

export function readHistory(path: string): ScanSnapshot[] {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as ScanSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDashboardFiles(
  outDir: string,
  dashboard: ScanSnapshot,
  history: ScanSnapshot[],
): { dashboard: string; history: string } {
  mkdirSync(outDir, { recursive: true });
  const dashboardPath = join(outDir, "dashboard.json");
  const historyPath = join(outDir, "history.json");
  writeFileSync(dashboardPath, `${JSON.stringify(dashboard, null, 2)}\n`);
  writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
  return { dashboard: dashboardPath, history: historyPath };
}
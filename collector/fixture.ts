import type { AzdoProject, Repo, ScanSnapshot, SonarMetrics, TrivyMetrics } from "../lib/snapshot.ts";
import { loadProjectsConfig } from "./config.ts";

interface GemaSeed {
  name: string;
  sonar?: Omit<SonarMetrics, "lastAnalysis">;
  trivy?: Omit<TrivyMetrics, "scanDate" | "buildId">;
}

const GEMA_SEEDS: GemaSeed[] = [
  {
    name: "mf-ophir-migrador-app",
    sonar: {
      ncloc: 31480, coverage: 71.4, newCoverage: 76.3, duplications: 2.4, sqaleIndex: 2680,
      bugs: 5, vulnerabilities: 2, hotspotsToReview: 4, codeSmells: 312,
      reliabilityRating: "B", securityRating: "A", maintainabilityRating: "A", alertStatus: "ERROR",
    },
    trivy: {
      image: "accusystechnology/mf-ophir-migrador-app:0.4.2-a91c3f01",
      baseImage: "node:20-alpine",
      critical: 1, high: 4, medium: 12, low: 7, fixable: 17, unfixable: 7,
      findings: [
        { id: "CVE-2024-22262", package: "openssl", version: "3.0.13", severity: "CRÍTICA", fixedVersion: "3.0.15" },
        { id: "CVE-2024-34750", package: "zlib", version: "1.3", severity: "ALTA", fixedVersion: null },
      ],
    },
  },
  {
    name: "ms-ophir-api",
    sonar: {
      ncloc: 48210, coverage: 84.2, newCoverage: 91.5, duplications: 1.8, sqaleIndex: 1420,
      bugs: 3, vulnerabilities: 1, hotspotsToReview: 2, codeSmells: 187,
      reliabilityRating: "A", securityRating: "A", maintainabilityRating: "A", alertStatus: "OK",
    },
    trivy: {
      image: "accusystechnology/ms-ophir-api:0.0.1-75ff6212",
      baseImage: "eclipse-temurin:17-jre-alpine",
      critical: 0, high: 0, medium: 6, low: 3, fixable: 6, unfixable: 3,
      findings: [
        { id: "CVE-2024-38816", package: "spring-webmvc", version: "6.1.4", severity: "MEDIA", fixedVersion: "6.1.12" },
        { id: "CVE-2024-22262", package: "openssl", version: "3.0.13", severity: "MEDIA", fixedVersion: "3.0.15" },
      ],
    },
  },
  {
    name: "ms-ophir-app",
    sonar: {
      ncloc: 62940, coverage: 62.8, newCoverage: 80.4, duplications: 3.6, sqaleIndex: 5210,
      bugs: 9, vulnerabilities: 3, hotspotsToReview: 7, codeSmells: 540,
      reliabilityRating: "B", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
    },
    trivy: {
      image: "accusystechnology/ms-ophir-app:2.1.0-c47ab920",
      baseImage: "eclipse-temurin:17-jre-alpine",
      critical: 2, high: 9, medium: 21, low: 14, fixable: 26, unfixable: 20,
      findings: [
        { id: "CVE-2024-38809", package: "spring-core", version: "6.1.4", severity: "CRÍTICA", fixedVersion: "6.1.12" },
        { id: "CVE-2024-22262", package: "openssl", version: "3.0.13", severity: "CRÍTICA", fixedVersion: "3.0.15" },
        { id: "CVE-2024-34750", package: "zlib", version: "1.3", severity: "ALTA", fixedVersion: null },
      ],
    },
  },
  {
    name: "ms-ophir-arqueo-atm-api",
    sonar: {
      ncloc: 12360, coverage: 79.1, newCoverage: 88.2, duplications: 0.9, sqaleIndex: 640,
      bugs: 1, vulnerabilities: 0, hotspotsToReview: 1, codeSmells: 74,
      reliabilityRating: "A", securityRating: "A", maintainabilityRating: "A", alertStatus: "OK",
    },
    trivy: {
      image: "accusystechnology/ms-ophir-arqueo-atm-api:0.2.7-1de99ab4",
      baseImage: "eclipse-temurin:17-jre-alpine",
      critical: 0, high: 1, medium: 4, low: 2, fixable: 5, unfixable: 2,
      findings: [
        { id: "CVE-2024-34750", package: "zlib", version: "1.3", severity: "ALTA", fixedVersion: null },
        { id: "CVE-2024-22262", package: "openssl", version: "3.0.13", severity: "MEDIA", fixedVersion: "3.0.15" },
      ],
    },
  },
  {
    name: "ms-ophir-atm-ce-api",
    sonar: {
      ncloc: 8740, coverage: 90.5, newCoverage: 95.0, duplications: 0.4, sqaleIndex: 210,
      bugs: 0, vulnerabilities: 0, hotspotsToReview: 0, codeSmells: 28,
      reliabilityRating: "A", securityRating: "A", maintainabilityRating: "A", alertStatus: "OK",
    },
    trivy: {
      image: "accusystechnology/ms-ophir-atm-ce-api:1.0.4-6b2ad013",
      baseImage: "eclipse-temurin:17-jre-alpine",
      critical: 0, high: 2, medium: 5, low: 3, fixable: 8, unfixable: 2,
      findings: [
        { id: "CVE-2024-38809", package: "spring-core", version: "6.1.4", severity: "ALTA", fixedVersion: "6.1.12" },
        { id: "CVE-2024-22262", package: "openssl", version: "3.0.13", severity: "MEDIA", fixedVersion: "3.0.15" },
      ],
    },
  },
  {
    name: "ms-ophir-caja-api",
    sonar: {
      ncloc: 19640, coverage: 58.3, newCoverage: 72.6, duplications: 4.2, sqaleIndex: 3180,
      bugs: 7, vulnerabilities: 3, hotspotsToReview: 6, codeSmells: 388,
      reliabilityRating: "B", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
    },
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function inventoryFromYml(): AzdoProject[] {
  const file = loadProjectsConfig();
  return file.proyectos.map(p => ({
    key: p.key,
    name: p.name,
    azdoProject: p.azdoProject,
    leader: p.lider,
    reposTotal: p.repos.length,
    esPoc: p.esPoc,
    repos: p.repos.map(
      (r): Repo => ({
        name: r.name,
        publicaImagen: r.publicaImagen,
        sonarProjectName: r.sonarProjectName ?? null,
        sonarProjectKey: r.sonarProjectKey ?? null,
        sonar: null,
        trivy: null,
      }),
    ),
  }));
}

function applyGema(projects: AzdoProject[], fecha: string, analyzed: number, withTrivy: number): void {
  const gema = projects.find(p => p.key === "gema");
  if (!gema) throw new Error("Falta el proyecto gema en projects.yml");
  const seeds = GEMA_SEEDS.slice(0, analyzed);
  for (const seed of seeds) {
    const repo = gema.repos.find(r => r.name === seed.name);
    if (!repo) continue;
    if (seed.sonar) {
      repo.sonar = { ...seed.sonar, lastAnalysis: fecha };
    }
  }
  const trivySeeds = GEMA_SEEDS.filter(s => s.trivy).slice(0, withTrivy);
  for (const seed of trivySeeds) {
    const repo = gema.repos.find(r => r.name === seed.name);
    if (!repo || !seed.trivy) continue;
    repo.trivy = { ...clone(seed.trivy), scanDate: fecha, buildId: `${fecha.replaceAll("-", "")}.1` };
  }
}

/** Tres (o más) snapshots de fixture: inventario completo + métricas plausibles de Gema. */
export function buildFixtureSnapshot(fecha: string, analyzed: number, withTrivy: number): ScanSnapshot {
  const file = loadProjectsConfig();
  const projects = inventoryFromYml();
  applyGema(projects, fecha, analyzed, withTrivy);
  return {
    fecha,
    organizacionAzdo: file.organizacionAzdo,
    organizacionSonar: file.organizacionSonar,
    projects,
  };
}

export const FIXTURE_DATES: { fecha: string; analyzed: number; withTrivy: number }[] = [
  { fecha: "2026-09-21", analyzed: 4, withTrivy: 3 },
  { fecha: "2026-09-22", analyzed: 5, withTrivy: 4 },
  { fecha: "2026-09-23", analyzed: 6, withTrivy: 5 },
];

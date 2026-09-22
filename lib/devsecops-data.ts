// ─────────────────────────────────────────────────────────────────────────────
// DATOS DE MUESTRA DEL CANVAS DEVSECOPS
//
// Este es el ÚNICO archivo con datos. Para pasar a datos reales alcanza con
// reemplazar las constantes exportadas acá por la lectura del snapshot JSON que
// produzca el colector (contrato definido en el plan) y poner ES_MUESTRA = false.
// Nada de lo que está debajo de lib/devsecops-metrics.ts ni de components/
// conoce el origen de los datos.
//
// Reales: el inventario de proyectos, su cantidad de repos, los 15 repos de
// Gema/Ophir y la nomenclatura de SonarQube Cloud.
// De muestra: todas las métricas, los uuid de los project key y los referentes.
// ─────────────────────────────────────────────────────────────────────────────

export const ES_MUESTRA = true;

export type Rating = "A" | "B" | "C" | "D" | "E";
export type EstadoGate = "OK" | "ERROR" | "WARN";

export interface SonarMetrics {
  ncloc: number;
  coverage: number;
  newCoverage: number;
  duplications: number;
  /** Deuda técnica en minutos (sqale_index). */
  sqaleIndex: number;
  bugs: number;
  vulnerabilities: number;
  hotspotsToReview: number;
  codeSmells: number;
  reliabilityRating: Rating;
  securityRating: Rating;
  maintainabilityRating: Rating;
  alertStatus: EstadoGate;
  lastAnalysis: string;
}

export interface TrivyMetrics {
  image: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  fixable: number;
  unfixable: number;
  buildId: string;
  scanDate: string;
}

export interface RepoSample {
  name: string;
  /** Nombre del proyecto en Sonar: `projectname_repository-name`. */
  sonarProjectName: string | null;
  /** Project key en Sonar: `projectname_repository-name_uuid`. null = todavía sin proyecto. */
  sonarProjectKey: string | null;
  /** Si el repo publica una imagen de contenedor: define si entra al denominador de Trivy. */
  publicaImagen: boolean;
  sonar: SonarMetrics | null;
  trivy: TrivyMetrics | null;
  /** Análisis registrados en cada scan del histórico, para el heatmap. */
  actividad: number[];
}

export interface ProyectoSample {
  key: string;
  /** Nombre completo del cuadro de inventario, para el detalle. */
  name: string;
  /** Nombre corto, para las tablas. */
  nombreCorto: string;
  /** Nombre del proyecto en Azure DevOps: prefijo de la nomenclatura de Sonar y del enlace. */
  azdoProject: string;
  /** Repos totales del proyecto según el inventario de Azure DevOps. */
  reposTotal: number;
  /** Repos que publican imagen de contenedor: denominador de la adopción de Trivy. */
  reposConImagen: number;
  /** Líder técnico del proyecto. */
  lider: string;
  esPoc?: boolean;
  repos: RepoSample[];
  /** Repos con análisis de Sonar en cada scan del histórico (sparkline). */
  historial: number[];
}

export interface ScanHistorico {
  fecha: string;
  reposConSonar: number;
  reposConTrivy: number;
  criticos: number;
  deudaDias: number;
  cobertura: number;
}

export interface ImagenBase {
  imagen: string;
  criticosUnicos: number;
  altosUnicos: number;
  reposAfectados: number;
  proyectosAfectados: number;
  finDeSoporte?: boolean;
  tendencia: number[];
}

export interface CveTransversal {
  cve: string;
  paquete: string;
  version: string;
  severidad: "CRÍTICA" | "ALTA" | "MEDIA" | "BAJA";
  reposAfectados: number;
  versionCorregida: string | null;
}

export const ORGANIZACION = "accusystechnology";
export const SONAR_ORG = "accusys";
export const AZDO_BASE_URL = `https://dev.azure.com/${ORGANIZACION}`;
export const SONAR_BASE_URL = "https://sonarcloud.io";

/** Fase 1: Trivy solo escanea imágenes de contenedor (ni dependencias ni IaC). */
export const ALCANCE_TRIVY = "Solo imágenes de contenedor";

export const SCAN_ACTUAL = "2026-09-21";

/** Últimos 14 scans, equivalente al "Last 17 scans" del tablero de obsolescencia. */
export const HISTORIAL_SCANS: ScanHistorico[] = [
  { fecha: "2026-09-08", reposConSonar: 1, reposConTrivy: 0, criticos: 2, deudaDias: 12, cobertura: 84.2 },
  { fecha: "2026-09-09", reposConSonar: 2, reposConTrivy: 1, criticos: 4, deudaDias: 24, cobertura: 80.1 },
  { fecha: "2026-09-10", reposConSonar: 4, reposConTrivy: 2, criticos: 7, deudaDias: 46, cobertura: 74.6 },
  { fecha: "2026-09-11", reposConSonar: 6, reposConTrivy: 3, criticos: 11, deudaDias: 71, cobertura: 70.2 },
  { fecha: "2026-09-12", reposConSonar: 7, reposConTrivy: 5, criticos: 14, deudaDias: 88, cobertura: 68.4 },
  { fecha: "2026-09-14", reposConSonar: 11, reposConTrivy: 8, criticos: 21, deudaDias: 131, cobertura: 64.8 },
  { fecha: "2026-09-15", reposConSonar: 13, reposConTrivy: 11, criticos: 26, deudaDias: 168, cobertura: 62.1 },
  { fecha: "2026-09-16", reposConSonar: 15, reposConTrivy: 13, criticos: 31, deudaDias: 199, cobertura: 60.7 },
  { fecha: "2026-09-17", reposConSonar: 18, reposConTrivy: 15, criticos: 36, deudaDias: 232, cobertura: 59.4 },
  { fecha: "2026-09-18", reposConSonar: 21, reposConTrivy: 18, criticos: 40, deudaDias: 268, cobertura: 58.8 },
  { fecha: "2026-09-19", reposConSonar: 24, reposConTrivy: 21, criticos: 43, deudaDias: 301, cobertura: 58.2 },
  { fecha: "2026-09-20", reposConSonar: 28, reposConTrivy: 24, criticos: 47, deudaDias: 357, cobertura: 57.8 },
  { fecha: "2026-09-21", reposConSonar: 29, reposConTrivy: 25, criticos: 46, deudaDias: 381, cobertura: 57.6 },
  { fecha: "2026-09-21", reposConSonar: 30, reposConTrivy: 26, criticos: 45, deudaDias: 391, cobertura: 57.5 },
];

function sonar(m: Partial<SonarMetrics> & Pick<SonarMetrics, "ncloc">): SonarMetrics {
  return {
    coverage: 0,
    newCoverage: 0,
    duplications: 0,
    sqaleIndex: 0,
    bugs: 0,
    vulnerabilities: 0,
    hotspotsToReview: 0,
    codeSmells: 0,
    reliabilityRating: "A",
    securityRating: "A",
    maintainabilityRating: "A",
    alertStatus: "OK",
    lastAnalysis: SCAN_ACTUAL,
    ...m,
  };
}

function trivy(image: string, m: Partial<TrivyMetrics>): TrivyMetrics {
  return {
    image,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    fixable: 0,
    unfixable: 0,
    buildId: "20260921.1",
    scanDate: SCAN_ACTUAL,
    ...m,
  };
}

/**
 * Nomenclatura acordada para SonarQube Cloud. El uuid no se infiere del nombre:
 * el colector tiene que guardarlo en su mapeo. Los de acá son de muestra.
 */
function sonarKeys(azdoProject: string, repo: string, uuid: string) {
  return {
    sonarProjectName: `${azdoProject}_${repo}`,
    sonarProjectKey: `${azdoProject}_${repo}_${uuid}`,
  };
}

/** Repo detectado en Azure DevOps pero todavía sin proyecto en Sonar. */
function repoSinAnalizar(name: string, publicaImagen = true): RepoSample {
  return {
    name,
    sonarProjectName: null,
    sonarProjectKey: null,
    publicaImagen,
    sonar: null,
    trivy: null,
    actividad: new Array(HISTORIAL_SCANS.length).fill(0),
  };
}

/**
 * Inventario de los 12 proyectos de Azure DevOps (118 repos) más Gema/Ophir,
 * que es el único con análisis reales en la Fase 1 del plan.
 */
export const PROYECTOS: ProyectoSample[] = [
  {
    key: "gema",
    name: "Gema - Ophir",
    nombreCorto: "Gema",
    azdoProject: "gema",
    reposTotal: 15,
    reposConImagen: 15,
    lider: "Sebastián Denezio",
    esPoc: true,
    historial: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 6, 6],
    repos: [
      {
        name: "mf-ophir-migrador-app",
        ...sonarKeys("gema", "mf-ophir-migrador-app", "3f7a21c8-9b04-4d61-a5e2-71c0b9d4e830"),
        publicaImagen: true,
        actividad: [0, 0, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1],
        sonar: sonar({
          ncloc: 31480, coverage: 71.4, newCoverage: 76.3, duplications: 2.4, sqaleIndex: 2680,
          bugs: 5, vulnerabilities: 2, hotspotsToReview: 4, codeSmells: 312,
          reliabilityRating: "B", securityRating: "A", maintainabilityRating: "A", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/mf-ophir-migrador-app:0.4.2-a91c3f01", {
          critical: 1, high: 4, medium: 12, low: 7, fixable: 17, unfixable: 7,
        }),
      },
      {
        name: "ms-ophir-api",
        ...sonarKeys("gema", "ms-ophir-api", "9c1e4b22-0a7d-4f38-b6c1-2e5d8f4a9017"),
        publicaImagen: true,
        actividad: [1, 1, 2, 1, 1, 2, 3, 2, 1, 2, 2, 3, 2, 1],
        sonar: sonar({
          ncloc: 48210, coverage: 84.2, newCoverage: 91.5, duplications: 1.8, sqaleIndex: 1420,
          bugs: 3, vulnerabilities: 1, hotspotsToReview: 2, codeSmells: 187,
          reliabilityRating: "A", securityRating: "A", maintainabilityRating: "A", alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/ms-ophir-api:0.0.1-75ff6212", {
          critical: 0, high: 0, medium: 6, low: 3, fixable: 6, unfixable: 3,
        }),
      },
      {
        name: "ms-ophir-app",
        ...sonarKeys("gema", "ms-ophir-app", "5d8b03fa-6c41-4a92-9e07-b31f7c2d6a45"),
        publicaImagen: true,
        actividad: [0, 0, 1, 2, 2, 3, 2, 3, 2, 2, 3, 2, 2, 2],
        sonar: sonar({
          ncloc: 62940, coverage: 62.8, newCoverage: 80.4, duplications: 3.6, sqaleIndex: 5210,
          bugs: 9, vulnerabilities: 3, hotspotsToReview: 7, codeSmells: 540,
          reliabilityRating: "B", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/ms-ophir-app:2.1.0-c47ab920", {
          critical: 2, high: 9, medium: 21, low: 14, fixable: 26, unfixable: 20,
        }),
      },
      {
        name: "ms-ophir-arqueo-atm-api",
        ...sonarKeys("gema", "ms-ophir-arqueo-atm-api", "a24f9e17-3d58-4b06-8c1a-0f6e2b93d574"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 2, 1, 1],
        sonar: sonar({
          ncloc: 12360, coverage: 79.1, newCoverage: 88.2, duplications: 0.9, sqaleIndex: 640,
          bugs: 1, vulnerabilities: 0, hotspotsToReview: 1, codeSmells: 74,
          alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/ms-ophir-arqueo-atm-api:0.2.7-1de99ab4", {
          critical: 0, high: 1, medium: 4, low: 2, fixable: 5, unfixable: 2,
        }),
      },
      {
        name: "ms-ophir-atm-ce-api",
        ...sonarKeys("gema", "ms-ophir-atm-ce-api", "7b06c3d9-52e1-4870-9af3-4c8d1e07b2a6"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
        sonar: sonar({
          ncloc: 8740, coverage: 90.5, newCoverage: 95.0, duplications: 0.4, sqaleIndex: 210,
          bugs: 0, vulnerabilities: 0, hotspotsToReview: 0, codeSmells: 28,
          alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/ms-ophir-atm-ce-api:1.0.4-6b2ad013", {
          critical: 0, high: 2, medium: 5, low: 3, fixable: 8, unfixable: 2,
        }),
      },
      {
        name: "ms-ophir-caja-api",
        ...sonarKeys("gema", "ms-ophir-caja-api", "e18d5a40-7f29-4c13-b0d6-93a2f5c81e7b"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        sonar: sonar({
          ncloc: 19640, coverage: 58.3, newCoverage: 72.6, duplications: 4.2, sqaleIndex: 3180,
          bugs: 7, vulnerabilities: 3, hotspotsToReview: 6, codeSmells: 388,
          reliabilityRating: "B", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        // Publica imagen pero todavía no pasó por el paso de Trivy en el pipeline.
        trivy: null,
      },
      repoSinAnalizar("ms-ophir-calendario-api"),
      repoSinAnalizar("ms-ophir-costos-api"),
      repoSinAnalizar("ms-ophir-geolocation-api"),
      repoSinAnalizar("ms-ophir-learning-api"),
      repoSinAnalizar("ms-ophir-messaging-api"),
      repoSinAnalizar("ms-ophir-migrador-api"),
      repoSinAnalizar("ms-ophir-proyecciones-api"),
      repoSinAnalizar("ms-ophir-remesa-api"),
      repoSinAnalizar("ms-ophir-reportes-api"),
    ],
  },
  {
    key: "cronos",
    name: "Mep - Cronos",
    nombreCorto: "Cronos",
    azdoProject: "mep-cronos",
    reposTotal: 15,
    reposConImagen: 13,
    lider: "Fernando Luna",
    historial: [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6],
    repos: [
      {
        name: "ms-cronos-liquidacion",
        ...sonarKeys("mep-cronos", "ms-cronos-liquidacion", "1a93f70c-4d26-4e85-92b7-6c0d8a31f5e4"),
        publicaImagen: true,
        actividad: [0, 0, 0, 1, 1, 2, 1, 2, 2, 1, 2, 3, 2, 2],
        sonar: sonar({
          ncloc: 98420, coverage: 54.3, newCoverage: 68.1, duplications: 4.2, sqaleIndex: 14380,
          bugs: 27, vulnerabilities: 9, hotspotsToReview: 18, codeSmells: 1840,
          reliabilityRating: "C", securityRating: "C", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/ms-cronos-liquidacion:5.3.1-8b02ee71", {
          critical: 3, high: 14, medium: 38, low: 22, fixable: 49, unfixable: 28,
        }),
      },
      {
        name: "ms-cronos-afiliaciones",
        ...sonarKeys("mep-cronos", "ms-cronos-afiliaciones", "b5720ed1-8c34-4f09-a6d2-17e93b04c8f6"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 2, 2, 1],
        sonar: sonar({
          ncloc: 45120, coverage: 66.7, newCoverage: 81.3, duplications: 2.1, sqaleIndex: 5240,
          bugs: 11, vulnerabilities: 3, hotspotsToReview: 6, codeSmells: 620,
          reliabilityRating: "B", securityRating: "B", maintainabilityRating: "A", alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/ms-cronos-afiliaciones:4.0.9-30ca1b77", {
          critical: 1, high: 6, medium: 18, low: 11, fixable: 24, unfixable: 12,
        }),
      },
      {
        name: "web-cronos-portal",
        ...sonarKeys("mep-cronos", "web-cronos-portal", "46c8d012-9a75-4b3e-8f14-2d6b07e5a9c3"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 1, 2, 1, 2, 2, 2, 3, 2],
        sonar: sonar({
          ncloc: 71340, coverage: 41.2, newCoverage: 62.5, duplications: 5.8, sqaleIndex: 11260,
          bugs: 19, vulnerabilities: 7, hotspotsToReview: 14, codeSmells: 1320,
          reliabilityRating: "C", securityRating: "C", maintainabilityRating: "C", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/web-cronos-portal:3.7.4-fe1290bb", {
          critical: 4, high: 12, medium: 30, low: 19, fixable: 41, unfixable: 24,
        }),
      },
      {
        name: "ms-cronos-archivos",
        ...sonarKeys("mep-cronos", "ms-cronos-archivos", "c907b3e5-1f48-42d6-95a0-8b3e7d21c064"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 1],
        sonar: sonar({
          ncloc: 22180, coverage: 73.9, newCoverage: 85.4, duplications: 1.6, sqaleIndex: 2140,
          bugs: 6, vulnerabilities: 1, hotspotsToReview: 3, codeSmells: 268,
          reliabilityRating: "B", alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/ms-cronos-archivos:1.8.0-5a77bc02", {
          critical: 0, high: 3, medium: 9, low: 5, fixable: 12, unfixable: 5,
        }),
      },
      {
        name: "batch-cronos-cierre",
        ...sonarKeys("mep-cronos", "batch-cronos-cierre", "2e64a819-7b0d-4c53-81f9-a5d072e4b638"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        sonar: sonar({
          ncloc: 33870, coverage: 28.4, newCoverage: 34.7, duplications: 6.4, sqaleIndex: 9820,
          bugs: 22, vulnerabilities: 11, hotspotsToReview: 21, codeSmells: 1104,
          reliabilityRating: "D", securityRating: "D", maintainabilityRating: "C", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/batch-cronos-cierre:2.2.3-c0bb4419", {
          critical: 5, high: 17, medium: 42, low: 26, fixable: 58, unfixable: 32,
        }),
      },
      {
        name: "lib-cronos-modelo",
        ...sonarKeys("mep-cronos", "lib-cronos-modelo", "f3510c7b-6e92-4a08-b4d7-09c81f5a2e63"),
        publicaImagen: false,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        sonar: sonar({
          ncloc: 15640, coverage: 88.1, newCoverage: 93.2, duplications: 0.7, sqaleIndex: 480,
          bugs: 1, vulnerabilities: 0, hotspotsToReview: 0, codeSmells: 92, alertStatus: "OK",
        }),
        trivy: null,
      },
      repoSinAnalizar("ms-cronos-auditoria"),
    ],
  },
  {
    key: "iris",
    name: "Accusys Link - Iris",
    nombreCorto: "Iris",
    azdoProject: "accusys-link-iris",
    reposTotal: 15,
    reposConImagen: 13,
    lider: "Ivette Guevara",
    historial: [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4],
    repos: [
      {
        name: "ms-iris-link-gateway",
        ...sonarKeys("accusys-link-iris", "ms-iris-link-gateway", "8d2b6f04-3a17-49e5-b0c8-52f71d9e3a40"),
        publicaImagen: true,
        actividad: [0, 0, 1, 1, 2, 1, 2, 2, 1, 2, 1, 2, 2, 1],
        sonar: sonar({
          ncloc: 56780, coverage: 77.5, newCoverage: 89.6, duplications: 1.4, sqaleIndex: 3420,
          bugs: 4, vulnerabilities: 2, hotspotsToReview: 3, codeSmells: 288, alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/ms-iris-link-gateway:6.1.2-9ce10b4a", {
          critical: 1, high: 5, medium: 14, low: 8, fixable: 20, unfixable: 8,
        }),
      },
      {
        name: "ms-iris-conciliacion",
        ...sonarKeys("accusys-link-iris", "ms-iris-conciliacion", "0c7e491a-5d83-4620-97bf-e14a63d05c82"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 2, 1, 1],
        sonar: sonar({
          ncloc: 38210, coverage: 69.3, newCoverage: 79.8, duplications: 2.8, sqaleIndex: 4860,
          bugs: 9, vulnerabilities: 4, hotspotsToReview: 8, codeSmells: 512,
          reliabilityRating: "B", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/ms-iris-conciliacion:2.9.0-b7cd3320", {
          critical: 2, high: 8, medium: 20, low: 12, fixable: 29, unfixable: 13,
        }),
      },
      {
        name: "web-iris-consola",
        ...sonarKeys("accusys-link-iris", "web-iris-consola", "63af2d58-0b91-4e74-a3c6-8f07b52d1e49"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 2, 1],
        sonar: sonar({
          ncloc: 44960, coverage: 51.7, newCoverage: 73.4, duplications: 4.9, sqaleIndex: 8140,
          bugs: 14, vulnerabilities: 5, hotspotsToReview: 11, codeSmells: 970,
          reliabilityRating: "C", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/web-iris-consola:1.4.6-ad0f7712", {
          critical: 1, high: 7, medium: 24, low: 15, fixable: 32, unfixable: 15,
        }),
      },
      {
        name: "lib-iris-sdk",
        ...sonarKeys("accusys-link-iris", "lib-iris-sdk", "d41569b2-8c07-43fa-9e15-7b2064a3f8d1"),
        publicaImagen: false,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        sonar: sonar({
          ncloc: 9840, coverage: 85.2, newCoverage: 92.1, duplications: 0.6, sqaleIndex: 320,
          bugs: 0, vulnerabilities: 0, hotspotsToReview: 1, codeSmells: 41, alertStatus: "OK",
        }),
        trivy: null,
      },
      repoSinAnalizar("ms-iris-eventos"),
    ],
  },
  {
    key: "apolo",
    name: "Sidef - Apolo",
    nombreCorto: "Apolo",
    azdoProject: "sidef-apolo",
    reposTotal: 8,
    reposConImagen: 7,
    lider: "Javier Montiel",
    historial: [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3],
    repos: [
      {
        name: "ms-apolo-sidef-core",
        ...sonarKeys("sidef-apolo", "ms-apolo-sidef-core", "5b8c07e3-2d19-4f60-a874-13e9c05b7df2"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 1, 1, 2, 1, 2, 1, 2, 2, 1, 2],
        sonar: sonar({
          ncloc: 67420, coverage: 58.9, newCoverage: 74.2, duplications: 3.9, sqaleIndex: 10480,
          bugs: 18, vulnerabilities: 6, hotspotsToReview: 13, codeSmells: 1210,
          reliabilityRating: "C", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/ms-apolo-sidef-core:8.0.4-6f3ba912", {
          critical: 2, high: 10, medium: 27, low: 16, fixable: 38, unfixable: 17,
        }),
      },
      {
        name: "web-apolo-admin",
        ...sonarKeys("sidef-apolo", "web-apolo-admin", "a70d41f6-9e25-4b83-80c1-6f3d2a95e074"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1],
        sonar: sonar({
          ncloc: 29340, coverage: 64.1, newCoverage: 83.7, duplications: 2.2, sqaleIndex: 3680,
          bugs: 7, vulnerabilities: 2, hotspotsToReview: 5, codeSmells: 430,
          reliabilityRating: "B", alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/web-apolo-admin:1.2.0-70dd8a41", {
          critical: 0, high: 4, medium: 13, low: 9, fixable: 18, unfixable: 8,
        }),
      },
      {
        name: "batch-apolo-importacion",
        ...sonarKeys("sidef-apolo", "batch-apolo-importacion", "27e9b5c0-4a36-41d8-b962-0d81f7c34e5a"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
        sonar: sonar({
          ncloc: 18760, coverage: 35.6, newCoverage: 48.3, duplications: 5.1, sqaleIndex: 6240,
          bugs: 13, vulnerabilities: 8, hotspotsToReview: 15, codeSmells: 702,
          reliabilityRating: "D", securityRating: "C", maintainabilityRating: "C", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/batch-apolo-importacion:0.9.1-11ac67f0", {
          critical: 3, high: 11, medium: 25, low: 14, fixable: 37, unfixable: 16,
        }),
      },
    ],
  },
  {
    key: "zeus",
    name: "Mep Contable - Zeus",
    nombreCorto: "Zeus",
    azdoProject: "mep-contable-zeus",
    reposTotal: 8,
    reposConImagen: 7,
    lider: "Eduardo Fabaro",
    historial: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2],
    repos: [
      {
        name: "ms-zeus-contable",
        ...sonarKeys("mep-contable-zeus", "ms-zeus-contable", "94f0c1a7-6b58-4d23-8e70-3a5c19b06f2d"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 2, 1, 1],
        sonar: sonar({
          ncloc: 52180, coverage: 46.8, newCoverage: 71.5, duplications: 4.6, sqaleIndex: 9640,
          bugs: 16, vulnerabilities: 7, hotspotsToReview: 12, codeSmells: 1080,
          reliabilityRating: "C", securityRating: "C", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/ms-zeus-contable:7.4.0-2ea0cb38", {
          critical: 2, high: 9, medium: 22, low: 13, fixable: 31, unfixable: 15,
        }),
      },
      {
        name: "web-zeus-balances",
        ...sonarKeys("mep-contable-zeus", "web-zeus-balances", "6ea38b41-0c72-4956-a1df-85207e6b3c90"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
        sonar: sonar({
          ncloc: 24710, coverage: 72.4, newCoverage: 86.9, duplications: 1.9, sqaleIndex: 2360,
          bugs: 5, vulnerabilities: 1, hotspotsToReview: 4, codeSmells: 294,
          reliabilityRating: "B", alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/web-zeus-balances:0.6.2-88fe1d05", {
          critical: 0, high: 2, medium: 11, low: 6, fixable: 14, unfixable: 5,
        }),
      },
    ],
  },
  {
    key: "janus",
    name: "Pases y Cryl - Janus",
    nombreCorto: "Janus",
    azdoProject: "pases-y-cryl-janus",
    reposTotal: 7,
    reposConImagen: 6,
    lider: "Hernán Atencio",
    historial: [0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    repos: [
      {
        name: "ms-janus-pases",
        ...sonarKeys("pases-y-cryl-janus", "ms-janus-pases", "31d70e9b-8f46-42a1-95c3-7b0e4d2a6c18"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 2, 1, 2, 1],
        sonar: sonar({
          ncloc: 41360, coverage: 61.2, newCoverage: 78.4, duplications: 3.3, sqaleIndex: 6180,
          bugs: 12, vulnerabilities: 4, hotspotsToReview: 9, codeSmells: 684,
          reliabilityRating: "B", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/ms-janus-pases:3.1.5-4ba9c710", {
          critical: 1, high: 7, medium: 19, low: 10, fixable: 26, unfixable: 11,
        }),
      },
      {
        name: "ms-janus-cryl",
        ...sonarKeys("pases-y-cryl-janus", "ms-janus-cryl", "c58a2740-1e63-4b09-87d5-24f10b9e6a37"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        sonar: sonar({
          ncloc: 27890, coverage: 55.4, newCoverage: 69.2, duplications: 4.1, sqaleIndex: 5420,
          bugs: 10, vulnerabilities: 5, hotspotsToReview: 10, codeSmells: 596,
          reliabilityRating: "C", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/ms-janus-cryl:2.0.8-dc3f8821", {
          critical: 2, high: 8, medium: 21, low: 12, fixable: 30, unfixable: 13,
        }),
      },
    ],
  },
  {
    key: "argus",
    name: "Mep Consolidado - Argus",
    nombreCorto: "Argus",
    azdoProject: "mep-consolidado-argus",
    reposTotal: 6,
    reposConImagen: 5,
    lider: "Gustavo Troconis",
    historial: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
    repos: [
      {
        name: "ms-argus-consolidado",
        ...sonarKeys("mep-consolidado-argus", "ms-argus-consolidado", "7f43b921-5d08-4ec6-b310-96a2e07d4c85"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 1],
        sonar: sonar({
          ncloc: 34620, coverage: 68.9, newCoverage: 84.1, duplications: 2.5, sqaleIndex: 4120,
          bugs: 8, vulnerabilities: 3, hotspotsToReview: 6, codeSmells: 468,
          reliabilityRating: "B", alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/ms-argus-consolidado:1.1.3-0fa7ce16", {
          critical: 1, high: 5, medium: 16, low: 9, fixable: 22, unfixable: 9,
        }),
      },
    ],
  },
  {
    key: "afrodita",
    name: "Mep Cedin - Afrodita",
    nombreCorto: "Afrodita",
    azdoProject: "mep-cedin-afrodita",
    reposTotal: 5,
    reposConImagen: 4,
    lider: "Lisbeth Atencio",
    historial: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    repos: [
      {
        name: "ms-afrodita-cedin",
        ...sonarKeys("mep-cedin-afrodita", "ms-afrodita-cedin", "0b96e5d3-7c21-4a48-92f0-5d13b807e6a4"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
        sonar: sonar({
          ncloc: 19480, coverage: 43.7, newCoverage: 58.6, duplications: 5.4, sqaleIndex: 5860,
          bugs: 11, vulnerabilities: 6, hotspotsToReview: 12, codeSmells: 640,
          reliabilityRating: "C", securityRating: "C", maintainabilityRating: "C", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/ms-afrodita-cedin:0.3.4-73b1ee29", {
          critical: 2, high: 9, medium: 18, low: 11, fixable: 27, unfixable: 13,
        }),
      },
    ],
  },
  {
    key: "probatch",
    name: "Probatch",
    nombreCorto: "Probatch",
    azdoProject: "probatch",
    reposTotal: 35,
    reposConImagen: 30,
    lider: "Leonardo Orellana",
    historial: [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5],
    repos: [
      {
        name: "ms-probatch-scheduler",
        ...sonarKeys("probatch", "ms-probatch-scheduler", "e2704bc8-3f19-45d7-86a0-1b9e5c04d372"),
        publicaImagen: true,
        actividad: [0, 1, 1, 2, 1, 2, 1, 2, 2, 1, 2, 3, 2, 2],
        sonar: sonar({
          ncloc: 76240, coverage: 71.8, newCoverage: 87.3, duplications: 2.0, sqaleIndex: 7480,
          bugs: 13, vulnerabilities: 4, hotspotsToReview: 9, codeSmells: 892,
          reliabilityRating: "B", alertStatus: "OK",
        }),
        trivy: trivy("accusystechnology/ms-probatch-scheduler:9.2.0-e1cc5a70", {
          critical: 1, high: 6, medium: 20, low: 12, fixable: 27, unfixable: 12,
        }),
      },
      {
        name: "ms-probatch-ejecutor",
        ...sonarKeys("probatch", "ms-probatch-ejecutor", "48b1d0f7-9a62-4c35-b7e8-20d64a19f503"),
        publicaImagen: true,
        actividad: [0, 0, 0, 1, 1, 1, 2, 1, 2, 2, 1, 2, 2, 2],
        sonar: sonar({
          ncloc: 89610, coverage: 63.4, newCoverage: 80.9, duplications: 3.1, sqaleIndex: 12640,
          bugs: 21, vulnerabilities: 8, hotspotsToReview: 16, codeSmells: 1480,
          reliabilityRating: "C", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/ms-probatch-ejecutor:9.2.0-5d0bb731", {
          critical: 3, high: 13, medium: 34, low: 20, fixable: 47, unfixable: 23,
        }),
      },
      {
        name: "web-probatch-monitor",
        ...sonarKeys("probatch", "web-probatch-monitor", "9350af26-0d84-4b17-a6c9-73e5f218b0d4"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1],
        sonar: sonar({
          ncloc: 38470, coverage: 57.2, newCoverage: 76.8, duplications: 4.4, sqaleIndex: 6920,
          bugs: 12, vulnerabilities: 5, hotspotsToReview: 10, codeSmells: 810,
          reliabilityRating: "B", securityRating: "B", maintainabilityRating: "B", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/web-probatch-monitor:4.5.1-ff21ac98", {
          critical: 1, high: 8, medium: 23, low: 14, fixable: 31, unfixable: 15,
        }),
      },
      {
        name: "lib-probatch-core",
        ...sonarKeys("probatch", "lib-probatch-core", "175cb840-6e93-4207-8daf-c5e21b90a476"),
        publicaImagen: false,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        sonar: sonar({
          ncloc: 44180, coverage: 82.6, newCoverage: 90.4, duplications: 1.1, sqaleIndex: 1840,
          bugs: 2, vulnerabilities: 1, hotspotsToReview: 2, codeSmells: 216, alertStatus: "OK",
        }),
        trivy: null,
      },
      {
        name: "batch-probatch-legacy",
        ...sonarKeys("probatch", "batch-probatch-legacy", "b6d02e59-4173-48ca-90b7-e8f35d17c2a0"),
        publicaImagen: true,
        actividad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        sonar: sonar({
          ncloc: 124860, coverage: 12.3, newCoverage: 21.7, duplications: 8.9, sqaleIndex: 31420,
          bugs: 58, vulnerabilities: 24, hotspotsToReview: 41, codeSmells: 3640,
          reliabilityRating: "E", securityRating: "D", maintainabilityRating: "D", alertStatus: "ERROR",
        }),
        trivy: trivy("accusystechnology/batch-probatch-legacy:1.0.0-9917bb20", {
          critical: 7, high: 26, medium: 61, low: 38, fixable: 79, unfixable: 53,
        }),
      },
      repoSinAnalizar("ms-probatch-plugins"),
    ],
  },
  // ── Proyectos con adopción en cero ────────────────────────────────────────
  {
    key: "themis",
    name: "Repi - Themis",
    nombreCorto: "Themis",
    azdoProject: "repi-themis",
    reposTotal: 5,
    reposConImagen: 4,
    lider: "Braian Rosales",
    historial: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    repos: [
      repoSinAnalizar("ms-themis-repi"),
      repoSinAnalizar("ms-themis-repi-consultas"),
      repoSinAnalizar("web-themis-repi"),
      repoSinAnalizar("batch-themis-cargas"),
      repoSinAnalizar("lib-themis-comun", false),
    ],
  },
  {
    key: "minerva",
    name: "Niif - Minerva",
    nombreCorto: "Minerva",
    azdoProject: "niif-minerva",
    reposTotal: 5,
    reposConImagen: 4,
    lider: "Pablo Gálvez",
    historial: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    repos: [],
  },
  {
    key: "hades",
    name: "Mep SML - Hades",
    nombreCorto: "Hades",
    azdoProject: "mep-sml-hades",
    reposTotal: 5,
    reposConImagen: 4,
    lider: "Joshua García",
    historial: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    repos: [],
  },
  {
    key: "poseidon",
    name: "Mep Contingencia - Poseidón",
    nombreCorto: "Poseidón",
    azdoProject: "mep-contingencia-poseidon",
    reposTotal: 4,
    reposConImagen: 3,
    lider: "Lucas Gauna",
    historial: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    repos: [],
  },
];

/**
 * Top de imágenes base que concentran CVE críticos. Es el análogo de
 * "Widespread dependencies" del tablero de obsolescencia. Se ordena por
 * CVE críticos × repos afectados, que es el impacto real de actualizar la imagen.
 */
export const IMAGENES_BASE: ImagenBase[] = [
  { imagen: "eclipse-temurin:17-jre-alpine", criticosUnicos: 7, altosUnicos: 22, reposAfectados: 9, proyectosAfectados: 5, tendencia: [3, 3, 4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 7, 7] },
  { imagen: "node:20-alpine", criticosUnicos: 6, altosUnicos: 18, reposAfectados: 7, proyectosAfectados: 4, tendencia: [2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 6] },
  { imagen: "openjdk:11-jre-slim", criticosUnicos: 5, altosUnicos: 12, reposAfectados: 4, proyectosAfectados: 3, finDeSoporte: true, tendencia: [4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] },
  { imagen: "mcr.microsoft.com/dotnet/aspnet:8.0", criticosUnicos: 5, altosUnicos: 14, reposAfectados: 5, proyectosAfectados: 3, tendencia: [1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5] },
  { imagen: "nginx:1.25-alpine", criticosUnicos: 4, altosUnicos: 11, reposAfectados: 6, proyectosAfectados: 4, tendencia: [1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4] },
  { imagen: "python:3.11-slim", criticosUnicos: 3, altosUnicos: 9, reposAfectados: 3, proyectosAfectados: 2, tendencia: [0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3] },
  { imagen: "debian:12-slim", criticosUnicos: 2, altosUnicos: 7, reposAfectados: 3, proyectosAfectados: 2, tendencia: [0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2] },
  { imagen: "redis:7-alpine", criticosUnicos: 1, altosUnicos: 4, reposAfectados: 2, proyectosAfectados: 2, tendencia: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
];

/** CVE que aparecen en más de un repo, para priorizar remediaciones de una sola vez. */
export const CVES_TRANSVERSALES: CveTransversal[] = [
  { cve: "CVE-2026-31220", paquete: "libxml2", version: "2.12.7", severidad: "CRÍTICA", reposAfectados: 11, versionCorregida: "2.12.9" },
  { cve: "CVE-2026-28477", paquete: "openssl", version: "3.0.13", severidad: "CRÍTICA", reposAfectados: 9, versionCorregida: "3.0.15" },
  { cve: "CVE-2026-33712", paquete: "spring-core", version: "6.1.4", severidad: "CRÍTICA", reposAfectados: 6, versionCorregida: "6.1.12" },
  { cve: "CVE-2026-19499", paquete: "libc6", version: "2.39", severidad: "MEDIA", reposAfectados: 14, versionCorregida: "2.39-0ubuntu8.4" },
  { cve: "CVE-2026-20918", paquete: "jackson-databind", version: "2.15.2", severidad: "ALTA", reposAfectados: 7, versionCorregida: "2.17.1" },
  { cve: "CVE-2026-24061", paquete: "zlib1g", version: "1.3", severidad: "ALTA", reposAfectados: 8, versionCorregida: null },
  { cve: "CVE-2026-41055", paquete: "tar", version: "1.35", severidad: "ALTA", reposAfectados: 5, versionCorregida: null },
];

/** Condiciones del "QA Quality Gate" propio, para mostrarlas junto a los ratings. */
export const QUALITY_GATE = {
  nombre: "QA Quality Gate",
  alcance: "Solo código nuevo (Clean as You Code)",
  condiciones: [
    { metrica: "Issues", operador: "mayor que", valor: "0" },
    { metrica: "Security Hotspots revisados", operador: "menor que", valor: "100%" },
    { metrica: "Cobertura", operador: "menor que", valor: "80,0%" },
    { metrica: "Líneas duplicadas", operador: "mayor que", valor: "3,0%" },
    { metrica: "Rating de mantenibilidad", operador: "peor que", valor: "A" },
    { metrica: "Rating de confiabilidad", operador: "peor que", valor: "A" },
    { metrica: "Rating de seguridad", operador: "peor que", valor: "A" },
  ],
};

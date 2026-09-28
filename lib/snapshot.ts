/** Contrato del snapshot diario `data/scans/scan-YYYY-MM-DD.json`. */

export type Rating = "A" | "B" | "C" | "D" | "E";
export type EstadoGate = "OK" | "ERROR" | "WARN";
export type SeveridadCve = "CRÍTICA" | "ALTA" | "MEDIA" | "BAJA";

export interface SonarMetrics {
  ncloc: number;
  coverage: number;
  newCoverage: number;
  duplications: number;
  /** Deuda técnica en minutos (`sqale_index`). */
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

export interface TrivyFinding {
  id: string;
  package: string;
  version: string;
  severity: SeveridadCve;
  fixedVersion: string | null;
}

export type TrivyFuente = "pr" | "build";

export interface TrivyMetrics {
  image: string;
  /** Imagen base para el top transversal (p. ej. eclipse-temurin:17-jre-alpine). */
  baseImage: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  fixable: number;
  unfixable: number;
  buildId: string;
  scanDate: string;
  findings: TrivyFinding[];
  /** Pipeline ADO de origen (p. ej. ms-ophir-api-build). */
  pipeline?: string;
  /** Rama del build (p. ej. master). */
  rama?: string;
  fuente?: TrivyFuente;
}

export interface Repo {
  name: string;
  publicaImagen: boolean;
  /** `projectname_repository-name` */
  sonarProjectName: string | null;
  /** `projectname_repository-name_uuid` */
  sonarProjectKey: string | null;
  sonar: SonarMetrics | null;
  /** Último scan del pipeline *-pr. */
  trivyPr?: TrivyMetrics | null;
  /** Último scan del pipeline *-build (master). */
  trivyBuild?: TrivyMetrics | null;
  /** Alias: trivyBuild ?? trivyPr (compat. snapshots viejos con solo `trivy`). */
  trivy: TrivyMetrics | null;
}

export interface AzdoProject {
  key: string;
  /** Siempre completo: "Gema - Ophir". */
  name: string;
  /** Nombre del proyecto en Azure DevOps (enlace y prefijo Sonar). */
  azdoProject: string;
  leader: string;
  reposTotal: number;
  esPoc?: boolean;
  repos: Repo[];
}

export interface ScanSnapshot {
  fecha: string;
  organizacionAzdo: string;
  organizacionSonar: string;
  projects: AzdoProject[];
}

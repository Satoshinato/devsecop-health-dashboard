import type { Repo, RenovateFinding, RenovateMetrics } from "../lib/snapshot.ts";

export const RENOVATE_HOST_DEFAULT = "https://renovate.shared.accusys.com.ar";

export interface RenovateReason {
  kind: string;
  detail: string;
}

export interface RenovateRepoFinding {
  repo: string;
  project: string;
  depName: string;
  version: string;
  source: string;
  reasons: RenovateReason[];
}

export interface RenovateDependencyUsage {
  project: string;
  repo: string;
}

export interface RenovateDependency {
  depName: string;
  version: string;
  source: string;
  usages: RenovateDependencyUsage[];
}

export interface RenovateProject {
  project: string;
  dependencyCount: number;
  total: number;
  deprecated: number;
  eol: number;
  repositories: Record<string, RenovateRepoFinding[]>;
}

export interface RenovateDashboard {
  generated: string;
  scanDate: string;
  scannedRepositoryCount?: number;
  metadata?: {
    pipelineUrl?: string;
  };
  projects: RenovateProject[];
  dependencies: RenovateDependency[];
}

export function renovateHostFromEnv(env: NodeJS.Dict<string | undefined> = process.env): string {
  const raw = env.RENOVATE_HOST?.trim() || RENOVATE_HOST_DEFAULT;
  return raw.replace(/\/+$/, "");
}

export async function fetchDependencyHealth(host = renovateHostFromEnv()): Promise<RenovateDashboard> {
  const res = await fetch(`${host}/api/data/dashboard`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Dependency Health dashboard: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as RenovateDashboard;
}

function repoSlug(azdoProject: string, repoName: string): string {
  return `${azdoProject}/${repoName}`;
}

function normalizeKind(kind: string): "eol" | "deprecated" | null {
  const k = kind.trim().toLowerCase();
  if (k === "eol") return "eol";
  if (k === "deprecated") return "deprecated";
  return null;
}

const dockerSources = new Set(["docker", "dockerfile"]);

export function reposPorProyecto(dashboard: RenovateDashboard): Map<string, string[]> {
  const map = new Map<string, Set<string>>();
  for (const dep of dashboard.dependencies) {
    for (const usage of dep.usages ?? []) {
      const project = usage.project;
      const full = usage.repo;
      const slash = full.indexOf("/");
      const name = slash >= 0 ? full.slice(slash + 1) : full;
      let set = map.get(project);
      if (!set) {
        set = new Set();
        map.set(project, set);
      }
      set.add(name);
    }
  }
  const out = new Map<string, string[]>();
  for (const [project, names] of map) {
    out.set(project, [...names].sort((a, b) => a.localeCompare(b)));
  }
  return out;
}

export function publicaImagenDe(
  dashboard: RenovateDashboard,
  azdoProject: string,
  repoName: string,
): boolean {
  const slug = repoSlug(azdoProject, repoName);
  for (const dep of dashboard.dependencies) {
    const source = dep.source?.toLowerCase() ?? "";
    if (!dockerSources.has(source)) continue;
    for (const usage of dep.usages ?? []) {
      if (usage.repo === slug) return true;
    }
  }
  return !repoName.startsWith("lib-");
}

export function metricasRepo(
  dashboard: RenovateDashboard,
  azdoProject: string,
  repoName: string,
): RenovateMetrics {
  const slug = repoSlug(azdoProject, repoName);
  const findings: RenovateFinding[] = [];
  const baseImages = new Set<string>();

  const projectEntry = dashboard.projects.find(p => p.project === azdoProject);
  const repoFindings = projectEntry?.repositories?.[slug] ?? [];
  for (const item of repoFindings) {
    for (const reason of item.reasons ?? []) {
      const kind = normalizeKind(reason.kind);
      if (!kind) continue;
      findings.push({
        depName: item.depName,
        version: item.version,
        source: item.source,
        kind,
        detail: reason.detail,
      });
    }
  }

  let dependencyCount = 0;
  for (const dep of dashboard.dependencies) {
    for (const usage of dep.usages ?? []) {
      if (usage.repo !== slug) continue;
      dependencyCount += 1;
      const source = dep.source?.toLowerCase() ?? "";
      if (dockerSources.has(source)) {
        baseImages.add(`${dep.depName}:${dep.version}`);
      }
    }
  }

  const eol = findings.filter(f => f.kind === "eol").length;
  const deprecated = findings.filter(f => f.kind === "deprecated").length;

  return {
    dependencyCount,
    eol,
    deprecated,
    baseImages: [...baseImages].sort(),
    scanDate: dashboard.scanDate,
    findings,
  };
}

export function enrichRenovate(
  azdoProject: string,
  repos: Repo[],
  dashboard: RenovateDashboard,
): void {
  for (const repo of repos) {
    const hasUsage = dashboard.dependencies.some(dep =>
      (dep.usages ?? []).some(u => u.repo === repoSlug(azdoProject, repo.name)),
    );
    const hasFindings = Boolean(
      dashboard.projects.find(p => p.project === azdoProject)?.repositories?.[
        repoSlug(azdoProject, repo.name)
      ],
    );
    repo.renovate = hasUsage || hasFindings ? metricasRepo(dashboard, azdoProject, repo.name) : null;
  }
}

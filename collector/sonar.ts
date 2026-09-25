import { SONAR_HOST_DEFAULT } from "../lib/quality-gate.ts";
import type { Rating, Repo, SonarMetrics } from "../lib/snapshot.ts";

const METRICS = [
  "ncloc",
  "coverage",
  "new_coverage",
  "duplicated_lines_density",
  "sqale_index",
  "bugs",
  "vulnerabilities",
  "security_hotspots_reviewed",
  "code_smells",
  "reliability_rating",
  "security_rating",
  "sqale_rating",
  "alert_status",
].join(",");

export interface SonarComponent {
  key: string;
  name: string;
}

export function sonarHostFromEnv(env: NodeJS.Dict<string | undefined> = process.env): string {
  const raw = env.SONAR_HOST?.trim() || SONAR_HOST_DEFAULT;
  return raw.replace(/\/+$/, "");
}

function ratingFrom(value: string | undefined): Rating {
  const n = Number(value ?? "1");
  if (n <= 1) return "A";
  if (n === 2) return "B";
  if (n === 3) return "C";
  if (n === 4) return "D";
  return "E";
}

function measureMap(measures: { metric: string; value?: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of measures) {
    if (m.value !== undefined) map[m.metric] = m.value;
  }
  return map;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Elige el componente Community que mejor matchea el repo del inventario. */
export function resolveSonarComponent(repo: Repo, catalog: SonarComponent[]): SonarComponent | null {
  const repoName = normalize(repo.name);
  const configuredKey = repo.sonarProjectKey ? normalize(repo.sonarProjectKey) : null;
  const configuredName = repo.sonarProjectName ? normalize(repo.sonarProjectName) : null;

  let best: { component: SonarComponent; score: number } | null = null;
  for (const component of catalog) {
    const key = normalize(component.key);
    const name = normalize(component.name);
    let score = 0;
    if (configuredKey && key === configuredKey) score = 100;
    else if (configuredName && (key === configuredName || name === configuredName)) score = 90;
    else if (key === repoName || name === repoName) score = 80;
    else if (
      key.endsWith(`_${repoName}`) ||
      key.endsWith(`:${repoName}`) ||
      key.endsWith(`/${repoName}`) ||
      key.includes(`_${repoName}_`)
    )
      score = 70;
    else if (name.endsWith(repoName) || name.includes(repoName)) score = 40;
    else if (key.includes(repoName)) score = 30;
    if (score > 0 && (!best || score > best.score)) {
      best = { component, score };
    }
  }
  if (!best || best.score < 70) return configuredKey ? catalog.find(c => normalize(c.key) === configuredKey) ?? null : null;
  return best.component;
}

export async function listSonarComponents(opts: {
  host: string;
  headers: HeadersInit;
}): Promise<SonarComponent[]> {
  const out: SonarComponent[] = [];
  let page = 1;
  const pageSize = 500;
  for (;;) {
    const url = new URL(`${opts.host}/api/components/search`);
    url.searchParams.set("qualifiers", "TRK");
    url.searchParams.set("ps", String(pageSize));
    url.searchParams.set("p", String(page));
    const res = await fetch(url, { headers: opts.headers });
    if (!res.ok) {
      console.warn(`Sonar catalog ${res.status}: ${await res.text()}`);
      break;
    }
    const body = (await res.json()) as {
      paging?: { total?: number };
      components?: { key?: string; name?: string }[];
    };
    const batch = (body.components ?? []).filter(c => c.key) as SonarComponent[];
    out.push(...batch.map(c => ({ key: c.key!, name: c.name ?? c.key! })));
    const total = body.paging?.total ?? out.length;
    if (out.length >= total || batch.length === 0) break;
    page += 1;
    if (page > 50) break;
  }
  return out;
}

async function fetchMeasures(
  host: string,
  headers: HeadersInit,
  componentKey: string,
  fecha: string,
): Promise<SonarMetrics | null> {
  const url = new URL(`${host}/api/measures/component`);
  url.searchParams.set("component", componentKey);
  url.searchParams.set("metricKeys", METRICS);
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    component?: { measures?: { metric: string; value?: string }[] };
  };
  const m = measureMap(body.component?.measures ?? []);
  const reviewed = Number(m.security_hotspots_reviewed ?? 100);
  return {
    ncloc: Number(m.ncloc ?? 0),
    coverage: Number(m.coverage ?? 0),
    newCoverage: Number(m.new_coverage ?? 0),
    duplications: Number(m.duplicated_lines_density ?? 0),
    sqaleIndex: Number(m.sqale_index ?? 0),
    bugs: Number(m.bugs ?? 0),
    vulnerabilities: Number(m.vulnerabilities ?? 0),
    hotspotsToReview: reviewed >= 100 ? 0 : 1,
    codeSmells: Number(m.code_smells ?? 0),
    reliabilityRating: ratingFrom(m.reliability_rating),
    securityRating: ratingFrom(m.security_rating),
    maintainabilityRating: ratingFrom(m.sqale_rating),
    alertStatus: (m.alert_status as SonarMetrics["alertStatus"]) ?? "ERROR",
    lastAnalysis: fecha,
  };
}

export async function enrichSonar(
  repos: Repo[],
  opts: {
    token: string;
    org: string;
    fecha: string;
    host?: string;
    catalog?: SonarComponent[];
  },
): Promise<void> {
  const host = (opts.host ?? sonarHostFromEnv()).replace(/\/+$/, "");
  const auth = Buffer.from(`${opts.token}:`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, Accept: "application/json" };

  const catalog =
    opts.catalog ?? (await listSonarComponents({ host, headers }));
  if (catalog.length === 0) {
    console.warn(`Sonar ${host}: catálogo vacío. Se intentan las keys del YAML.`);
  }

  for (const repo of repos) {
    const matched = catalog.length > 0 ? resolveSonarComponent(repo, catalog) : null;
    const key = matched?.key ?? repo.sonarProjectKey;
    if (!key) {
      repo.sonar = null;
      continue;
    }
    if (matched) {
      repo.sonarProjectKey = matched.key;
      repo.sonarProjectName = matched.name;
    }
    repo.sonar = await fetchMeasures(host, headers, key, opts.fecha);
  }
}

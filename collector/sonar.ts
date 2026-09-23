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

export async function enrichSonar(
  repos: Repo[],
  opts: { token: string; org: string; fecha: string },
): Promise<void> {
  const auth = Buffer.from(`${opts.token}:`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, Accept: "application/json" };

  for (const repo of repos) {
    if (!repo.sonarProjectKey) continue;
    const url = new URL("https://sonarcloud.io/api/measures/component");
    url.searchParams.set("component", repo.sonarProjectKey);
    url.searchParams.set("metricKeys", METRICS);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      repo.sonar = null;
      continue;
    }
    const body = (await res.json()) as {
      component?: { measures?: { metric: string; value?: string }[] };
    };
    const m = measureMap(body.component?.measures ?? []);
    const reviewed = Number(m.security_hotspots_reviewed ?? 100);
    const sonar: SonarMetrics = {
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
      lastAnalysis: opts.fecha,
    };
    repo.sonar = sonar;
  }
}

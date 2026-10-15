/**
 * Lista bugs abiertos en Sonar (API issues/search) y opcionalmente crea Bugs en Azure DevOps.
 *
 *   npx tsx scripts/gema-sonar-issues-ado.ts --repo=ms-ophir-app --limit=3
 *   npx tsx scripts/gema-sonar-issues-ado.ts --repo=ms-ophir-app --limit=3 --apply
 *
 * Env: SONAR_TOKEN, AZDO_PAT (solo con --apply)
 *      AZDO_ORG (default accusystechnology), AZDO_PROJECT (default qa)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sonarHostFromEnv, sonarIssueOpenUrl } from "../lib/sonar-links.ts";
import type { Repo, ScanSnapshot } from "../lib/snapshot.ts";

const GEMA_KEY = "gema";

interface SonarIssue {
  key: string;
  type: string;
  message: string;
  severity: string;
  component?: string;
  line?: number;
  rule?: string;
}

function argValue(prefix: string): string | undefined {
  const eq = prefix.endsWith("=") ? prefix : `${prefix}=`;
  const flag = eq.slice(0, -1);
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith(eq)) return arg.slice(eq.length);
    if (arg === flag && process.argv[i + 1] && !process.argv[i + 1].startsWith("-")) {
      return process.argv[i + 1];
    }
  }
  return undefined;
}

function loadGemaRepos(): Repo[] {
  const dash = join(process.cwd(), "public", "data", "dashboard.json");
  const path = existsSync(dash) ? dash : join(process.cwd(), "data", "gema", "scans", `scan-${new Date().toISOString().slice(0, 10)}.json`);
  if (!existsSync(path)) {
    throw new Error("No hay dashboard.json. Corré npm run scan -- --source=sonar y npm run gema:export");
  }
  const snap = JSON.parse(readFileSync(path, "utf8")) as ScanSnapshot;
  const gema = snap.projects.find(p => p.key === GEMA_KEY);
  if (!gema) throw new Error("No hay proyecto gema en el snapshot");
  return gema.repos;
}

async function fetchOpenBugs(componentKey: string, token: string): Promise<SonarIssue[]> {
  const host = sonarHostFromEnv();
  const auth = Buffer.from(`${token}:`).toString("base64");
  const out: SonarIssue[] = [];
  let page = 1;
  const ps = 100;
  for (;;) {
    const url = new URL(`${host}/api/issues/search`);
    url.searchParams.set("componentKeys", componentKey);
    url.searchParams.set("types", "BUG");
    url.searchParams.set("statuses", "OPEN,CONFIRMED,REOPENED");
    url.searchParams.set("ps", String(ps));
    url.searchParams.set("p", String(page));
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Sonar issues/search ${res.status}: ${await res.text()}`);
    }
    const body = (await res.json()) as {
      issues?: SonarIssue[];
      paging?: { total?: number; pageIndex?: number; pageSize?: number };
    };
    const batch = body.issues ?? [];
    out.push(...batch);
    const total = body.paging?.total ?? out.length;
    if (out.length >= total || batch.length === 0) break;
    page += 1;
    if (page > 20) break;
  }
  return out;
}

function shortPath(component: string | undefined): string {
  if (!component) return "?";
  const idx = component.indexOf(":");
  return idx >= 0 ? component.slice(idx + 1) : component;
}

function bugTitle(repoName: string, issue: SonarIssue): string {
  const file = shortPath(issue.component);
  const line = issue.line ?? "?";
  const rule = issue.rule ?? "sonar-rule";
  return `[Sonar][Bug] ${repoName} — ${rule} — ${file}:${line}`;
}

async function createAdoBug(opts: {
  org: string;
  project: string;
  pat: string;
  title: string;
  descriptionMarkdown: string;
  tags: string;
}): Promise<number> {
  const url =
    `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}` +
    `/_apis/wit/workitems/$Bug?api-version=7.1`;
  const auth = Buffer.from(`:${opts.pat}`).toString("base64");
  const body = [
    { op: "add", path: "/fields/System.Title", value: opts.title },
    { op: "add", path: "/fields/System.Description", value: opts.descriptionMarkdown },
    { op: "add", path: "/fields/System.Tags", value: opts.tags },
  ];
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`ADO create Bug ${res.status}: ${await res.text()}`);
  }
  const wi = (await res.json()) as { id?: number };
  if (!wi.id) throw new Error("ADO no devolvió id de work item");
  return wi.id;
}

async function main(): Promise<void> {
  const repoFilter = argValue("--repo=");
  const limit = Math.max(1, Number(argValue("--limit=") ?? "5"));
  const apply = process.argv.includes("--apply");
  const minBugs = Number(argValue("--min-bugs=") ?? "1");

  const token = process.env.SONAR_TOKEN;
  if (!token) throw new Error("Falta SONAR_TOKEN");

  const repos = loadGemaRepos().filter(r => {
    if (repoFilter && r.name !== repoFilter) return false;
    const bugs = r.sonar?.bugs ?? 0;
    if (!repoFilter && bugs < minBugs) return false;
    return Boolean(r.sonarProjectKey);
  });

  if (repos.length === 0) {
    console.log("Ningún repo cumple filtro (¿--repo= o sin sonarProjectKey?).");
    return;
  }

  const org = process.env.AZDO_ORG ?? "accusystechnology";
  const adoProject = process.env.AZDO_PROJECT ?? "qa";
  const pat = process.env.AZDO_PAT;

  if (apply && !pat) throw new Error("Falta AZDO_PAT para --apply");

  for (const repo of repos) {
    const key = repo.sonarProjectKey!;
    console.log(`\n=== ${repo.name} (${key}) — snapshot bugs: ${repo.sonar?.bugs ?? "?"} ===`);
    const issues = await fetchOpenBugs(key, token);
    console.log(`API issues/search: ${issues.length} bugs abiertos`);
    const slice = issues.slice(0, limit);

    for (const issue of slice) {
      const title = bugTitle(repo.name, issue);
      const issueUrl = sonarIssueOpenUrl(key, issue.key);
      const desc = [
        `**Sonar issue:** ${issue.key}`,
        `**Repo:** \`${repo.name}\``,
        `**Severidad Sonar:** ${issue.severity}`,
        "",
        issue.message,
        "",
        `**Link:** ${issueUrl}`,
        `**Component key:** \`${key}\``,
      ].join("\n");

      if (!apply) {
        console.log(`[dry-run] ${title}`);
        console.log(`          ${issueUrl}`);
        continue;
      }

      const id = await createAdoBug({
        org,
        project: adoProject,
        pat: pat!,
        title,
        descriptionMarkdown: desc,
        tags: "Sonar; Gema; DevSecOps",
      });
      console.log(`[ADO #${id}] ${title}`);
    }
  }

  if (!apply) {
    console.log("\nModo dry-run. Para crear WIs: agregá --apply y AZDO_PAT.");
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

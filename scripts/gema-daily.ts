/**
 * Export y delta de métricas Sonar solo para Gema (POC).
 *
 *   npx tsx scripts/gema-daily.ts export [--dashboard=public/data/dashboard.json]
 *   npx tsx scripts/gema-daily.ts delta [--history=data/gema/history.json]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { rollHistory } from "../lib/history.ts";
import {
  sonarDashboardUrl,
  sonarHostFromEnv,
  sonarProjectIssuesAllOpenUrl,
  sonarProjectIssuesUrl,
} from "../lib/sonar-links.ts";
import type { Repo, ScanSnapshot } from "../lib/snapshot.ts";

const GEMA_KEY = "gema";
const ROOT = process.cwd();
const GEMA_DIR = join(ROOT, "data", "gema");
const SCANS_DIR = join(GEMA_DIR, "scans");

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

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function sliceGema(full: ScanSnapshot): ScanSnapshot {
  const gema = full.projects.find(p => p.key === GEMA_KEY);
  if (!gema) {
    throw new Error(`No hay proyecto "${GEMA_KEY}" en el snapshot (fecha ${full.fecha}).`);
  }
  return {
    fecha: full.fecha,
    organizacionAzdo: full.organizacionAzdo,
    organizacionSonar: full.organizacionSonar,
    projects: [gema],
  };
}

function exportGema(): void {
  const dashboardPath = argValue("--dashboard=") ?? join(ROOT, "public", "data", "dashboard.json");
  if (!existsSync(dashboardPath)) {
    throw new Error(`No existe ${dashboardPath}. Corré antes: npm run scan -- --source=sonar`);
  }

  const slice = sliceGema(readJson<ScanSnapshot>(dashboardPath));
  mkdirSync(SCANS_DIR, { recursive: true });

  const scanFile = join(SCANS_DIR, `scan-${slice.fecha}.json`);
  writeFileSync(scanFile, `${JSON.stringify(slice, null, 2)}\n`, "utf8");

  const historyPath = join(GEMA_DIR, "history.json");
  const previous: ScanSnapshot[] = existsSync(historyPath) ? readJson(historyPath) : [];
  const history = rollHistory(previous, slice);
  writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`, "utf8");

  console.log(`Gema scan: ${scanFile}`);
  console.log(`Gema history: ${historyPath} (${history.length} días)`);
}

interface RepoRow {
  name: string;
  key: string | null;
  bugs: number | null;
  vulns: number | null;
  gate: string | null;
  lastAnalysis: string | null;
}

function repoRow(repo: Repo): RepoRow {
  const s = repo.sonar;
  return {
    name: repo.name,
    key: repo.sonarProjectKey,
    bugs: s?.bugs ?? null,
    vulns: s?.vulnerabilities ?? null,
    gate: s?.alertStatus ?? null,
    lastAnalysis: s?.lastAnalysis ?? null,
  };
}

function deltaMetric(prev: number | null, curr: number | null): string {
  if (prev === null || curr === null) return "—";
  const d = curr - prev;
  if (d === 0) return "0";
  return d > 0 ? `+${d}` : String(d);
}

function formatTriage(
  fecha: string,
  prev: ScanSnapshot | null,
  curr: ScanSnapshot,
): string {
  const gema = curr.projects[0];
  const prevGema = prev?.projects.find(p => p.key === GEMA_KEY);
  const prevByName = new Map((prevGema?.repos ?? []).map(r => [r.name, r]));

  const lines: string[] = [
    `# Gema — triage Sonar (${fecha})`,
    "",
    `Proyecto ADO: **${gema.azdoProject}** · Líder: ${gema.leader}`,
    "",
  ];

  if (!prev) {
    lines.push("_Primer día en history Gema: no hay delta vs ayer._", "");
  }

  lines.push("## Repos a revisar (delta bugs / vulns vs scan anterior)", "");
  lines.push("| Repo | Bugs | Vulns | Bugs Δ | Gate | Acciones |");
  lines.push("| --- | ---: | ---: | ---: | --- | --- |");

  const attention: RepoRow[] = [];

  for (const repo of gema.repos) {
    const applies = repo.aplicaSonar !== false;
    const isMsMf = repo.name.startsWith("ms-") || repo.name.startsWith("mf-");
    if (!applies && !isMsMf) continue;

    const cur = repoRow(repo);
    const prevRepo = prevByName.get(repo.name);
    const p = prevRepo ? repoRow(prevRepo) : null;

    const bugsD = prev ? deltaMetric(p!.bugs, cur.bugs) : "—";
    const bugsN = cur.bugs ?? "—";
    const vulnsN = cur.vulns ?? "—";

    const needs =
      cur.gate === "ERROR" ||
      (prev && p && cur.bugs !== null && p.bugs !== null && cur.bugs > p.bugs) ||
      (prev && p && cur.vulns !== null && p.vulns !== null && cur.vulns > p.vulns) ||
      (isMsMf && cur.bugs === null);

    if (needs) attention.push(cur);

    let actions = "—";
    if (cur.key) {
      const bugsLink = sonarProjectIssuesUrl(cur.key, { kinds: "bugs" });
      const allLink = sonarProjectIssuesAllOpenUrl(cur.key);
      actions =
        `[Dashboard](${sonarDashboardUrl(cur.key)}) · ` +
        `[Bugs (${bugsN})](${bugsLink}) · ` +
        `[Issues abiertos](${allLink})`;
    } else if (isMsMf) {
      actions = "_Sin key Sonar — revisar match en Community_";
    }

    lines.push(
      `| ${repo.name} | ${bugsN} | ${vulnsN} | ${bugsD} | ${cur.gate ?? "—"} | ${actions} |`,
    );
  }

  lines.push("", "## Checklist bugs Azure DevOps", "");
  lines.push(
    "_Si **Bugs (0)** el link puede mostrar lista vacía: es normal. Gate ERROR sin bugs suele ser cobertura/duplicación/hotspots._",
  );
  lines.push("");
  lines.push("Por cada fila con bugs > 0, Δ positivo o gate **ERROR**:");
  lines.push("1. Abrir *Bugs (N)* o usar `npm run gema:issues-ado -- --repo=<repo> --apply`.");
  lines.push("2. Buscar en ADO (proyecto `gema`) si ya existe WI con el link Sonar.");
  lines.push("3. Crear **Bug** con título `[Sonar][Bug] <repo> — <regla> — <archivo>:<línea>`.");
  lines.push("4. Descripción: mensaje Sonar + URL del issue + `sonarProjectKey`.", "");

  if (attention.length === 0) {
    lines.push("_Sin repos con empeora de conteos ni gate ERROR (o primer scan)._");
  } else {
    lines.push("### Prioridad hoy", "");
    for (const r of attention) {
      lines.push(`- **${r.name}** — bugs ${r.bugs ?? "?"}, vulns ${r.vulns ?? "?"}, gate ${r.gate ?? "?"}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function runDelta(): void {
  const historyPath = argValue("--history=") ?? join(GEMA_DIR, "history.json");
  if (!existsSync(historyPath)) {
    throw new Error(`No existe ${historyPath}. Corré: npx tsx scripts/gema-daily.ts export`);
  }

  const history = readJson<ScanSnapshot[]>(historyPath);
  if (history.length === 0) {
    throw new Error("History Gema vacío.");
  }

  const curr = history[history.length - 1];
  const prev = history.length >= 2 ? history[history.length - 2] : null;
  const md = formatTriage(curr.fecha, prev, curr);

  const triagePath = join(GEMA_DIR, `triage-${curr.fecha}.md`);
  mkdirSync(GEMA_DIR, { recursive: true });
  writeFileSync(triagePath, md, "utf8");

  console.log(md);
  console.log(`\nTriage escrito: ${triagePath}`);
}

function main(): void {
  const cmd = process.argv[2];
  if (cmd === "export") {
    exportGema();
    return;
  }
  if (cmd === "delta") {
    runDelta();
    return;
  }
  console.error("Uso: npx tsx scripts/gema-daily.ts export|delta");
  process.exit(1);
}

main();

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ScanSnapshot } from "../lib/snapshot.ts";
import { fetchInventario } from "./azdo.ts";
import { loadProjectsConfig } from "./config.ts";
import { FIXTURE_DATES, buildFixtureSnapshot } from "./fixture.ts";
import { inventoryFromYml } from "./inventory.ts";
import {
  mergeSnapshots,
  readHistory,
  readSnapshot,
  rollHistory,
  writeDashboardFiles,
} from "./merge.ts";
import { enrichSonar, listSonarComponents, sonarHostFromEnv } from "./sonar.ts";
import { enrichTrivy } from "./trivy.ts";

type Source = "sonar" | "azure" | "all";

function hasAzdoCreds(): boolean {
  return Boolean(process.env.AZDO_ORG && process.env.AZDO_PAT);
}

function hasSonarCreds(): boolean {
  return Boolean(process.env.SONAR_TOKEN && process.env.SONAR_ORG);
}

function argValue(prefix: string): string | undefined {
  const eq = prefix.endsWith("=") ? prefix : `${prefix}=`;
  const flag = eq.slice(0, -1);
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith(eq)) return arg.slice(eq.length);
    if (arg === flag && argv[i + 1] && !argv[i + 1].startsWith("-")) return argv[i + 1];
  }
  return undefined;
}

function parseSource(): Source {
  const raw = argValue("--source=") ?? "all";
  if (raw === "sonar" || raw === "azure" || raw === "all") return raw;
  throw new Error(`--source inválido: ${raw}`);
}

async function scanPartial(fecha: string, source: Source): Promise<ScanSnapshot> {
  const file = loadProjectsConfig();
  const org = process.env.AZDO_ORG ?? file.organizacionAzdo;
  const sonarOrg = process.env.SONAR_ORG ?? file.organizacionSonar;
  const wantAzure = source === "azure" || source === "all";
  const wantSonar = source === "sonar" || source === "all";

  const sources: string[] = [];
  if (wantAzure && hasAzdoCreds()) sources.push("Azure DevOps (inventario + Trivy)");
  else sources.push("projects.yml (inventario estático)");
  if (wantSonar && hasSonarCreds()) sources.push("SonarQube");
  console.log(`Fuentes: ${sources.join(" · ")} · source=${source}`);

  const projects =
    wantAzure && hasAzdoCreds()
      ? await fetchInventario({ org, pat: process.env.AZDO_PAT! })
      : inventoryFromYml();

  if (wantSonar) {
    if (hasSonarCreds()) {
      try {
        const host = sonarHostFromEnv();
        const token = process.env.SONAR_TOKEN!;
        const auth = Buffer.from(`${token}:`).toString("base64");
        const catalog = await listSonarComponents({
          host,
          headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
        });
        console.log(`Sonar host: ${host} (${catalog.length} proyectos TRK)`);
        for (const project of projects) {
          await enrichSonar(project.repos, {
            token,
            org: sonarOrg,
            fecha,
            host,
            catalog,
          });
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.warn(`Sonar omitido: ${detail}`);
      }
    } else {
      console.warn("Sonar omitido: faltan SONAR_TOKEN o SONAR_ORG");
    }
  }

  if (wantAzure && hasAzdoCreds()) {
    const pat = process.env.AZDO_PAT!;
    for (const project of projects) {
      try {
        await enrichTrivy(project.azdoProject, project.repos, { org, pat, fecha });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.warn(`Trivy omitido (${project.azdoProject}): ${detail}`);
      }
    }
  } else if (wantAzure) {
    console.warn("Trivy omitido: faltan AZDO_ORG o AZDO_PAT");
  }

  return {
    fecha,
    organizacionAzdo: org,
    organizacionSonar: sonarOrg,
    projects,
  };
}

function persist(dashboard: ScanSnapshot, outDir: string, historyPath?: string) {
  const previous = historyPath && existsSync(historyPath) ? readHistory(historyPath) : [];
  const localHistory = join(outDir, "history.json");
  const fromOut = existsSync(localHistory) && !historyPath ? readHistory(localHistory) : [];
  const history = rollHistory(previous.length ? previous : fromOut, dashboard);
  const written = writeDashboardFiles(outDir, dashboard, history);
  console.log(`Dashboard escrito: ${written.dashboard}`);
  console.log(`History escrito: ${written.history} (${history.length} scans)`);
}

async function main() {
  const fromFixture = process.argv.includes("--from-fixture");
  const doMerge = process.argv.includes("--merge");
  const outDir = argValue("--out=") ?? join(process.cwd(), "public/data");
  const fecha =
    argValue("--fecha=") ?? new Date().toISOString().slice(0, 10);

  if (fromFixture) {
    const snapshots = FIXTURE_DATES.map(spec =>
      buildFixtureSnapshot(spec.fecha, spec.analyzed, spec.withTrivy),
    );
    const dashboard = snapshots[snapshots.length - 1];
    const written = writeDashboardFiles(outDir, dashboard, snapshots);
    console.log(`Fixture escrito:\n${written.dashboard}\n${written.history}`);
    return;
  }

  if (doMerge) {
    const sonarFile = argValue("--sonar-file=");
    const azureFile = argValue("--azure-file=");
    const azure = azureFile && existsSync(azureFile) ? readSnapshot(azureFile) : null;
    const sonar = sonarFile && existsSync(sonarFile) ? readSnapshot(sonarFile) : null;
    const dashboard = mergeSnapshots(azure, sonar);
    persist(dashboard, outDir, argValue("--history-file="));
    return;
  }

  const snapshot = await scanPartial(fecha, parseSource());
  persist(snapshot, outDir, argValue("--history-file="));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

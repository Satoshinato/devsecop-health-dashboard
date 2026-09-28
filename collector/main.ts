import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ScanSnapshot } from "../lib/snapshot.ts";
import { fetchInventario } from "./azdo.ts";
import { loadProjectsConfig } from "./config.ts";
import { FIXTURE_DATES, buildFixtureSnapshot } from "./fixture.ts";
import { inventoryFromYml } from "./inventory.ts";
import { enrichSonar, listSonarComponents, sonarHostFromEnv } from "./sonar.ts";
import { enrichTrivy } from "./trivy.ts";

function hasAzdoCreds(): boolean {
  return Boolean(process.env.AZDO_ORG && process.env.AZDO_PAT);
}

function hasSonarCreds(): boolean {
  return Boolean(process.env.SONAR_TOKEN && process.env.SONAR_ORG);
}

function writeScan(snapshot: ScanSnapshot, root = process.cwd()): string {
  const dir = join(root, "data/scans");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `scan-${snapshot.fecha}.json`);
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
  return path;
}

async function scanPartial(fecha: string): Promise<ScanSnapshot> {
  const file = loadProjectsConfig();
  const org = process.env.AZDO_ORG ?? file.organizacionAzdo;
  const sonarOrg = process.env.SONAR_ORG ?? file.organizacionSonar;

  const sources: string[] = [];
  if (hasAzdoCreds()) sources.push("Azure DevOps (inventario + Trivy)");
  else sources.push("projects.yml (inventario estático)");
  if (hasSonarCreds()) sources.push("SonarQube");
  console.log(`Fuentes: ${sources.join(" · ")}`);

  const projects = hasAzdoCreds()
    ? await fetchInventario({ org, pat: process.env.AZDO_PAT! })
    : inventoryFromYml();

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

  if (hasAzdoCreds()) {
    const pat = process.env.AZDO_PAT!;
    for (const project of projects) {
      try {
        await enrichTrivy(project.azdoProject, project.repos, { org, pat, fecha });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.warn(`Trivy omitido (${project.azdoProject}): ${detail}`);
      }
    }
  } else {
    console.warn("Trivy omitido: faltan AZDO_ORG o AZDO_PAT");
  }

  return {
    fecha,
    organizacionAzdo: org,
    organizacionSonar: sonarOrg,
    projects,
  };
}

async function main() {
  const fromFixture = process.argv.includes("--from-fixture");
  const fecha =
    process.argv.find(a => a.startsWith("--fecha="))?.slice("--fecha=".length) ??
    new Date().toISOString().slice(0, 10);

  if (fromFixture) {
    const written: string[] = [];
    for (const spec of FIXTURE_DATES) {
      written.push(writeScan(buildFixtureSnapshot(spec.fecha, spec.analyzed, spec.withTrivy)));
    }
    console.log(`Fixture escrito:\n${written.join("\n")}`);
    return;
  }

  const snapshot = await scanPartial(fecha);
  const path = writeScan(snapshot);
  console.log(`Scan escrito: ${path}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

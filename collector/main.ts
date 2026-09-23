import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchInventario } from "./azdo.ts";
import { FIXTURE_DATES, buildFixtureSnapshot } from "./fixture.ts";
import { enrichSonar } from "./sonar.ts";
import { enrichTrivy } from "./trivy.ts";
import type { ScanSnapshot } from "../lib/snapshot.ts";

function hasCreds(): boolean {
  return Boolean(
    process.env.SONAR_TOKEN &&
      process.env.SONAR_ORG &&
      process.env.AZDO_ORG &&
      process.env.AZDO_PAT,
  );
}

function writeScan(snapshot: ScanSnapshot, root = process.cwd()): string {
  const dir = join(root, "data/scans");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `scan-${snapshot.fecha}.json`);
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
  return path;
}

async function scanReal(fecha: string): Promise<ScanSnapshot> {
  const org = process.env.AZDO_ORG!;
  const pat = process.env.AZDO_PAT!;
  const projects = await fetchInventario({ org, pat });
  for (const project of projects) {
    await enrichSonar(project.repos, {
      token: process.env.SONAR_TOKEN!,
      org: process.env.SONAR_ORG!,
      fecha,
    });
    await enrichTrivy(project.azdoProject, project.repos, {
      org,
      pat,
      fecha,
      source: process.env.TRIVY_SOURCE,
    });
  }
  return {
    fecha,
    organizacionAzdo: org,
    organizacionSonar: process.env.SONAR_ORG!,
    projects,
  };
}

async function main() {
  const fromFixture = process.argv.includes("--from-fixture");
  const fecha =
    process.argv.find(a => a.startsWith("--fecha="))?.slice("--fecha=".length) ??
    new Date().toISOString().slice(0, 10);

  if (fromFixture || !hasCreds()) {
    if (!fromFixture && !hasCreds()) {
      console.error(
        "Faltan SONAR_TOKEN, SONAR_ORG, AZDO_ORG o AZDO_PAT. Usá --from-fixture para un scan de muestra.",
      );
      process.exitCode = 1;
    }
    if (fromFixture) {
      const written: string[] = [];
      for (const spec of FIXTURE_DATES) {
        written.push(writeScan(buildFixtureSnapshot(spec.fecha, spec.analyzed, spec.withTrivy)));
      }
      console.log(`Fixture escrito:\n${written.join("\n")}`);
      return;
    }
    return;
  }

  const snapshot = await scanReal(fecha);
  const path = writeScan(snapshot);
  console.log(`Scan escrito: ${path}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

import assert from "node:assert/strict";
import test from "node:test";
import { rollHistory } from "../lib/history.ts";
import { mergeSnapshots } from "./merge.ts";
import type { AzdoProject, Repo, ScanSnapshot } from "../lib/snapshot.ts";

function repo(name: string, extra: Partial<Repo> = {}): Repo {
  return {
    name,
    publicaImagen: true,
    sonarProjectName: null,
    sonarProjectKey: null,
    sonar: null,
    trivy: null,
    ...extra,
  };
}

function project(key: string, repos: Repo[]): AzdoProject {
  return {
    key,
    name: key,
    azdoProject: key,
    leader: "x",
    reposTotal: repos.length,
    repos,
  };
}

function snap(fecha: string, projects: AzdoProject[]): ScanSnapshot {
  return {
    fecha,
    organizacionAzdo: "accusystechnology",
    organizacionSonar: "accusys",
    projects,
  };
}

test("mergeSnapshots: sonar pisa métricas y azure conserva trivy", () => {
  const azure = snap("2026-10-02", [
    project("gema", [
      repo("ms-ophir-api", {
        trivy: {
          image: "img",
          baseImage: "base",
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          fixable: 1,
          unfixable: 0,
          buildId: "9",
          scanDate: "2026-10-02",
          findings: [],
        },
      }),
    ]),
  ]);
  const sonar = snap("2026-10-02", [
    project("gema", [
      repo("ms-ophir-api", {
        sonarProjectKey: "gema_ms-ophir-api",
        sonar: {
          ncloc: 10,
          coverage: 80,
          newCoverage: 90,
          duplications: 1,
          sqaleIndex: 100,
          bugs: 0,
          vulnerabilities: 0,
          hotspotsToReview: 0,
          codeSmells: 1,
          reliabilityRating: "A",
          securityRating: "A",
          maintainabilityRating: "A",
          alertStatus: "OK",
          lastAnalysis: "2026-10-02",
        },
      }),
    ]),
  ]);
  const merged = mergeSnapshots(azure, sonar);
  const r = merged.projects[0].repos[0];
  assert.equal(r.trivy?.critical, 1);
  assert.equal(r.sonar?.ncloc, 10);
  assert.equal(r.sonarProjectKey, "gema_ms-ophir-api");
});

test("rollHistory reemplaza el mismo día y recorta a 14", () => {
  const prev = Array.from({ length: 14 }, (_, i) =>
    snap(`2026-09-${String(i + 1).padStart(2, "0")}`, []),
  );
  const today = snap("2026-09-14", [project("gema", [])]);
  const rolled = rollHistory(prev, today, 14);
  assert.equal(rolled.length, 14);
  assert.equal(rolled[rolled.length - 1].projects.length, 1);
});

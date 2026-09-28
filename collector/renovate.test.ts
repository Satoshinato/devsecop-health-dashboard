import assert from "node:assert/strict";
import test from "node:test";
import type { Repo } from "../lib/snapshot.ts";
import {
  enrichRenovate,
  metricasRepo,
  publicaImagenDe,
  reposPorProyecto,
  renovateHostFromEnv,
  type RenovateDashboard,
} from "./renovate.ts";

const DASHBOARD: RenovateDashboard = {
  generated: "2026-09-16T17:49:38.206Z",
  scanDate: "2026-09-16",
  projects: [
    {
      project: "gema",
      dependencyCount: 2,
      total: 2,
      deprecated: 1,
      eol: 1,
      repositories: {
        "gema/ms-ophir-api": [
          {
            repo: "gema/ms-ophir-api",
            project: "gema",
            depName: "org.springframework.boot:spring-boot-dependencies",
            version: "3.3.0",
            source: "maven",
            reasons: [{ kind: "eol", detail: "spring-boot 3.3 lost support on 2025-06-30" }],
          },
        ],
      },
    },
  ],
  dependencies: [
    {
      depName: "org.springframework.boot:spring-boot-dependencies",
      version: "3.3.0",
      source: "maven",
      usages: [{ project: "gema", repo: "gema/ms-ophir-api" }],
    },
    {
      depName: "alpine",
      version: "3.19",
      source: "docker",
      usages: [{ project: "gema", repo: "gema/ms-ophir-app" }],
    },
    {
      depName: "lodash",
      version: "4.17.20",
      source: "npm",
      usages: [
        { project: "gema", repo: "gema/ms-ophir-api" },
        { project: "gema", repo: "gema/ms-ophir-app" },
      ],
    },
  ],
};

test("RENOVATE_HOST sin barra final; default Dependency Health Accusys", () => {
  assert.equal(renovateHostFromEnv({}), "https://renovate.shared.accusys.com.ar");
  assert.equal(
    renovateHostFromEnv({ RENOVATE_HOST: "https://renovate.shared.accusys.com.ar/" }),
    "https://renovate.shared.accusys.com.ar",
  );
});

test("reposPorProyecto agrupa nombres cortos por azdoProject", () => {
  const map = reposPorProyecto(DASHBOARD);
  assert.deepEqual(map.get("gema")?.sort(), ["ms-ophir-api", "ms-ophir-app"]);
});

test("publicaImagenDe detecta docker en usages", () => {
  assert.equal(publicaImagenDe(DASHBOARD, "gema", "ms-ophir-app"), true);
  assert.equal(publicaImagenDe(DASHBOARD, "gema", "lib-core"), false);
});

test("metricasRepo cuenta hallazgos eol y dependencias", () => {
  const m = metricasRepo(DASHBOARD, "gema", "ms-ophir-api");
  assert.equal(m.scanDate, "2026-09-16");
  assert.equal(m.eol, 1);
  assert.equal(m.deprecated, 0);
  assert.equal(m.dependencyCount, 2);
  assert.equal(m.findings[0]?.kind, "eol");
});

test("enrichRenovate completa repo.renovate in-place", () => {
  const repos: Repo[] = [
    {
      name: "ms-ophir-api",
      publicaImagen: true,
      sonarProjectName: null,
      sonarProjectKey: null,
      sonar: null,
      trivyPr: null,
      trivyBuild: null,
      trivy: null,
      renovate: null,
    },
    {
      name: "sin-deps",
      publicaImagen: true,
      sonarProjectName: null,
      sonarProjectKey: null,
      sonar: null,
      trivyPr: null,
      trivyBuild: null,
      trivy: null,
      renovate: null,
    },
  ];
  enrichRenovate("gema", repos, DASHBOARD);
  assert.ok(repos[0].renovate);
  assert.equal(repos[0].renovate!.eol, 1);
  assert.equal(repos[1].renovate, null);
});

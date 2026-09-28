import assert from "node:assert/strict";
import test from "node:test";
import { buildFixtureSnapshot, FIXTURE_DATES } from "../collector/fixture.ts";
import {
  adopcionSonarDe,
  adopcionTrivyDe,
  cvesTransversales,
  deudaDiasDesdeSqale,
  filaProyecto,
  imagenesBasePorImpacto,
  impactoImagen,
  lecturasTrivy,
  MINUTOS_POR_DIA,
  resumenDeScan,
  tieneTrivy,
  trivyPrincipal,
} from "./metrics.ts";
import { reposEnAlcanceSonar } from "./sonar-alcance.ts";
import type { Repo, TrivyMetrics } from "./snapshot.ts";
import { loadProjectsConfig } from "../collector/config.ts";

const latest = FIXTURE_DATES[FIXTURE_DATES.length - 1];
const scan = buildFixtureSnapshot(latest.fecha, latest.analyzed, latest.withTrivy);
const gema = scan.projects.find(p => p.key === "gema")!;
const fila = filaProyecto(gema);
const inventario = loadProjectsConfig();
const reposInventario = inventario.proyectos.reduce((s, p) => s + p.repos.length, 0);
const gemaAlcance = reposEnAlcanceSonar(gema.repos);
const gemaKeys = gemaAlcance.filter(r => r.sonarProjectKey).length;
const reposTotalSonar = scan.projects.reduce((s, p) => s + p.reposTotal, 0);

test("inventario: 13 proyectos desde projects.yml", () => {
  assert.equal(scan.projects.length, 13);
  assert.equal(
    scan.projects.reduce((s, p) => s + p.repos.length, 0),
    reposInventario,
  );
  assert.equal(gema.repos.length, inventario.proyectos.find(p => p.key === "gema")!.repos.length);
});

test("adopción Sonar de Gema = repos con sonarProjectKey / repos en alcance", () => {
  assert.equal(gemaAlcance.length, 15);
  assert.equal(gemaKeys, 15);
  assert.equal(gema.reposTotal, 15);
  assert.equal(adopcionSonarDe(gema), Math.round((gemaKeys / gema.reposTotal) * 100));
  assert.equal(fila.adopcionSonar, Math.round((gemaKeys / gema.reposTotal) * 100));
  assert.equal(fila.repos.length, 15);
  assert.ok(!fila.repos.some(r => ["db", "legacy", "ophir"].includes(r.name)));
});

test("adopción Trivy usa solo publicaImagen como denominador", () => {
  const conImagen = gema.repos.filter(r => r.publicaImagen).length;
  const conTrivy = gema.repos.filter(r => tieneTrivy(r)).length;
  assert.equal(conTrivy, 5);
  assert.equal(adopcionTrivyDe(gema), Math.round((conTrivy / conImagen) * 100));
  assert.equal(fila.adopcionTrivy, Math.round((conTrivy / conImagen) * 100));
});

test("trivyPrincipal prefiere build sobre pr", () => {
  const base: Omit<TrivyMetrics, "critical" | "high" | "medium" | "low"> = {
    image: "img",
    baseImage: "base",
    fixable: 0,
    unfixable: 0,
    buildId: "1",
    scanDate: "2026-09-23",
    findings: [],
  };
  const repo: Repo = {
    name: "demo",
    publicaImagen: true,
    sonarProjectName: null,
    sonarProjectKey: null,
    sonar: null,
    trivyPr: { ...base, critical: 1, high: 0, medium: 0, low: 0, fuente: "pr" },
    trivyBuild: { ...base, critical: 0, high: 2, medium: 0, low: 0, fuente: "build" },
    trivy: null,
  };
  assert.equal(trivyPrincipal(repo)?.high, 2);
  assert.equal(trivyPrincipal(repo)?.critical, 0);
});

test("tieneTrivy con solo lectura PR", () => {
  const repo: Repo = {
    name: "demo",
    publicaImagen: true,
    sonarProjectName: null,
    sonarProjectKey: null,
    sonar: null,
    trivyPr: {
      image: "img",
      baseImage: "base",
      critical: 0,
      high: 0,
      medium: 1,
      low: 0,
      fixable: 0,
      unfixable: 1,
      buildId: "1",
      scanDate: "2026-09-23",
      findings: [],
    },
    trivyBuild: null,
    trivy: null,
  };
  assert.equal(tieneTrivy(repo), true);
});

test("ms-ophir-api expone lecturas PR y build en fixture", () => {
  const ophir = gema.repos.find(r => r.name === "ms-ophir-api");
  assert.ok(ophir);
  const lecturas = lecturasTrivy(ophir!);
  assert.equal(lecturas.legacy, false);
  assert.ok(lecturas.pr);
  assert.ok(lecturas.build);
  assert.equal(lecturas.pr!.pipeline, "ms-ophir-api-pr");
  assert.equal(lecturas.build!.pipeline, "ms-ophir-api-build");
  assert.equal(trivyPrincipal(ophir!)!.fuente, "build");
});

test("KPI de severidad no duplica PR y build del mismo repo", () => {
  const ophir = gema.repos.find(r => r.name === "ms-ophir-api");
  assert.ok(ophir);
  const pr = ophir!.trivyPr!;
  const build = ophir!.trivyBuild!;
  assert.equal(pr.high + build.high, 1);
  assert.equal(trivyPrincipal(ophir!)?.high, build.high);
  assert.equal(fila.altos, gema.repos.reduce((s, r) => s + (trivyPrincipal(r)?.high ?? 0), 0));
});

test("deuda días = sqale_index / 480", () => {
  const sqale = gema.repos.reduce((s, r) => s + (r.sonar?.sqaleIndex ?? 0), 0);
  assert.equal(MINUTOS_POR_DIA, 480);
  assert.equal(sqale, 2680 + 1420 + 5210 + 640 + 210 + 3180);
  assert.equal(deudaDiasDesdeSqale(sqale), sqale / 480);
  assert.equal(fila.deudaDias, Math.round((sqale / 480) * 10) / 10);
});

test("el resto del inventario queda en adopción 0 %", () => {
  for (const p of scan.projects.filter(x => x.key !== "gema")) {
    assert.equal(adopcionSonarDe(p), 0);
    assert.ok(p.repos.every(r => r.sonarProjectKey === null));
  }
});

test("top hallazgos = critical únicos × repos afectados", () => {
  const imagenes = imagenesBasePorImpacto([scan]);
  assert.ok(imagenes.length > 0);
  for (const img of imagenes) {
    assert.equal(img.impacto, impactoImagen(img.criticosUnicos, img.reposAfectados));
    assert.equal(img.impacto, img.criticosUnicos * img.reposAfectados);
  }
  const temurin = imagenes.find(i => i.imagen.includes("temurin"));
  assert.ok(temurin);
  assert.equal(temurin!.reposAfectados, 4);
  assert.equal(temurin!.criticosUnicos, 2);
  assert.equal(temurin!.impacto, 8);
});

test("resumen global de Gema en el fixture", () => {
  const r = resumenDeScan(scan);
  assert.ok(r.reposTotal < reposInventario);
  assert.equal(r.reposTotal, reposTotalSonar);
  assert.equal(r.proyectosConAdopcion, 1);
  assert.equal(r.reposConSonar, 6);
  assert.equal(r.reposConTrivy, 5);
  assert.equal(r.adopcionSonar, Math.round((gemaKeys / reposTotalSonar) * 100));
  assert.equal(r.deudaDias, Math.round(13340 / 480));
});

test("CVE transversal agrupa por id y cuenta repos", () => {
  const cves = cvesTransversales(scan);
  const openssl = cves.find(c => c.cve === "CVE-2024-22262");
  assert.ok(openssl);
  assert.equal(openssl!.reposAfectados, 5);
});

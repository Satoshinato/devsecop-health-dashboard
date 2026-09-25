import assert from "node:assert/strict";
import test from "node:test";
import { buildFixtureSnapshot, FIXTURE_DATES } from "../collector/fixture.ts";
import {
  adopcionSonarDe,
  adopcionTrivyDe,
  cvesTransversales,
  dependenciasTransversales,
  deudaDiasDesdeSqale,
  filaProyecto,
  imagenesBasePorImpacto,
  impactoImagen,
  MINUTOS_POR_DIA,
  resumenDeScan,
} from "./metrics.ts";
import { loadProjectsConfig } from "../collector/config.ts";

const latest = FIXTURE_DATES[FIXTURE_DATES.length - 1];
const scan = buildFixtureSnapshot(latest.fecha, latest.analyzed, latest.withTrivy);
const gema = scan.projects.find(p => p.key === "gema")!;
const fila = filaProyecto(gema);
const inventario = loadProjectsConfig();
const reposInventario = inventario.proyectos.reduce((s, p) => s + p.repos.length, 0);
const gemaKeys = gema.repos.filter(r => r.sonarProjectKey).length;

test("inventario: 13 proyectos desde Dependency Health", () => {
  assert.equal(scan.projects.length, 13);
  assert.equal(
    scan.projects.reduce((s, p) => s + p.repos.length, 0),
    reposInventario,
  );
  assert.equal(gema.repos.length, inventario.proyectos.find(p => p.key === "gema")!.repos.length);
});

test("adopción Sonar de Gema = repos con sonarProjectKey / reposTotal", () => {
  assert.equal(gemaKeys, 15);
  assert.equal(adopcionSonarDe(gema), Math.round((gemaKeys / gema.repos.length) * 100));
  assert.equal(fila.adopcionSonar, Math.round((gemaKeys / gema.repos.length) * 100));
});

test("adopción Trivy usa solo publicaImagen como denominador", () => {
  const conImagen = gema.repos.filter(r => r.publicaImagen).length;
  const conTrivy = gema.repos.filter(r => r.trivy !== null).length;
  assert.equal(conTrivy, 5);
  assert.equal(adopcionTrivyDe(gema), Math.round((conTrivy / conImagen) * 100));
  assert.equal(fila.adopcionTrivy, Math.round((conTrivy / conImagen) * 100));
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
  assert.equal(r.reposTotal, reposInventario);
  assert.equal(r.proyectosConAdopcion, 1);
  assert.equal(r.reposConSonar, 6);
  assert.equal(r.reposConTrivy, 5);
  assert.equal(r.adopcionSonar, Math.round((gemaKeys / reposInventario) * 100));
  assert.equal(r.deudaDias, Math.round(13340 / 480));
});

test("dependencias transversales agrupa por dep y cuenta repos", () => {
  const deps = dependenciasTransversales({
    fecha: "2026-09-25",
    organizacionAzdo: "accusystechnology",
    organizacionSonar: "accusys",
    projects: [
      {
        key: "gema",
        name: "Gema",
        azdoProject: "gema",
        leader: "x",
        reposTotal: 2,
        repos: [
          {
            name: "a",
            publicaImagen: true,
            sonarProjectName: null,
            sonarProjectKey: null,
            sonar: null,
            trivy: null,
            renovate: {
              dependencyCount: 1,
              eol: 1,
              deprecated: 0,
              baseImages: [],
              scanDate: "2026-09-16",
              findings: [
                {
                  depName: "spring-boot",
                  version: "3.3.0",
                  source: "maven",
                  kind: "eol",
                  detail: "eol",
                },
              ],
            },
          },
          {
            name: "b",
            publicaImagen: true,
            sonarProjectName: null,
            sonarProjectKey: null,
            sonar: null,
            trivy: null,
            renovate: {
              dependencyCount: 1,
              eol: 1,
              deprecated: 0,
              baseImages: [],
              scanDate: "2026-09-16",
              findings: [
                {
                  depName: "spring-boot",
                  version: "3.3.0",
                  source: "maven",
                  kind: "eol",
                  detail: "eol",
                },
              ],
            },
          },
        ],
      },
    ],
  });
  assert.equal(deps.length, 1);
  assert.equal(deps[0]?.reposAfectados, 2);
  assert.equal(deps[0]?.kind, "eol");
});

test("CVE transversal agrupa por id y cuenta repos", () => {
  const cves = cvesTransversales(scan);
  const openssl = cves.find(c => c.cve === "CVE-2024-22262");
  assert.ok(openssl);
  assert.equal(openssl!.reposAfectados, 5);
});

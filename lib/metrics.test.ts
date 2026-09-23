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
  MINUTOS_POR_DIA,
  resumenDeScan,
} from "./metrics.ts";

const latest = FIXTURE_DATES[FIXTURE_DATES.length - 1];
const scan = buildFixtureSnapshot(latest.fecha, latest.analyzed, latest.withTrivy);
const gema = scan.projects.find(p => p.key === "gema")!;
const fila = filaProyecto(gema);

test("inventario: 13 proyectos y 133 repos", () => {
  assert.equal(scan.projects.length, 13);
  assert.equal(
    scan.projects.reduce((s, p) => s + p.repos.length, 0),
    133,
  );
  assert.equal(gema.repos.length, 15);
});

test("adopción Sonar de Gema = repos con sonarProjectKey / reposTotal", () => {
  assert.equal(gema.repos.filter(r => r.sonarProjectKey).length, 15);
  assert.equal(adopcionSonarDe(gema), 100);
  assert.equal(fila.adopcionSonar, 100);
});

test("adopción Trivy usa solo publicaImagen como denominador", () => {
  const conImagen = gema.repos.filter(r => r.publicaImagen).length;
  const conTrivy = gema.repos.filter(r => r.trivy !== null).length;
  assert.equal(conImagen, 15);
  assert.equal(conTrivy, 5);
  assert.equal(adopcionTrivyDe(gema), Math.round((5 / 15) * 100));
  assert.equal(fila.adopcionTrivy, 33);
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
  assert.equal(r.reposTotal, 133);
  assert.equal(r.proyectosConAdopcion, 1);
  assert.equal(r.reposConSonar, 6);
  assert.equal(r.reposConTrivy, 5);
  assert.equal(r.adopcionSonar, Math.round((15 / 133) * 100));
  assert.equal(r.deudaDias, Math.round((13340) / 480));
});

test("CVE transversal agrupa por id y cuenta repos", () => {
  const cves = cvesTransversales(scan);
  const openssl = cves.find(c => c.cve === "CVE-2024-22262");
  assert.ok(openssl);
  assert.equal(openssl!.reposAfectados, 5);
});

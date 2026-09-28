import assert from "node:assert/strict";
import test from "node:test";
import {
  aplicaSonarDe,
  aplicaSonarPorNombre,
  esNombreCarpetaDevops,
  reposEnAlcanceSonar,
} from "./sonar-alcance";

test("aplicaSonarPorNombre: ms y mf en alcance", () => {
  assert.equal(aplicaSonarPorNombre("ms-ophir-api"), true);
  assert.equal(aplicaSonarPorNombre("MS-ophir-api"), true);
  assert.equal(aplicaSonarPorNombre("ms_ophir_api"), true);
  assert.equal(aplicaSonarPorNombre("mf-ophir-migrador-app"), true);
  assert.equal(aplicaSonarPorNombre("MF_ophir_app"), true);
});

test("aplicaSonarPorNombre: infra fuera de alcance por nombre", () => {
  assert.equal(aplicaSonarPorNombre("helm"), false);
  assert.equal(aplicaSonarPorNombre("db"), false);
  assert.equal(aplicaSonarPorNombre("legacy"), false);
  assert.equal(aplicaSonarPorNombre("lib-core"), false);
  assert.equal(aplicaSonarPorNombre("release-notes"), false);
});

test("esNombreCarpetaDevops acepta devops y .devops en raíz", () => {
  assert.equal(esNombreCarpetaDevops("devops"), true);
  assert.equal(esNombreCarpetaDevops("DevOps"), true);
  assert.equal(esNombreCarpetaDevops(".devops"), true);
  assert.equal(esNombreCarpetaDevops("/devops"), true);
  assert.equal(esNombreCarpetaDevops("/DevOps/sub"), true);
  assert.equal(esNombreCarpetaDevops("src"), false);
  assert.equal(esNombreCarpetaDevops("helm"), false);
});

test("aplicaSonarDe usa campo explícito o fallback por nombre", () => {
  assert.equal(aplicaSonarDe({ name: "helm", aplicaSonar: true }), true);
  assert.equal(aplicaSonarDe({ name: "ms-ophir-api", aplicaSonar: false }), false);
  assert.equal(aplicaSonarDe({ name: "ms-ophir-api" }), true);
  assert.equal(aplicaSonarDe({ name: "helm" }), false);
});

test("reposEnAlcanceSonar filtra por alcance", () => {
  const repos = [
    { name: "ms-ophir-api" },
    { name: "helm", aplicaSonar: false },
    { name: "helm", aplicaSonar: true },
    { name: "db" },
  ];
  const enAlcance = reposEnAlcanceSonar(repos);
  assert.deepEqual(enAlcance.map(r => r.name), ["ms-ophir-api", "helm"]);
});

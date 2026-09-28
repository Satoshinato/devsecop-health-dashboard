import assert from "node:assert/strict";
import test from "node:test";
import { resolveSonarComponent, sonarHostFromEnv } from "./sonar.ts";
import type { Repo } from "../lib/snapshot.ts";

function repo(partial: Partial<Repo> & Pick<Repo, "name">): Repo {
  return {
    publicaImagen: true,
    sonarProjectName: null,
    sonarProjectKey: null,
    sonar: null,
    trivyPr: null,
    trivyBuild: null,
    trivy: null,
    renovate: null,
    ...partial,
  };
}

test("SONAR_HOST sin barra final; default Community Accusys", () => {
  assert.equal(sonarHostFromEnv({}), "https://sonarqube.shared.accusys.com.ar");
  assert.equal(
    sonarHostFromEnv({ SONAR_HOST: "https://sonarqube.shared.accusys.com.ar/" }),
    "https://sonarqube.shared.accusys.com.ar",
  );
});

test("resuelve por key configurada exacta", () => {
  const found = resolveSonarComponent(
    repo({
      name: "ms-ophir-api",
      sonarProjectKey: "gema_ms-ophir-api_real",
    }),
    [
      { key: "otro", name: "ms-ophir-api" },
      { key: "gema_ms-ophir-api_real", name: "ms-ophir-api" },
    ],
  );
  assert.equal(found?.key, "gema_ms-ophir-api_real");
});

test("resuelve por nombre de repo si el UUID del YAML es placeholder", () => {
  const found = resolveSonarComponent(
    repo({
      name: "ms-ophir-api",
      sonarProjectName: "gema_ms-ophir-api",
      sonarProjectKey: "gema_ms-ophir-api_3f7a21c8-9b04-4d61-a5e2-71c0b9d4e830",
    }),
    [{ key: "gema_ms-ophir-api", name: "ms-ophir-api" }],
  );
  assert.equal(found?.key, "gema_ms-ophir-api");
});

test("resuelve key real con prefijo de proyecto y UUID", () => {
  const found = resolveSonarComponent(
    repo({
      name: "ms-ophir-api",
      sonarProjectName: "gema_ms-ophir-api",
      sonarProjectKey: "gema_ms-ophir-api_placeholder",
    }),
    [{ key: "gema_ms-ophir-api_853290eb-17f6-415b-9f1e-c23033aa2705", name: "MS Ophir API" }],
  );
  assert.equal(found?.key, "gema_ms-ophir-api_853290eb-17f6-415b-9f1e-c23033aa2705");
});

test("no matchea un include débil (score < 70)", () => {
  const found = resolveSonarComponent(repo({ name: "api" }), [
    { key: "gema_ms-ophir-api", name: "Ophir API" },
  ]);
  assert.equal(found, null);
});

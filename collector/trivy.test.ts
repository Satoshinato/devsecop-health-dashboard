import assert from "node:assert/strict";
import test from "node:test";
import {
  isContainerImageReport,
  parseTrivyReport,
  repoNameFromPipelineDefinition,
  repoNameFromPrDefinition,
} from "./trivy.ts";

test("ms-ophir-api-pr → repo ms-ophir-api", () => {
  assert.equal(repoNameFromPipelineDefinition("ms-ophir-api-pr"), "ms-ophir-api");
  assert.equal(repoNameFromPipelineDefinition("mf-ophir-migrador-app-pr"), "mf-ophir-migrador-app");
  assert.equal(repoNameFromPipelineDefinition("ms-ophir-api"), null);
});

test("ms-ophir-api-build → repo ms-ophir-api", () => {
  assert.equal(repoNameFromPipelineDefinition("ms-ophir-api-build"), "ms-ophir-api");
  assert.equal(repoNameFromPrDefinition("ms-ophir-api-build"), "ms-ophir-api");
});

const imageReport = {
  ArtifactName: "accusystechnology/ms-ophir-api:0.0.1-75ff6212",
  ArtifactType: "container_image",
  Results: [
    {
      Class: "os-pkgs",
      Type: "alpine",
      Vulnerabilities: [
        {
          VulnerabilityID: "CVE-2024-22262",
          PkgName: "openssl",
          InstalledVersion: "3.0.13",
          FixedVersion: "3.0.15",
          Severity: "CRITICAL",
        },
      ],
    },
    {
      Class: "secret",
      Vulnerabilities: [
        {
          VulnerabilityID: "generic-secret",
          PkgName: "env",
          InstalledVersion: "1",
          Severity: "HIGH",
        },
      ],
    },
  ],
};

const filesystemReport = {
  ArtifactName: ".",
  ArtifactType: "filesystem",
  Results: [
    {
      Class: "lang-pkgs",
      Vulnerabilities: [
        {
          VulnerabilityID: "CVE-2024-0001",
          PkgName: "lodash",
          InstalledVersion: "4.0.0",
          Severity: "HIGH",
        },
      ],
    },
  ],
};

test("acepta JSON nativo de Trivy con ArtifactType container_image", () => {
  assert.equal(isContainerImageReport(imageReport), true);
  assert.equal(isContainerImageReport(filesystemReport), false);
});

test("parse ignora secretos y reportes que no son container_image", () => {
  const metrics = parseTrivyReport(imageReport, "fallback", "2026-09-23", "99");
  assert.ok(metrics);
  assert.equal(metrics!.image, "accusystechnology/ms-ophir-api:0.0.1-75ff6212");
  assert.equal(metrics!.critical, 1);
  assert.equal(metrics!.high, 0);
  assert.equal(metrics!.findings.length, 1);
  assert.equal(metrics!.buildId, "99");

  assert.equal(parseTrivyReport(filesystemReport, "fallback", "2026-09-23", "1"), null);
});

test("parse incluye metadata de pipeline", () => {
  const metrics = parseTrivyReport(imageReport, "fallback", "2026-09-23", "42", {
    fuente: "build",
    pipeline: "ms-ophir-api-build",
    rama: "master",
  });
  assert.ok(metrics);
  assert.equal(metrics!.fuente, "build");
  assert.equal(metrics!.pipeline, "ms-ophir-api-build");
  assert.equal(metrics!.rama, "master");
});

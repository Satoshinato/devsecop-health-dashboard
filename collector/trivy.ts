import { unzipSync } from "node:zlib";
import type { Repo, SeveridadCve, TrivyFinding, TrivyMetrics } from "../lib/snapshot.ts";

const API = "7.1";

function azdoHeaders(pat: string): HeadersInit {
  const token = Buffer.from(`:${pat}`).toString("base64");
  return { Authorization: `Basic ${token}`, Accept: "application/json" };
}

function severityOf(raw: string | undefined): SeveridadCve {
  switch ((raw ?? "").toUpperCase()) {
    case "CRITICAL":
      return "CRÍTICA";
    case "HIGH":
      return "ALTA";
    case "MEDIUM":
      return "MEDIA";
    default:
      return "BAJA";
  }
}

export function parseTrivyReport(report: unknown, fallbackImage: string, fecha: string, buildId: string): TrivyMetrics {
  const doc = report as {
    ArtifactName?: string;
    Metadata?: { ImageConfig?: { architecture?: string } };
    Results?: {
      Target?: string;
      Class?: string;
      Type?: string;
      Vulnerabilities?: {
        VulnerabilityID: string;
        PkgName: string;
        InstalledVersion: string;
        FixedVersion?: string;
        Severity: string;
      }[];
    }[];
  };

  const findings: TrivyFinding[] = [];
  for (const result of doc.Results ?? []) {
    const clase = (result.Class ?? "").toLowerCase();
    const tipo = (result.Type ?? "").toLowerCase();
    // Fase 1: solo resultados de imagen de contenedor (no IaC / secretos).
    if (clase.includes("config") || clase.includes("secret") || tipo === "dockerfile") continue;
    for (const vuln of result.Vulnerabilities ?? []) {
      findings.push({
        id: vuln.VulnerabilityID,
        package: vuln.PkgName,
        version: vuln.InstalledVersion,
        severity: severityOf(vuln.Severity),
        fixedVersion: vuln.FixedVersion || null,
      });
    }
  }

  const critical = findings.filter(f => f.severity === "CRÍTICA").length;
  const high = findings.filter(f => f.severity === "ALTA").length;
  const medium = findings.filter(f => f.severity === "MEDIA").length;
  const low = findings.filter(f => f.severity === "BAJA").length;
  const fixable = findings.filter(f => f.fixedVersion).length;

  const image = doc.ArtifactName || fallbackImage;
  const baseImage = inferBaseImage(image, doc.Results?.[0]?.Type);

  return {
    image,
    baseImage,
    critical,
    high,
    medium,
    low,
    fixable,
    unfixable: findings.length - fixable,
    buildId,
    scanDate: fecha,
    findings,
  };
}

function inferBaseImage(image: string, resultType?: string): string {
  const t = (resultType ?? "").toLowerCase();
  if (t.includes("alpine")) return "alpine";
  if (image.includes("temurin")) return image;
  return image.split("/").pop() ?? image;
}

async function lastSuccessfulBuild(opts: {
  org: string;
  project: string;
  repo: string;
  pat: string;
}): Promise<{ id: number } | null> {
  const url = new URL(
    `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}/_apis/build/builds`,
  );
  url.searchParams.set("repositoryId", opts.repo);
  url.searchParams.set("repositoryType", "TfsGit");
  url.searchParams.set("resultFilter", "succeeded");
  url.searchParams.set("statusFilter", "completed");
  url.searchParams.set("$top", "1");
  url.searchParams.set("queryOrder", "finishTimeDescending");
  url.searchParams.set("api-version", API);
  const res = await fetch(url, { headers: azdoHeaders(opts.pat) });
  if (!res.ok) return null;
  const body = (await res.json()) as { value?: { id: number }[] };
  return body.value?.[0] ?? null;
}

async function downloadArtifactJson(opts: {
  org: string;
  project: string;
  buildId: number;
  pat: string;
}): Promise<unknown | null> {
  const metaUrl = `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}/_apis/build/builds/${opts.buildId}/artifacts?artifactName=trivy&api-version=${API}`;
  const metaRes = await fetch(metaUrl, { headers: azdoHeaders(opts.pat) });
  if (!metaRes.ok) return null;
  const meta = (await metaRes.json()) as { resource?: { downloadUrl?: string } };
  const downloadUrl = meta.resource?.downloadUrl;
  if (!downloadUrl) return null;
  const zipRes = await fetch(downloadUrl, { headers: azdoHeaders(opts.pat) });
  if (!zipRes.ok) return null;
  const buf = Buffer.from(await zipRes.arrayBuffer());
  // El artefacto de pipeline llega como zip; si el contenido es JSON plano, parsearlo directo.
  const asText = buf.toString("utf8");
  if (asText.trim().startsWith("{")) {
    try {
      return JSON.parse(asText);
    } catch {
      /* zip */
    }
  }
  try {
    const unzipped = unzipSync(buf);
    const text = unzipped.toString("utf8");
    const start = text.indexOf("{");
    if (start >= 0) return JSON.parse(text.slice(start));
  } catch {
    /* ignore */
  }
  return null;
}

async function downloadAttachmentJson(opts: {
  org: string;
  project: string;
  buildId: number;
  pat: string;
}): Promise<unknown | null> {
  const url = `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}/_apis/build/builds/${opts.buildId}/attachments?api-version=${API}`;
  const res = await fetch(url, { headers: azdoHeaders(opts.pat) });
  if (!res.ok) return null;
  const body = (await res.json()) as { value?: { name?: string; _links?: { self?: { href?: string } } }[] };
  const candidate = (body.value ?? []).find(
    a => (a.name ?? "").toLowerCase().includes("trivy") && (a.name ?? "").toLowerCase().endsWith(".json"),
  );
  const href = candidate?._links?.self?.href;
  if (!href) return null;
  const fileRes = await fetch(href, { headers: azdoHeaders(opts.pat) });
  if (!fileRes.ok) return null;
  return fileRes.json();
}

export async function enrichTrivy(
  projectAzdo: string,
  repos: Repo[],
  opts: { org: string; pat: string; fecha: string; source?: string },
): Promise<void> {
  const source = opts.source ?? process.env.TRIVY_SOURCE ?? "artifact";
  for (const repo of repos) {
    if (!repo.publicaImagen) {
      repo.trivy = null;
      continue;
    }
    const build = await lastSuccessfulBuild({
      org: opts.org,
      project: projectAzdo,
      repo: repo.name,
      pat: opts.pat,
    });
    if (!build) {
      repo.trivy = null;
      continue;
    }
    let report: unknown = null;
    if (source === "attachment") {
      report = await downloadAttachmentJson({
        org: opts.org,
        project: projectAzdo,
        buildId: build.id,
        pat: opts.pat,
      });
    } else {
      report = await downloadArtifactJson({
        org: opts.org,
        project: projectAzdo,
        buildId: build.id,
        pat: opts.pat,
      });
    }
    if (!report) {
      repo.trivy = null;
      continue;
    }
    repo.trivy = parseTrivyReport(
      report,
      `accusystechnology/${repo.name}:latest`,
      opts.fecha,
      String(build.id),
    );
  }
}

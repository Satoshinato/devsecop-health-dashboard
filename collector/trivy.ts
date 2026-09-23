import type { Repo, SeveridadCve, TrivyFinding, TrivyMetrics } from "../lib/snapshot.ts";

const API = "7.1";
const ATTACHMENT_TYPE = "JSON_RESULT";

function azdoHeaders(pat: string, extra?: HeadersInit): HeadersInit {
  const token = Buffer.from(`:${pat}`).toString("base64");
  return { Authorization: `Basic ${token}`, Accept: "application/json", ...extra };
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

type TrivyResult = {
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
};

type TrivyDoc = {
  ArtifactName?: string;
  ArtifactType?: string;
  Type?: string;
  Results?: TrivyResult[];
  Report?: TrivyDoc;
  report?: TrivyDoc;
};

/** Pipeline `ms-ophir-api-pr` → repo `ms-ophir-api`. */
export function repoNameFromPrDefinition(definitionName: string): string | null {
  if (!definitionName.endsWith("-pr")) return null;
  return definitionName.slice(0, -"-pr".length);
}

export function isContainerImageReport(raw: unknown): boolean {
  const doc = unwrapTrivyDoc(raw);
  if (!doc) return false;
  const tipo = (doc.ArtifactType ?? doc.Type ?? "").toLowerCase().replace(/-/g, "_");
  if (tipo === "container_image" || tipo === "containerimage" || tipo === "container") return true;
  if (tipo) return false;
  const classes = (doc.Results ?? []).map(r => (r.Class ?? "").toLowerCase());
  return classes.some(c => c === "os-pkgs" || c === "lang-pkgs");
}

function unwrapTrivyDoc(raw: unknown): TrivyDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const doc = raw as TrivyDoc;
  return doc.Report ?? doc.report ?? doc;
}

function flattenReports(raw: unknown): TrivyDoc[] {
  const items = Array.isArray(raw) ? raw : [raw];
  const out: TrivyDoc[] = [];
  for (const item of items) {
    const doc = unwrapTrivyDoc(item);
    if (doc && isContainerImageReport(doc)) out.push(doc);
  }
  return out;
}

function isContainerResult(result: TrivyResult): boolean {
  const clase = (result.Class ?? "").toLowerCase();
  const tipo = (result.Type ?? "").toLowerCase();
  if (clase.includes("secret") || clase.includes("config") || clase.includes("license")) return false;
  if (tipo === "dockerfile" || tipo === "yaml" || tipo === "terraform") return false;
  return true;
}

export function parseTrivyReport(
  report: unknown,
  fallbackImage: string,
  fecha: string,
  buildId: string,
): TrivyMetrics | null {
  const docs = flattenReports(report);
  if (docs.length === 0) return null;

  const findings: TrivyFinding[] = [];
  let image = fallbackImage;
  let resultType: string | undefined;

  for (const doc of docs) {
    if (doc.ArtifactName) image = doc.ArtifactName;
    for (const result of doc.Results ?? []) {
      if (!isContainerResult(result)) continue;
      if (!resultType) resultType = result.Type;
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
  }

  const critical = findings.filter(f => f.severity === "CRÍTICA").length;
  const high = findings.filter(f => f.severity === "ALTA").length;
  const medium = findings.filter(f => f.severity === "MEDIA").length;
  const low = findings.filter(f => f.severity === "BAJA").length;
  const fixable = findings.filter(f => f.fixedVersion).length;

  return {
    image,
    baseImage: inferBaseImage(image, resultType),
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

async function listPrDefinitions(opts: {
  org: string;
  project: string;
  pat: string;
}): Promise<{ id: number; name: string }[]> {
  const found: { id: number; name: string }[] = [];
  let continuation: string | undefined;
  do {
    const url = new URL(
      `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}/_apis/build/definitions`,
    );
    url.searchParams.set("api-version", API);
    url.searchParams.set("$top", "200");
    url.searchParams.set("queryOrder", "definitionNameAscending");
    if (continuation) url.searchParams.set("continuationToken", continuation);
    const res = await fetch(url, { headers: azdoHeaders(opts.pat) });
    if (!res.ok) {
      throw new Error(`Azure DevOps definitions: ${res.status} ${await res.text()}`);
    }
    const body = (await res.json()) as { value?: { id: number; name: string }[] };
    for (const def of body.value ?? []) {
      if (def.name.endsWith("-pr")) found.push({ id: def.id, name: def.name });
    }
    continuation = res.headers.get("x-ms-continuationtoken") ?? undefined;
  } while (continuation);
  return found;
}

async function lastCompletedBuild(opts: {
  org: string;
  project: string;
  definitionId: number;
  pat: string;
}): Promise<{ id: number } | null> {
  const url = new URL(
    `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}/_apis/build/builds`,
  );
  url.searchParams.set("definitions", String(opts.definitionId));
  url.searchParams.set("statusFilter", "completed");
  url.searchParams.set("$top", "1");
  url.searchParams.set("queryOrder", "finishTimeDescending");
  url.searchParams.set("api-version", API);
  const res = await fetch(url, { headers: azdoHeaders(opts.pat) });
  if (!res.ok) return null;
  const body = (await res.json()) as { value?: { id: number }[] };
  return body.value?.[0] ?? null;
}

type AttachmentRef = { name: string; href?: string };

async function listJsonResultAttachments(opts: {
  org: string;
  project: string;
  buildId: number;
  pat: string;
}): Promise<AttachmentRef[]> {
  const url = `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}/_apis/build/builds/${opts.buildId}/attachments/${ATTACHMENT_TYPE}?api-version=${API}`;
  const res = await fetch(url, { headers: azdoHeaders(opts.pat) });
  if (res.ok) {
    const body = (await res.json()) as {
      value?: { name?: string; _links?: { self?: { href?: string } } }[];
    };
    const listed = (body.value ?? [])
      .filter(a => a.name)
      .map(a => ({ name: a.name as string, href: a._links?.self?.href }));
    if (listed.length > 0) return listed;
  }
  return listJsonResultFromTimeline(opts);
}

async function listJsonResultFromTimeline(opts: {
  org: string;
  project: string;
  buildId: number;
  pat: string;
}): Promise<AttachmentRef[]> {
  const url = `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}/_apis/build/builds/${opts.buildId}/timeline?api-version=${API}`;
  const res = await fetch(url, { headers: azdoHeaders(opts.pat) });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    id?: string;
    records?: { id?: string; name?: string }[];
  };
  const timelineId = body.id;
  const out: AttachmentRef[] = [];
  for (const record of body.records ?? []) {
    if (!record.id || !timelineId) continue;
    const attUrl = `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}/_apis/build/builds/${opts.buildId}/timeline/${timelineId}/records/${record.id}/attachments/${ATTACHMENT_TYPE}?api-version=${API}`;
    const attRes = await fetch(attUrl, { headers: azdoHeaders(opts.pat) });
    if (!attRes.ok) continue;
    const attBody = (await attRes.json()) as {
      value?: { name?: string; _links?: { self?: { href?: string } } }[];
    };
    for (const a of attBody.value ?? []) {
      if (a.name) out.push({ name: a.name, href: a._links?.self?.href });
    }
  }
  return out;
}

async function downloadJson(opts: {
  org: string;
  project: string;
  buildId: number;
  pat: string;
  attachment: AttachmentRef;
}): Promise<unknown | null> {
  const href =
    opts.attachment.href ??
    `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}/_apis/build/builds/${opts.buildId}/attachments/${ATTACHMENT_TYPE}/${encodeURIComponent(opts.attachment.name)}?api-version=${API}`;
  const res = await fetch(href, {
    headers: azdoHeaders(opts.pat, { Accept: "application/octet-stream" }),
  });
  if (!res.ok) return null;
  const text = (await res.text()).trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const startArr = text.indexOf("[");
    const idx =
      start >= 0 && (startArr < 0 || start < startArr)
        ? start
        : startArr >= 0
          ? startArr
          : -1;
    if (idx < 0) return null;
    try {
      return JSON.parse(text.slice(idx));
    } catch {
      return null;
    }
  }
}

export async function enrichTrivy(
  projectAzdo: string,
  repos: Repo[],
  opts: { org: string; pat: string; fecha: string },
): Promise<void> {
  const byName = new Map(repos.map(r => [r.name, r]));
  for (const repo of repos) repo.trivy = null;

  const definitions = await listPrDefinitions({
    org: opts.org,
    project: projectAzdo,
    pat: opts.pat,
  });

  for (const def of definitions) {
    const repoName = repoNameFromPrDefinition(def.name);
    if (!repoName) continue;
    const repo = byName.get(repoName);
    if (!repo || !repo.publicaImagen) continue;

    const build = await lastCompletedBuild({
      org: opts.org,
      project: projectAzdo,
      definitionId: def.id,
      pat: opts.pat,
    });
    if (!build) continue;

    const attachments = await listJsonResultAttachments({
      org: opts.org,
      project: projectAzdo,
      buildId: build.id,
      pat: opts.pat,
    });
    if (attachments.length === 0) continue;

    let parsed: TrivyMetrics | null = null;
    for (const attachment of attachments) {
      const report = await downloadJson({
        org: opts.org,
        project: projectAzdo,
        buildId: build.id,
        pat: opts.pat,
        attachment,
      });
      if (!report) continue;
      parsed = parseTrivyReport(
        report,
        `accusystechnology/${repo.name}:latest`,
        opts.fecha,
        String(build.id),
      );
      if (parsed) break;
    }
    repo.trivy = parsed;
  }
}

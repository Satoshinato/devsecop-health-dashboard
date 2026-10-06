import type { AzdoProject, Repo } from "../lib/snapshot.ts";
import {
  aplicaSonarPorNombre,
  esNombreCarpetaDevops,
} from "../lib/sonar-alcance.ts";
import { loadProjectsConfig } from "./config.ts";

const API = "7.1";

function azdoHeaders(pat: string): HeadersInit {
  const token = Buffer.from(`:${pat}`).toString("base64");
  return { Authorization: `Basic ${token}`, Accept: "application/json" };
}

interface AdoRepoRef {
  id: string;
  name: string;
}

function repoBaseUrl(opts: { org: string; project: string; repoId: string }): string {
  return (
    `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}` +
    `/_apis/git/repositories/${opts.repoId}`
  );
}

async function repoTieneCarpetaDevops(opts: {
  org: string;
  project: string;
  repoId: string;
  headers: HeadersInit;
}): Promise<boolean> {
  const base = repoBaseUrl(opts);
  // Items with recursionLevel=One returns 400 (valid enum is OneLevel) and
  // scopePath=/ + OneLevel often returns only the root tree, not children.
  const rootRes = await fetch(`${base}/items?path=/&api-version=${API}`, {
    headers: opts.headers,
  });
  if (!rootRes.ok) {
    console.warn(
      `Azure DevOps items (${opts.project}/${opts.repoId}): ${rootRes.status} — asumiendo sin carpeta devops`,
    );
    return false;
  }
  const rootBody = (await rootRes.json()) as {
    objectId?: string;
    value?: { objectId?: string; gitObjectType?: string }[];
  };
  const treeId =
    rootBody.objectId ??
    rootBody.value?.find(item => item.objectId)?.objectId;
  if (!treeId) {
    console.warn(
      `Azure DevOps items (${opts.project}/${opts.repoId}): sin objectId de tree — asumiendo sin carpeta devops`,
    );
    return false;
  }

  const treeRes = await fetch(`${base}/trees/${treeId}?api-version=${API}`, {
    headers: opts.headers,
  });
  if (!treeRes.ok) {
    console.warn(
      `Azure DevOps trees (${opts.project}/${opts.repoId}): ${treeRes.status} — asumiendo sin carpeta devops`,
    );
    return false;
  }
  const treeBody = (await treeRes.json()) as {
    treeEntries?: { relativePath?: string; path?: string; gitObjectType?: string }[];
  };
  return (treeBody.treeEntries ?? []).some(entry => {
    if (entry.gitObjectType !== "tree") return false;
    const name = entry.relativePath ?? entry.path ?? "";
    return esNombreCarpetaDevops(name);
  });
}

async function resolverAplicaSonar(
  repo: Repo,
  adoRef: AdoRepoRef | undefined,
  opts: { org: string; project: string; headers: HeadersInit },
): Promise<boolean> {
  if (aplicaSonarPorNombre(repo.name)) return true;
  if (!adoRef) return false;
  return repoTieneCarpetaDevops({
    org: opts.org,
    project: opts.project,
    repoId: adoRef.id,
    headers: opts.headers,
  });
}

export async function fetchInventario(opts: {
  org: string;
  pat: string;
}): Promise<AzdoProject[]> {
  const config = loadProjectsConfig();
  const headers = azdoHeaders(opts.pat);
  const projectsRes = await fetch(
    `https://dev.azure.com/${opts.org}/_apis/projects?api-version=${API}`,
    { headers },
  );
  if (!projectsRes.ok) {
    throw new Error(`Azure DevOps projects: ${projectsRes.status} ${await projectsRes.text()}`);
  }

  const out: AzdoProject[] = [];

  for (const proyecto of config.proyectos) {
    const reposRes = await fetch(
      `https://dev.azure.com/${opts.org}/${encodeURIComponent(proyecto.azdoProject)}/_apis/git/repositories?api-version=${API}`,
      { headers },
    );
    let remoteRefs: AdoRepoRef[] = [];
    if (reposRes.ok) {
      const body = (await reposRes.json()) as { value?: AdoRepoRef[] };
      remoteRefs = (body.value ?? []).map(r => ({ id: r.id, name: r.name }));
    } else {
      console.warn(
        `Azure DevOps repos (${proyecto.azdoProject}): ${reposRes.status} — usando inventario de projects.yml`,
      );
    }

    const known = new Map(proyecto.repos.map(r => [r.name, r]));
    const remoteByName = new Map(remoteRefs.map(r => [r.name, r]));
    const names =
      remoteRefs.length > 0 ? remoteRefs.map(r => r.name) : [...known.keys()];
    const repos: Repo[] = [];
    for (const name of names) {
      const cfg = known.get(name);
      repos.push({
        name,
        publicaImagen: cfg?.publicaImagen ?? !name.startsWith("lib-"),
        sonarProjectName: cfg?.sonarProjectName ?? null,
        sonarProjectKey: cfg?.sonarProjectKey ?? null,
        sonar: null,
        trivyPr: null,
        trivyBuild: null,
        trivy: null,
      });
    }

    for (const repo of repos) {
      repo.aplicaSonar = await resolverAplicaSonar(repo, remoteByName.get(repo.name), {
        org: opts.org,
        project: proyecto.azdoProject,
        headers,
      });
    }

    const enAlcance = repos.filter(r => r.aplicaSonar);

    out.push({
      key: proyecto.key,
      name: proyecto.name,
      azdoProject: proyecto.azdoProject,
      leader: proyecto.lider,
      reposTotal: enAlcance.length,
      esPoc: proyecto.esPoc,
      repos,
    });
  }

  return out;
}

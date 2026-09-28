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

async function repoTieneCarpetaDevops(opts: {
  org: string;
  project: string;
  repoId: string;
  headers: HeadersInit;
}): Promise<boolean> {
  const url =
    `https://dev.azure.com/${opts.org}/${encodeURIComponent(opts.project)}` +
    `/_apis/git/repositories/${opts.repoId}/items` +
    `?scopePath=/&recursionLevel=One&api-version=${API}`;
  const res = await fetch(url, { headers: opts.headers });
  if (!res.ok) {
    console.warn(
      `Azure DevOps items (${opts.project}/${opts.repoId}): ${res.status} — asumiendo sin carpeta devops`,
    );
    return false;
  }
  const body = (await res.json()) as {
    value?: { path: string; isFolder?: boolean; gitObjectType?: string }[];
  };
  return (body.value ?? []).some(item => {
    const isFolder = item.isFolder === true || item.gitObjectType === "tree";
    if (!isFolder) return false;
    const segment = item.path.replace(/^\/+/, "").split("/").filter(Boolean)[0] ?? "";
    return esNombreCarpetaDevops(segment);
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

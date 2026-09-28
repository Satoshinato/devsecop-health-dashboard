import type { AzdoProject, Repo } from "../lib/snapshot.ts";
import { loadProjectsConfig } from "./config.ts";

const API = "7.1";

function azdoHeaders(pat: string): HeadersInit {
  const token = Buffer.from(`:${pat}`).toString("base64");
  return { Authorization: `Basic ${token}`, Accept: "application/json" };
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
    let remoteNames: string[] = [];
    if (reposRes.ok) {
      const body = (await reposRes.json()) as { value?: { name: string }[] };
      remoteNames = (body.value ?? []).map(r => r.name);
    } else {
      console.warn(
        `Azure DevOps repos (${proyecto.azdoProject}): ${reposRes.status} — usando inventario de projects.yml`,
      );
    }

    const known = new Map(proyecto.repos.map(r => [r.name, r]));
    const names = remoteNames.length > 0 ? remoteNames : [...known.keys()];
    const repos: Repo[] = names.map(name => {
      const cfg = known.get(name);
      return {
        name,
        publicaImagen: cfg?.publicaImagen ?? !name.startsWith("lib-"),
        sonarProjectName: cfg?.sonarProjectName ?? null,
        sonarProjectKey: cfg?.sonarProjectKey ?? null,
        sonar: null,
        trivyPr: null,
        trivyBuild: null,
        trivy: null,
      };
    });

    out.push({
      key: proyecto.key,
      name: proyecto.name,
      azdoProject: proyecto.azdoProject,
      leader: proyecto.lider,
      reposTotal: repos.length,
      esPoc: proyecto.esPoc,
      repos,
    });
  }

  return out;
}

import type { AzdoProject, Repo } from "../lib/snapshot.ts";
import { loadProjectsConfig } from "./config.ts";

/** Inventario estático desde config/projects.yml (sin llamar a Azure DevOps). */
export function inventoryFromYml(root = process.cwd()): AzdoProject[] {
  const file = loadProjectsConfig(root);
  return file.proyectos.map(p => ({
    key: p.key,
    name: p.name,
    azdoProject: p.azdoProject,
    leader: p.lider,
    reposTotal: p.repos.length,
    esPoc: p.esPoc,
    repos: p.repos.map(
      (r): Repo => ({
        name: r.name,
        publicaImagen: r.publicaImagen,
        sonarProjectName: r.sonarProjectName ?? null,
        sonarProjectKey: r.sonarProjectKey ?? null,
        sonar: null,
        trivyPr: null,
        trivyBuild: null,
        trivy: null,
        renovate: null,
      }),
    ),
  }));
}

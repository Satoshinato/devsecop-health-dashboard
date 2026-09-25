import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import { loadProjectsConfig, type ProjectConfig, type RepoConfig } from "./config.ts";
import {
  fetchDependencyHealth,
  publicaImagenDe,
  reposPorProyecto,
  renovateHostFromEnv,
} from "./renovate.ts";

const HEADER = `# Inventario DevSecOps — 13 proyectos Azure DevOps.
#
# Los repos se sincronizan desde Dependency Health (Renovate):
#   npm run scan:inventario
# Fuente: https://renovate.shared.accusys.com.ar/api/data/dashboard
# Es un piso: solo repos donde Renovate detectó dependencias (pom, package.json, Dockerfile, etc.).
#
# Las keys de Gema pueden ser placeholders: el colector las resuelve contra
# https://sonarqube.shared.accusys.com.ar (api/components/search).
# Formato si se cargan a mano:
#   sonarProjectName: gema_<repo>
#   sonarProjectKey:  <Project Key de Community>
#
# Cuando llegue el PAT de Azure DevOps, fetchInventario completa repos que Renovate no ve.
`;

function buildRepos(
  proyecto: ProjectConfig,
  renovateNames: string[],
  dashboard: Awaited<ReturnType<typeof fetchDependencyHealth>>,
): RepoConfig[] {
  const known = new Map(proyecto.repos.map(r => [r.name, r]));
  const names = new Set(renovateNames);

  for (const repo of proyecto.repos) {
    if (repo.sonarProjectKey && !names.has(repo.name)) {
      names.add(repo.name);
    }
  }

  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map(name => {
      const cfg = known.get(name);
      return {
        name,
        publicaImagen: cfg?.publicaImagen ?? publicaImagenDe(dashboard, proyecto.azdoProject, name),
        sonarProjectName: cfg?.sonarProjectName ?? null,
        sonarProjectKey: cfg?.sonarProjectKey ?? null,
      };
    });
}

async function main() {
  const root = process.cwd();
  const host = renovateHostFromEnv();
  console.log(`Dependency Health: ${host}`);
  const dashboard = await fetchDependencyHealth(host);
  console.log(
    `Scan ${dashboard.scanDate}: ${dashboard.scannedRepositoryCount ?? "?"} repos escaneados, ${dashboard.dependencies.length} dependencias`,
  );

  const file = loadProjectsConfig(root);
  const porProyecto = reposPorProyecto(dashboard);
  const mappedAzdo = new Set(file.proyectos.map(p => p.azdoProject));
  const unmapped = [...porProyecto.keys()].filter(p => !mappedAzdo.has(p)).sort();

  let totalRepos = 0;
  for (const proyecto of file.proyectos) {
    const renovateNames = porProyecto.get(proyecto.azdoProject) ?? [];
    proyecto.repos = buildRepos(proyecto, renovateNames, dashboard);
    totalRepos += proyecto.repos.length;
    console.log(`  ${proyecto.azdoProject}: ${proyecto.repos.length} repos`);
  }

  if (unmapped.length > 0) {
    console.warn(`Proyectos en Renovate sin mapeo en projects.yml (${unmapped.length}):`);
    for (const p of unmapped.slice(0, 10)) {
      console.warn(`  - ${p} (${porProyecto.get(p)?.length ?? 0} repos)`);
    }
    if (unmapped.length > 10) {
      console.warn(`  … y ${unmapped.length - 10} más`);
    }
  }

  const out = {
    organizacionAzdo: file.organizacionAzdo,
    organizacionSonar: file.organizacionSonar,
    proyectos: file.proyectos,
  };

  const path = join(root, "config/projects.yml");
  writeFileSync(path, `${HEADER}${stringify(out, { lineWidth: 0 })}\n`);
  console.log(`Escrito ${path} (${file.proyectos.length} proyectos, ${totalRepos} repos)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

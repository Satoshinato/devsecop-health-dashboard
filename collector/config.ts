import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export interface RepoConfig {
  name: string;
  publicaImagen: boolean;
  sonarProjectName: string | null;
  sonarProjectKey: string | null;
}

export interface ProjectConfig {
  key: string;
  name: string;
  azdoProject: string;
  lider: string;
  esPoc?: boolean;
  repos: RepoConfig[];
}

export interface ProjectsFile {
  organizacionAzdo: string;
  organizacionSonar: string;
  proyectos: ProjectConfig[];
}

export function loadProjectsConfig(root = process.cwd()): ProjectsFile {
  const raw = readFileSync(join(root, "config/projects.yml"), "utf8");
  return parse(raw) as ProjectsFile;
}

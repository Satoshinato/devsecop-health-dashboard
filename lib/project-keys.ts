import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

interface ProjectsFile {
  proyectos: { key: string }[];
}

export function projectKeysFromYml(root = process.cwd()): string[] {
  const raw = readFileSync(join(root, "config/projects.yml"), "utf8");
  const file = parse(raw) as ProjectsFile;
  return file.proyectos.map(p => p.key);
}

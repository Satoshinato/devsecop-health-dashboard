/** Reglas de alcance Sonar: ms/mf siempre; el resto solo con carpeta devops en la raíz. */

const PREFIJO_MS_MF = /^(ms|mf)[-_]/i;

/** Repo cuyo nombre indica microservicio o microfrontend (siempre en alcance Sonar). */
export function aplicaSonarPorNombre(repoName: string): boolean {
  return PREFIJO_MS_MF.test(repoName);
}

/** Nombre de carpeta en la raíz que habilita Sonar para repos infra (helm, db, etc.). */
export function esNombreCarpetaDevops(name: string): boolean {
  const base =
    name
      .replace(/^\/+/, "")
      .split("/")
      .filter(Boolean)[0]
      ?.toLowerCase() ?? "";
  return base === "devops" || base === ".devops";
}

export interface RepoConAlcanceSonar {
  name: string;
  aplicaSonar?: boolean;
}

/** Alcance efectivo: campo del snapshot o fallback por nombre (JSON viejos sin `aplicaSonar`). */
export function aplicaSonarDe(repo: RepoConAlcanceSonar): boolean {
  if (repo.aplicaSonar !== undefined) return repo.aplicaSonar;
  return aplicaSonarPorNombre(repo.name);
}

export function reposEnAlcanceSonar<T extends RepoConAlcanceSonar>(repos: T[]): T[] {
  return repos.filter(aplicaSonarDe);
}

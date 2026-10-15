import { SONAR_HOST_DEFAULT } from "./quality-gate.ts";

export function sonarHostFromEnv(env: NodeJS.Dict<string | undefined> = process.env): string {
  const raw = env.SONAR_HOST?.trim() || SONAR_HOST_DEFAULT;
  return raw.replace(/\/+$/, "");
}

/** Enlace a la pestaña Issues del proyecto (Community 25 / MQR). */
export function sonarProjectIssuesUrl(
  projectKey: string,
  opts: { kinds?: "bugs" | "vulnerabilities" | "all" } = { kinds: "bugs" },
  env: NodeJS.Dict<string | undefined> = process.env,
): string {
  const host = sonarHostFromEnv(env);
  const params = new URLSearchParams({ id: projectKey });
  // `resolved=false` ya no filtra bien en UI reciente; usar estados explícitos.
  params.set("issueStatuses", "OPEN,CONFIRMED,REOPENED");
  if (opts.kinds === "bugs") params.set("types", "BUG");
  else if (opts.kinds === "vulnerabilities") params.set("types", "VULNERABILITY");
  return `${host}/project/issues?${params.toString()}`;
}

/** Issues abiertos sin filtrar por tipo (útil si MQR oculta BUG). */
export function sonarProjectIssuesAllOpenUrl(
  projectKey: string,
  env: NodeJS.Dict<string | undefined> = process.env,
): string {
  const host = sonarHostFromEnv(env);
  const params = new URLSearchParams({
    id: projectKey,
    issueStatuses: "OPEN,CONFIRMED,REOPENED",
  });
  return `${host}/project/issues?${params.toString()}`;
}

export function sonarIssueOpenUrl(projectKey: string, issueKey: string, env: NodeJS.Dict<string | undefined> = process.env): string {
  const host = sonarHostFromEnv(env);
  const params = new URLSearchParams({ id: projectKey, open: issueKey });
  return `${host}/project/issues?${params.toString()}`;
}

export function sonarDashboardUrl(projectKey: string, env: NodeJS.Dict<string | undefined> = process.env): string {
  return `${sonarHostFromEnv(env)}/dashboard?id=${encodeURIComponent(projectKey)}`;
}

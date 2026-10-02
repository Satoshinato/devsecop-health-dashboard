# DevSecOps health (Deuda Técnica)

Tablero estático de deuda técnica, adopción de SonarQube (Community: `https://sonarqube.shared.accusys.com.ar`) y Trivy (imágenes de contenedor) sobre los 13 proyectos de Azure DevOps. La POC de Fase 1 es **Gema - Ophir**.

Rutas:

- `/` portada ejecutiva
- `/ranking` ranking de proyectos
- `/[proyecto]` detalle (por ejemplo `/gema`)

## Cómo correrlo en local

```bash
npm ci
npm run scan:fixture   # genera public/data/dashboard.json y history.json
npm test
npm run dev            # http://localhost:4317
```

El browser lee `/data/dashboard.json` y `/data/history.json` (archivos en `public/data/`). No hace falta S3.

Export estático:

```bash
npm run build          # sale `out/`
```

## Scan fixture vs scan real

| Comando | Qué hace |
| --- | --- |
| `npm run scan:fixture` | Inventario desde `config/projects.yml` y métricas plausibles de Gema. Escribe `public/data/`. |
| `npm run scan` | `--source=all` (default). Sin credenciales: YAML. Con credenciales: Sonar y/o Azure DevOps. |
| `npm run scan -- --source=sonar` | Solo Sonar (pool AccusysShared). |
| `npm run scan -- --source=azure` | Inventario + Trivy (agente hosted). |
| `npm run scan -- --merge --azure-file … --sonar-file …` | Une ambos parciales. |

Variables para el scan real (Library group **`devsecops-dashboard`**):

| Variable | Uso |
| --- | --- |
| `SONAR_TOKEN` | User token de SonarQube Community. |
| `SONAR_ORG` | `accusys`. |
| `SONAR_HOST` | Opcional. Default `https://sonarqube.shared.accusys.com.ar`. |
| `AZDO_ORG` / `AZDO_PAT` | Inventario remoto y Trivy. PAT: **Code + Build + Project and team**. |

## Pipeline (forma 1, publish apagado)

`azure-pipelines.yml` en el proyecto **qa**. No usa repos de devops/Renovate.

| Job | Pool | Qué hace |
| --- | --- | --- |
| `collect_sonar` | **AccusysShared** | Queries a Community. Artifact `sonar-partial`. `continueOnError`. |
| `collect_azure` | `ubuntu-latest` | Inventario + Trivy. Artifact `azure-partial`. |
| `publish_data` | hosted | Merge a `dashboard.json` + `history.json`. Artifact `dashboard-data`. **S3 solo si** `publishDashboard=true`. |
| `publish_web` | hosted | Tests + `next build`. **S3 web solo si** `publishWeb=true`. |

`publishDashboard` y `publishWeb` default **false** hasta que qa tenga la service connection AWS (la de Renovate vive en devops; hay que compartirla). Variables a agregar entonces: `awsCredentials`, `regionName`, `dashboardBucket`, `dashboardWebBucket`, `cloudFrontDistribution` (group `Dev` ya tiene las dos primeras).

Schedule diario y trigger `main` no suben a S3 mientras esos flags estén en false.

## Contrato de datos

El front no hardcodea métricas: `fetch("/data/dashboard.json")` y `history.json` (hasta 14 scans). Agregaciones en `lib/metrics.ts`. Trivy se lee del attachment `JSON_RESULT` de pipelines `*-pr` y `*-build`.

## Pedido AWS (cuando toque)

Compartir a **qa** la connection AWS del ambiente Dev, nombre exacto de **accusysdevsecops** (bucket o prefijo), y si hay bucket web + CloudFront para este tablero. Docker/ACR/AKS no son el camino de publicación.

# DevSecOps health (Deuda Técnica)

## Cambios en el repo (Azure DevOps)

La rama `main` está protegida: no hacer push directo. Flujo Accusys (TBD): rama corta → PR → merge a `main` (Conventional Commits, p. ej. `ci: …`, `feat: …`).

```bash
git checkout -b ci/mi-cambio
git push -u origin ci/mi-cambio
# Crear PR en ADO o: ./scripts/ado-create-pr.ps1 -SourceBranch ci/mi-cambio
```

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
| `npm run scan -- --source=sonar` | Solo Sonar (pool Accusys Shared). |
| `npm run scan -- --source=azure` | Inventario + Trivy (agente hosted). |
| `npm run scan -- --merge --azure-file … --sonar-file …` | Une ambos parciales. |

### Rutina diaria Sonar — solo Gema (POC)

PowerShell (requiere `SONAR_ORG` + `SONAR_TOKEN` en la sesión):

```powershell
.\scripts\daily-sonar-gema.ps1
```

Hace: `npm run scan -- --source=sonar` → recorte Gema en `data/gema/scans/` + `data/gema/history.json` → `data/gema/triage-<fecha>.md` (delta bugs/vulns, gate ERROR, links a issues abiertos en Sonar para preparar bugs en ADO proyecto `gema`).

Solo export/delta sin re-escanear: `.\scripts\daily-sonar-gema.ps1 -SkipScan` o `npm run gema:export` / `npm run gema:delta`.

Variables para el scan real (Library group **`devsecops-dashboard`**):

| Variable | Uso |
| --- | --- |
| `SONAR_TOKEN` | User token de SonarQube Community. |
| `SONAR_ORG` | `accusys`. |
| `SONAR_HOST` | Opcional. Default `https://sonarqube.shared.accusys.com.ar`. |
| `AZDO_ORG` / `AZDO_PAT` | Inventario remoto y Trivy. PAT: **Code + Build + Project and team**. |
| `awsCredentials` | Nombre de la service connection AWS en qa (`Accusys Dev`). También definido en el YAML. |
| `regionName` | Región del bucket `accusys-devsecops` (p. ej. `sa-east-1`). También definido en el YAML. |

Tras crear la connection en qa, en el primer run con `AWSShellScript@1` puede pedirse **Permit** para `Accusys Dev` y para el variable group en el pipeline.

## Pipeline

`azure-pipelines.yml` en el proyecto **qa**. No usa repos de devops/Renovate.

| Job | Pool | Qué hace |
| --- | --- | --- |
| `collect_sonar` | **Accusys Shared** (opcional) | Queries a Community. Desactivar con parámetro `collectSonar=false` si el pool no está autorizado para el pipeline. |
| `collect_azure` | `ubuntu-latest` | Inventario + Trivy. Artifact `azure-partial`. |
| `publish_data` | hosted | Merge a `dashboard.json` + `history.json`. Artifact `dashboard-data`. **S3 solo si** `publishDashboard=true`. |
| `publish_web` | hosted | Tests + `next build`. **S3 web solo si** `publishWeb=true`. |

Bucket único **`accusys-devsecops`** (confirmado). Layout:

```
s3://accusys-devsecops/
  index.html ranking/ gema/ _next/   ← out/ (sitio)
  data/dashboard.json
  data/history.json
  runs/<fecha>/dashboard.json
```

Sin CloudFront. El sync de `out/` no borra `data/` ni `runs/`.

La service connection **Accusys Dev** debe existir en **Project settings → Service connections** (proyecto qa). `publishDashboard` y `publishWeb` controlan la subida a S3 (ver parámetros del pipeline).

Primer publish manual (recomendado): **Run pipeline** con `publishDashboard=true` y `publishWeb=true`, o:

```powershell
$env:AZURE_DEVOPS_EXT_PAT = "<PAT con Build Execute>"
./scripts/ado-queue-publish-run.ps1
```

Por defecto `publishDashboard` y `publishWeb` están en **true** (schedule y push a `main` publican en S3). Para un run de prueba sin subir, desmarcar ambos al ejecutar el pipeline.

## Contrato de datos

El front no hardcodea métricas: `fetch("/data/dashboard.json")` y `history.json` (hasta 14 scans). Agregaciones en `lib/metrics.ts`. Trivy se lee del attachment `JSON_RESULT` de pipelines `*-pr` y `*-build`.

## Agent pool Sonar (`Accusys Shared`)

El job `collect_sonar` usa un pool **self-hosted** con red hacia Sonar Community. El nombre exacto del pool es **Accusys Shared** (con espacio). El pipeline debe estar autorizado en **qa → Agent pools → Accusys Shared → Security**.

Para un run sin Sonar: **collectSonar** desmarcado (default `false`).

## Service connection AWS (qa)

Connection **Accusys Dev** en Project settings. Permisos S3 mínimos en `accusys-devsecops`: `ListBucket`; `GetObject` / `PutObject` en el bucket (`s3:DeleteObject` no se usa: el sync web no borra objetos).

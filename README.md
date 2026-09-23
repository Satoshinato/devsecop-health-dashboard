# DevSecOps health (Deuda Técnica)

Tablero estático de deuda técnica, adopción de SonarQube Cloud y Trivy (imágenes de contenedor) sobre los 13 proyectos de Azure DevOps (133 repos). La POC de Fase 1 es **Gema - Ophir**.

Rutas:

- `/` portada ejecutiva
- `/ranking` ranking de proyectos
- `/[proyecto]` detalle (por ejemplo `/gema`)

## Cómo correrlo en local

```bash
npm ci
npm run scan:fixture   # genera data/scans/scan-YYYY-MM-DD.json
npm test
npm run dev            # http://localhost:4317
```

Export estático:

```bash
npm run build          # sale `out/`
```

## Scan fixture vs scan real

| Comando | Qué hace |
| --- | --- |
| `npm run scan:fixture` | Arma el inventario desde `config/projects.yml` y rellena métricas **plausibles** de Gema. No llama a Sonar ni a Azure DevOps. Sirve para el build y la validación local. |
| `npm run scan` | Requiere credenciales. Inventario AzDO + measures Sonar + attachment `JSON_RESULT` del último build **completado** de cada definición `*-pr`. |

Variables de entorno para el scan real (`SONAR_TOKEN`, `SONAR_ORG`, `AZDO_ORG`, `AZDO_PAT`). En Azure DevOps van en el Library group **`devsecops-dashboard`** (ligado al YAML; no se commitean). El PAT es de lectura: **Code + Build + Project and team**. El de SonarCloud es un **user token** de la org, no un token de análisis de un proyecto suelto. En local se exportan las mismas vars; sin ellas `npm run scan` pide `--from-fixture` y el pipeline diario omite el colector.

Los UUID de `sonarProjectKey` de Gema en `config/projects.yml` son **placeholders** hasta cargar los project key reales.

Este entorno no validó contra Gema real: no hay PAT ni token de Sonar en el agente.

## Deploy

1. Pipeline `azure-pipelines.yml` (variable group `devsecops-dashboard`): `npm ci`, scan (o skip), tests, `next build`, imagen Docker nginx que sirve `out/`.
2. Manifiestos en `k8s/` (Deployment + Service + Ingress, host de ejemplo `devsecops.shared.accusys.com.ar`).
3. Trivy Fase 1 no pide cambios de YAML: el colector lee el attachment `JSON_RESULT` que ya publica la task Aqua en los pipelines `*-pr` (p. ej. `ms-ophir-api-pr` → repo `ms-ophir-api`).

## Contrato de datos

El front no hardcodea métricas: lee el último snapshot y hasta 14 anteriores en `data/scans/`. Las agregaciones están en `lib/metrics.ts` (adopción Trivy solo sobre `publicaImagen`, deuda en días = `sqale_index / 480`, top = críticos × repos). El colector de Trivy no usa Pipeline Artifacts: baja el attachment `JSON_RESULT` del último build completado de cada definición cuyo nombre termina en `-pr`.

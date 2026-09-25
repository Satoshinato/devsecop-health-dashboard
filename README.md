# DevSecOps health (Deuda Técnica)

Tablero estático de deuda técnica, adopción de SonarQube (Community: `https://sonarqube.shared.accusys.com.ar`), dependencias en fin de soporte (Dependency Health / Renovate: `https://renovate.shared.accusys.com.ar`) y Trivy (imágenes de contenedor) sobre los 13 proyectos de Azure DevOps. La POC de Fase 1 es **Gema - Ophir**.

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
| `npm run scan:inventario` | Sincroniza `config/projects.yml` con los repos reales de [Dependency Health](https://renovate.shared.accusys.com.ar) (sin PAT). Conserva claves Sonar existentes. |
| `npm run scan` | Sin credenciales: inventario YAML + métricas Renovate. Con credenciales: suma Sonar y/o Azure DevOps (Trivy + inventario remoto). |

Variables de entorno para el scan real:

| Variable | Uso |
| --- | --- |
| `SONAR_TOKEN` | User token de [SonarQube Community](https://sonarqube.shared.accusys.com.ar) (My Account → Security). |
| `SONAR_ORG` | Obligatorio para arrancar el scan (`accusys`). En Community no va en la URL. |
| `SONAR_HOST` | Opcional. Default `https://sonarqube.shared.accusys.com.ar`. |
| `RENOVATE_HOST` | Opcional. Default `https://renovate.shared.accusys.com.ar`. Sin credenciales. |
| `AZDO_ORG` / `AZDO_PAT` | Inventario remoto y Trivy. PAT de lectura: **Code + Build + Project and team**. |

En Azure DevOps van en el Library group **`devsecops-dashboard`**. Sin PAT, `npm run scan` igual escribe snapshot con inventario YAML + Dependency Health. Sonar requiere `SONAR_TOKEN` y `SONAR_ORG`.

El colector lista proyectos TRK en Community y matchea por key/nombre de repo (las UUID de muestra del YAML no bloquean). Un 400 de Trivy/AzDO **no aborta** el scan: se omite ese proyecto y se escribe el snapshot.

## Deploy

1. Pipeline `azure-pipelines.yml` (variable group `devsecops-dashboard`): `npm ci`, scan (o skip), tests, `next build`, imagen Docker nginx que sirve `out/`.
2. Manifiestos en `k8s/` (Deployment + Service + Ingress, host de ejemplo `devsecops.shared.accusys.com.ar`).
3. Trivy Fase 1 no pide cambios de YAML: el colector lee el attachment `JSON_RESULT` que ya publica la task Aqua en los pipelines `*-pr` (p. ej. `ms-ophir-api-pr` → repo `ms-ophir-api`).

## Contrato de datos

El front no hardcodea métricas: lee el último snapshot y hasta 14 anteriores en `data/scans/`. Las agregaciones están en `lib/metrics.ts` (adopción Trivy solo sobre `publicaImagen`, deuda en días = `sqale_index / 480`, top = críticos × repos). El colector de Trivy no usa Pipeline Artifacts: baja el attachment `JSON_RESULT` del último build completado de cada definición cuyo nombre termina en `-pr`.

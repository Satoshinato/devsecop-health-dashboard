# DevSecOps health (Deuda Técnica)

Tablero estático de deuda técnica, adopción de SonarQube (Community: `https://sonarqube.shared.accusys.com.ar`) y Trivy (imágenes de contenedor) sobre los 13 proyectos de Azure DevOps. La POC de Fase 1 es **Gema - Ophir**.

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
| `npm run scan` | Sin credenciales: inventario YAML. Con credenciales: suma Sonar y/o Azure DevOps (Trivy + inventario remoto). |

Variables de entorno para el scan real:

| Variable | Uso |
| --- | --- |
| `SONAR_TOKEN` | User token de [SonarQube Community](https://sonarqube.shared.accusys.com.ar) (My Account → Security). |
| `SONAR_ORG` | Obligatorio para arrancar el scan (`accusys`). En Community no va en la URL. |
| `SONAR_HOST` | Opcional. Default `https://sonarqube.shared.accusys.com.ar`. |
| `AZDO_ORG` / `AZDO_PAT` | Inventario remoto y Trivy. PAT de lectura: **Code + Build + Project and team**. |

En Azure DevOps van en el Library group **`devsecops-dashboard`**. Sin PAT, `npm run scan` escribe snapshot con inventario YAML. Sonar requiere `SONAR_TOKEN` y `SONAR_ORG`.

El colector lista proyectos TRK en Community y matchea por key/nombre de repo (las UUID de muestra del YAML no bloquean). Un 400 de Trivy/AzDO **no aborta** el scan: se omite ese proyecto y se escribe el snapshot.

## Deploy

1. Pipeline `azure-pipelines.yml` (variable group `devsecops-dashboard`): `npm ci`, scan (o skip), tests, `next build`, imagen Docker nginx que sirve `out/`.
2. Manifiestos en `k8s/` (Deployment + Service + Ingress, host de ejemplo `devsecops.shared.accusys.com.ar`).
3. Trivy Fase 1 no pide cambios de YAML: el colector lee el attachment `JSON_RESULT` que ya publica la task Aqua en los pipelines `*-pr` (p. ej. `ms-ophir-api-pr` → repo `ms-ophir-api`).

### SonarQube desde la pipeline

`sonarqube.shared.accusys.com.ar` resuelve a IPs internas `10.x`. El agente hosted `ubuntu-latest` no llega: el scan escribe snapshot igual, pero omite Sonar.

Para métricas reales en CI hay que correr el job en un **self-hosted agent** de la red Accusys (mismo alcance que usa tu PC local). En `azure-pipelines.yml` reemplazar:

```yaml
pool:
  vmImage: ubuntu-latest
```

por el pool interno, por ejemplo:

```yaml
pool:
  name: <nombre-del-agent-pool>
```

El variable group `devsecops-dashboard` no cambia: `SONAR_TOKEN`, `SONAR_ORG`, `AZDO_ORG`, `AZDO_PAT`.

## Contrato de datos

El front no hardcodea métricas: lee el último snapshot y hasta 14 anteriores en `data/scans/`. Las agregaciones están en `lib/metrics.ts` (adopción Trivy solo sobre `publicaImagen`, deuda en días = `sqale_index / 480`, top = críticos × repos). El colector de Trivy baja el attachment `JSON_RESULT` de builds recientes de cada definición cuyo nombre termina en `-pr`.

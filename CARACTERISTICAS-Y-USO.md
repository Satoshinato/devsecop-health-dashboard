# DevSecOps health (Deuda Técnica) — Características y uso

Repositorio: [devsecop-health-dashboard](https://dev.azure.com/accusystechnology/qa/_git/devsecop-health-dashboard)  
Copia local: `C:\Users\lautaro.acosta\.cursor\devsecop-health-dashboard`  
Rama: `main` (commit `808fc19`).

Tablero estático de **deuda técnica**, **adopción de SonarQube Community** (`https://sonarqube.shared.accusys.com.ar`) y **Trivy** (imágenes de contenedor) sobre **13 proyectos** de Azure DevOps. La POC de Fase 1 es **Gema - Ophir**. El inventario de repos sale de `config/projects.yml`; con PAT, `fetchInventario` completa repos desde Azure DevOps.

---

## 1. Para qué sirve

Da una vista ejecutiva y por proyecto de:

- Cuántos repos tienen proyecto en SonarQube (adopción).
- Cuántos repos que publican imagen tienen scan Trivy.
- Deuda técnica (minutos `sqale_index` → días de jornada de 8 h).
- Bugs, vulnerabilidades, hotspots y Quality Gate.
- CVE por severidad, imágenes base con más impacto y CVE transversales (mismo CVE en más de un repo).

El front **no hardcodea métricas**: lee snapshots JSON en `data/scans/` (el último y hasta 14 anteriores).

---

## 2. Características

### Stack

| Pieza | Detalle |
| --- | --- |
| UI | Next.js 16 (App Router), React 19, Tailwind 4 |
| Export | `output: "export"` → sitio estático en `out/` |
| Colector | TypeScript con `tsx` (`collector/`) |
| Tests | `tsx --test` sobre métricas y parser Trivy |
| Runtime prod | Imagen `nginx:1.27-alpine` que sirve `out/` |
| CI | Azure Pipelines (`azure-pipelines.yml`) |
| Deploy | Manifiestos Kubernetes en `k8s/` |

### Rutas de la UI

| Ruta | Contenido |
| --- | --- |
| `/` | Portada ejecutiva: KPIs, adopción, tendencias, CVE, imágenes base, severidades, quality gates |
| `/ranking` | Tabla de 13 proyectos (orden por deuda / 1k líneas), buscador, leyenda de lectura |
| `/[proyecto]` | Detalle por repo (ej. `/gema/`). Rutas estáticas desde el snapshot |

### Métricas que muestra

- **Adopción Sonar** = repos con `sonarProjectKey` / total de repos del inventario.
- **Adopción Trivy** = repos con scan Trivy / repos con `publicaImagen`.
- **Deuda en días** = `sqale_index` / 480 (minutos de una jornada de 8 h).
- **Deuda / 1k líneas** = minutos de deuda cada 1.000 líneas (para comparar proyectos de distinto tamaño).
- **Cobertura** ponderada por `ncloc`.
- **Impacto de imagen base** = CVE críticos únicos × repos afectados.
- **Top de proyectos** por críticos × repos (en agregaciones del README).

### Inventario (`config/projects.yml`)

Organización AzDO: `accusystechnology`. SonarQube Community: `https://sonarqube.shared.accusys.com.ar`.

| Key | Nombre | Líder | POC |
| --- | --- | --- | --- |
| gema | Gema - Ophir | Sebastián Denezio | Sí (18 repos; 15 con keys Sonar de muestra) |
| probatch | Probatch | Leonardo Orellana | No |
| cronos | Mep - Cronos | Fernando Luna | No |
| iris | Accusys Link - Iris | Ivette Guevara | No |
| apolo | Sidef - Apolo | Javier Montiel | No |
| zeus | Mep Contable - Zeus | Eduardo Fabaro | No |
| janus | Pases y Cryl - Janus | Hernán Atencio | No |
| argus | Mep Consolidado - Argus | Gustavo Troconis | No |
| afrodita | Mep Cedin - Afrodita | Lisbeth Atencio | No |
| themis | Repi - Themis | Braian Rosales | No |
| minerva | Niif - Minerva | Pablo Gálvez | No |
| hades | Mep SML - Hades | Joshua García | No |
| poseidon | Mep Contingencia - Poseidón | Lucas Gauna | No |

Los `sonarProjectKey` de Gema pueden ser placeholders: el colector las resuelve contra Community (`api/components/search`). El resto de proyectos tiene `sonarProjectKey: null` (Fase 1). Con PAT, `fetchInventario` completa repos desde Azure DevOps.

### Colector

1. **Inventario** (`config/projects.yml` + opcional `collector/azdo.ts`): lista repos desde YAML o Azure DevOps.
2. **SonarQube Community** (`collector/sonar.ts`): catálogo TRK + `api/measures/component`. Requiere `SONAR_TOKEN` y `SONAR_ORG`.
3. **Trivy** (`collector/trivy.ts`): requiere `AZDO_PAT`. Baja el attachment `JSON_RESULT` de builds recientes de cada definición cuyo nombre termina en `-pr`.

### Contrato de snapshot

Archivos `data/scans/scan-YYYY-MM-DD.json`:

```json
{
  "fecha": "2026-09-23",
  "organizacionAzdo": "accusystechnology",
  "organizacionSonar": "accusys",
  "projects": [ { "key", "name", "azdoProject", "leader", "reposTotal", "esPoc", "repos": [...] } ]
}
```

Cada repo: `publicaImagen`, `sonarProjectName` / `sonarProjectKey`, `sonar` (métricas o `null`), `trivy` (métricas + `findings` o `null`).

---

## 3. Uso local

Requisitos: Node.js 20.x, npm.

```powershell
cd C:\Users\lautaro.acosta\.cursor\devsecop-health-dashboard
npm ci
npm run scan:fixture   # genera data/scans/scan-YYYY-MM-DD.json (métricas plausibles de Gema)
npm test
npm run dev            # http://localhost:4317
```

Export estático:

```powershell
npm run build          # sale la carpeta out/
```

### Scan fixture vs scan real

| Comando | Qué hace |
| --- | --- |
| `npm run scan:fixture` | Inventario desde `config/projects.yml` + métricas **plausibles** de Gema. No llama a Sonar ni a AzDO. Sirve para build y demo local. |
| `npm run scan` | Sin credenciales: inventario YAML. Con credenciales: suma Sonar y/o AzDO (Trivy). |

`npm run scan` ya no exige PAT: escribe snapshot con lo que tenga disponible.

Fecha opcional: `npx tsx collector/main.ts --from-fixture` o `npx tsx collector/main.ts --fecha=2026-09-23`.

### Variables de entorno (scan real)

| Variable | Uso |
| --- | --- |
| `SONAR_TOKEN` | User token de SonarQube Community (My Account → Security) |
| `SONAR_ORG` | Sigue siendo obligatorio para arrancar (`accusys`); no va en la URL de Community |
| `SONAR_HOST` | Opcional. Default `https://sonarqube.shared.accusys.com.ar` |
| `AZDO_ORG` | Organización Azure DevOps (`accusystechnology`) |
| `AZDO_PAT` | PAT de lectura: **Code + Build + Project and team** |

En Azure DevOps viven en el Library group **`devsecops-dashboard`** (ligado al YAML; no se commitean). En local, exportar las mismas variables (o un `.env` que **no** se versiona).

PowerShell:

```powershell
$env:SONAR_TOKEN = "..."
$env:SONAR_ORG = "accusys"
$env:SONAR_HOST = "https://sonarqube.shared.accusys.com.ar"
$env:AZDO_ORG = "accusystechnology"
$env:AZDO_PAT = "..."
npm run scan
```

---

## 4. Pipeline y deploy

### Azure Pipelines

- Trigger: push a `main`.
- Schedule: cron diario `0 6 * * *` (scan diario).
- Variable group: `devsecops-dashboard`.
- Pasos: `npm ci` → scan real **solo si** están las 4 secrets; si no, usa `data/scans` ya versionado → `npm test` → `next build` → Docker build.
- Imagen: `accusystechnology.azurecr.io/devsecops-dashboard` (`BuildId` y `latest`).

El YAML de pipeline **no incluye push a ACR** ni `kubectl apply`; hoy el job termina en el `Docker@2` **build**.

### Kubernetes (`k8s/deployment.yaml`)

- Deployment 1 réplica, nginx puerto 80, probes en `/`.
- Service puerto 80.
- Ingress host de ejemplo: `devsecops.shared.accusys.com.ar`.

Aplicar (cuando la imagen ya esté en ACR):

```bash
kubectl apply -f k8s/deployment.yaml
```

Trivy Fase 1 **no** pide cambios de YAML de los productos: el colector lee el `JSON_RESULT` que ya publica Aqua en los `*-pr`.

---

## 5. Estructura del repo

```
app/                 páginas Next (/, /ranking, /[proyecto])
components/          UI DevSecOps + charts
collector/           scan AzDO + Sonar + Trivy + fixture
config/projects.yml  inventario 13 proyectos
data/scans/          snapshots JSON (fuente de la UI)
lib/                 métricas, carga de scans, contrato snapshot
k8s/                 Deployment + Service + Ingress
azure-pipelines.yml  CI
Dockerfile           nginx + out/
nginx.conf           SPA estático (try_files + index.html)
```

---

## 6. Limitaciones actuales (Fase 1)

- POC validada en UI con **fixture**, no contra Gema real (el README indica que el entorno de origen no tenía PAT ni token Sonar en el agente).
- Keys Sonar de Gema son placeholders.
- Fuera de Gema: sin mapeo Sonar; varios repos del YAML son sintéticos hasta que el scan real liste AzDO.
- El tablero es **estático**: no hay API en runtime; cada deploy congela el último snapshot del build.

---

## 7. Cómo leer el tablero (analista / líder)

1. **Portada** (`/`): salud global, deltas vs. scan anterior, CVE que se repiten, imágenes base a priorizar (p. ej. `openjdk:11` marcado fin de soporte si el nombre lo contiene).
2. **Ranking** (`/ranking`): qué proyecto arrancó adopción y cuál tiene peor deuda normalizada. Clic en el nombre → detalle.
3. **Detalle** (`/gema/`): desglose por repo (Sonar + Trivy) y lista lateral del ranking.

Los nombres de proyecto se muestran **completos** (ej. `Gema - Ophir`), no abreviados.

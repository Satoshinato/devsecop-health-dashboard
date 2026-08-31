# Tablero de Revisiones QA

Dashboard interactivo para el equipo de QA. Consolida métricas de revisiones de código, documentación, tests, seguridad, compliance y SonarQube procesadas por un MCP de IA.

## Características

- **Bloque 1 — Productividad individual**: revisiones por revisor, desglose por tipo, tasa de cierre, reincidencias, ciclos promedio, tiempo promedio
- **Bloque 2 — Calidad**: densidad de hallazgos, distribución por severidad, tasa de aceptación, falsos positivos, Quality Gate
- **Bloque 3 — Tiempos y eficiencia**: tiempo promedio de revisión por tipo, tiempo hasta primer comentario, ciclos, backlog aging
- **Bloque 4 — Indicadores de negocio**: Quality Gate %, compliance %, ROI de detección temprana, tendencia de deuda técnica, proyectos en riesgo
- **Bloque 5 — Tendencias**: burndown de defectos, heatmap de actividad, velocidad del equipo, score QA semanal, top hallazgos recurrentes

## Requisitos

- Node.js 18+
- npm 9+

## Cómo correr localmente

```bash
npm install
npm run dev
```

Abrir [http://localhost:4317](http://localhost:4317).

## Datos de muestra

Los datos están en `lib/data.ts`. Reemplazar con llamadas a la API del MCP real.

El esquema de eventos esperado por el MCP está documentado en `lib/mcp-schema.ts`.

## Exportar como HTML estático

```bash
npm run build
npm run export   # genera carpeta out/
```

Copiar el contenido de `out/` al directorio compartido de red:

```
\\srv-sonarqubeqa-n\CompartidoQA\Revisiones Qa\reports\
```

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS v4
- Gráficos SVG nativos (sin dependencias de charting externas)

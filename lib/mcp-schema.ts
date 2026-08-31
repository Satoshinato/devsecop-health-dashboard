/**
 * MCP Data Model — Schema de eventos que el MCP de IA debe capturar por cada revisión.
 *
 * Este archivo documenta los campos requeridos para alimentar todas las métricas del
 * tablero. El MCP debe emitir un evento JSON con esta estructura cada vez que procesa
 * una revisión de código, documentación, seguridad, compliance, tests o SonarQube.
 *
 * Endpoint sugerido: POST /api/qa-events  (o emisión directa al store de datos)
 */

export const MCP_EVENT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "QAReviewEvent",
  description: "Evento de revisión QA procesado por el MCP de IA",
  type: "object",
  required: [
    "id",
    "revisor_id",
    "proyecto",
    "artefacto_tipo",
    "fecha_asignacion",
    "fecha_inicio",
    "ciclos_revision",
  ],
  properties: {
    // ── Identificación ──────────────────────────────────────────────────────
    id: {
      type: "string",
      description: "UUID único del evento de revisión",
    },
    revisor_id: {
      type: "string",
      description: "ID del revisor QA asignado",
    },
    proyecto: {
      type: "string",
      description: "Nombre del proyecto o repositorio revisado",
    },
    artefacto_tipo: {
      type: "string",
      enum: ["codigo", "documentacion", "tests", "seguridad", "compliance", "sonarqube"],
      description: "Tipo de artefacto revisado",
    },
    artefacto_ref: {
      type: "string",
      description: "Referencia al artefacto: PR number, commit SHA, doc URL, etc.",
    },

    // ── Fechas ──────────────────────────────────────────────────────────────
    fecha_asignacion: {
      type: "string",
      format: "date-time",
      description: "Timestamp ISO 8601 en que la revisión fue asignada al revisor",
    },
    fecha_inicio: {
      type: "string",
      format: "date-time",
      description: "Timestamp en que el revisor inició activamente la revisión",
    },
    fecha_cierre: {
      type: ["string", "null"],
      format: "date-time",
      description: "Timestamp en que la revisión fue marcada como cerrada (null = en curso)",
    },

    // ── Proceso ─────────────────────────────────────────────────────────────
    ciclos_revision: {
      type: "integer",
      minimum: 0,
      description: "Número de ciclos revisión→corrección→re-revisión hasta el cierre",
    },
    estado: {
      type: "string",
      enum: ["asignada", "en_revision", "pendiente_dev", "cerrada", "cancelada"],
      description: "Estado actual de la revisión",
    },

    // ── Hallazgos ───────────────────────────────────────────────────────────
    hallazgos: {
      type: "array",
      description: "Lista de observaciones encontradas durante la revisión",
      items: {
        type: "object",
        required: ["id", "severity", "categoria"],
        properties: {
          id: { type: "string" },
          severity: {
            type: "string",
            enum: ["blocker", "critical", "major", "minor", "info"],
            description: "Severidad del hallazgo según escala SonarQube / OWASP",
          },
          categoria: {
            type: "string",
            description: "Categoría del hallazgo (ej: sql-injection, coverage-below-80, naming-convention)",
          },
          descripcion: {
            type: "string",
            description: "Descripción detallada del hallazgo",
          },
          aceptado_por_dev: {
            type: "boolean",
            description: "true si el equipo dev aceptó y corrigió la observación",
          },
          es_falso_positivo: {
            type: "boolean",
            description: "true si fue rechazado como incorrecto (afecta precisión del MCP)",
          },
          linea_referencia: {
            type: ["string", "null"],
            description: "Referencia de línea de código o sección del documento (opcional)",
          },
        },
      },
    },

    // ── Quality Gate ─────────────────────────────────────────────────────────
    quality_gate_resultado: {
      type: ["string", "null"],
      enum: ["passed", "failed", "warning", null],
      description: "Resultado del Quality Gate de SonarQube (null si no aplica)",
    },
    quality_gate_condiciones: {
      type: "array",
      description: "Condiciones del Quality Gate con resultado individual",
      items: {
        type: "object",
        properties: {
          metrica: { type: "string" },
          umbral: { type: "string" },
          valor_actual: { type: "string" },
          estado: { type: "string", enum: ["OK", "ERROR", "WARN"] },
        },
      },
    },

    // ── Deuda técnica ────────────────────────────────────────────────────────
    deuda_tecnica_antes: {
      type: "number",
      description: "Deuda técnica en minutos ANTES de la revisión (fuente: SonarQube API)",
    },
    deuda_tecnica_despues: {
      type: "number",
      description: "Deuda técnica en minutos DESPUÉS de aplicar las correcciones",
    },

    // ── Compliance ──────────────────────────────────────────────────────────
    compliance_ok: {
      type: ["boolean", "null"],
      description: "true si todos los criterios normativos fueron cumplidos (null si no aplica)",
    },
    compliance_normas: {
      type: "array",
      items: { type: "string" },
      description: "Lista de normas evaluadas (ej: GDPR, PCI-DSS, ISO-27001)",
    },

    // ── Cobertura ───────────────────────────────────────────────────────────
    cobertura_pct: {
      type: ["number", "null"],
      minimum: 0,
      maximum: 100,
      description: "Porcentaje de cobertura de tests reportado por SonarQube",
    },

    // ── Metadatos del MCP ───────────────────────────────────────────────────
    mcp_version: {
      type: "string",
      description: "Versión del MCP de IA que procesó la revisión",
    },
    mcp_modelo: {
      type: "string",
      description: "Modelo de IA utilizado (ej: gpt-4o, claude-3-5-sonnet)",
    },
    mcp_confianza: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Score de confianza del MCP en sus hallazgos (0–1)",
    },
  },
} as const;

/**
 * Campos mínimos requeridos por cada bloque del tablero:
 *
 * Bloque 1 (Productividad):  revisor_id, artefacto_tipo, fecha_asignacion, fecha_cierre,
 *                             hallazgos[], ciclos_revision
 *
 * Bloque 2 (Calidad):        hallazgos[].severity, hallazgos[].categoria,
 *                             hallazgos[].aceptado_por_dev, hallazgos[].es_falso_positivo,
 *                             quality_gate_resultado
 *
 * Bloque 3 (Tiempos):        fecha_asignacion, fecha_inicio, fecha_cierre, ciclos_revision,
 *                             artefacto_tipo
 *
 * Bloque 4 (Negocio):        quality_gate_resultado, compliance_ok, deuda_tecnica_antes,
 *                             deuda_tecnica_despues, hallazgos[].severity
 *
 * Bloque 5 (Tendencias):     fecha_asignacion, fecha_cierre, hallazgos[], revisor_id,
 *                             quality_gate_resultado
 */

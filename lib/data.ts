// Mock data model — mirrors what the AI MCP should capture per review event
// Replace these with real API calls to your MCP data source.

export type ReviewType = "codigo" | "documentacion" | "tests" | "seguridad" | "compliance" | "sonarqube";
export type Severity = "blocker" | "critical" | "major" | "minor" | "info";
export type QualityGate = "passed" | "failed" | "warning";

export interface Finding {
  id: string;
  severity: Severity;
  categoria: string;
  aceptado_por_dev: boolean;
  es_falso_positivo: boolean;
}

export interface ReviewEvent {
  id: string;
  revisor_id: string;
  proyecto: string;
  artefacto_tipo: ReviewType;
  fecha_asignacion: string; // ISO date
  fecha_inicio: string;
  fecha_cierre: string | null;
  hallazgos: Finding[];
  ciclos_revision: number;
  quality_gate_resultado: QualityGate | null;
  deuda_tecnica_antes: number; // minutes
  deuda_tecnica_despues: number; // minutes
  compliance_ok: boolean | null;
}

export interface Reviewer {
  id: string;
  nombre: string;
  avatar: string; // initials
}

// ── Team ────────────────────────────────────────────────────────────────────
export const REVIEWERS: Reviewer[] = [
  { id: "r1", nombre: "María González",  avatar: "MG" },
  { id: "r2", nombre: "Carlos Pérez",    avatar: "CP" },
  { id: "r3", nombre: "Laura Martínez",  avatar: "LM" },
  { id: "r4", nombre: "Diego Ramírez",   avatar: "DR" },
  { id: "r5", nombre: "Ana Fernández",   avatar: "AF" },
];

// ── Helper ───────────────────────────────────────────────────────────────────
function iso(daysAgo: number, hour = 9, minute = 0): string {
  const d = new Date("2026-08-31");
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function finding(
  severity: Severity,
  categoria: string,
  aceptado = true,
  falso = false
): Finding {
  return {
    id: Math.random().toString(36).slice(2),
    severity,
    categoria,
    aceptado_por_dev: aceptado,
    es_falso_positivo: falso,
  };
}

// ── Review events (last 30 days) ─────────────────────────────────────────────
export const REVIEWS: ReviewEvent[] = [
  // ── María González ────────────────────────────────────────────────────────
  { id:"e01", revisor_id:"r1", proyecto:"Portal CRM", artefacto_tipo:"codigo",       fecha_asignacion:iso(28), fecha_inicio:iso(28,9,30), fecha_cierre:iso(27), hallazgos:[finding("critical","null-pointer"),finding("major","naming-convention"),finding("minor","unused-import",true)], ciclos_revision:2, quality_gate_resultado:"passed", deuda_tecnica_antes:480, deuda_tecnica_despues:120, compliance_ok:true },
  { id:"e02", revisor_id:"r1", proyecto:"API Pagos", artefacto_tipo:"seguridad",     fecha_asignacion:iso(25), fecha_inicio:iso(25,10),   fecha_cierre:iso(24), hallazgos:[finding("blocker","sql-injection"),finding("critical","hard-coded-secret"),finding("major","missing-auth")], ciclos_revision:3, quality_gate_resultado:"failed", deuda_tecnica_antes:600, deuda_tecnica_despues:600, compliance_ok:false },
  { id:"e03", revisor_id:"r1", proyecto:"Portal CRM", artefacto_tipo:"documentacion",fecha_asignacion:iso(22), fecha_inicio:iso(22,9),    fecha_cierre:iso(21), hallazgos:[finding("minor","missing-section"),finding("info","style-guide",true)], ciclos_revision:1, quality_gate_resultado:null, deuda_tecnica_antes:0, deuda_tecnica_despues:0, compliance_ok:true },
  { id:"e04", revisor_id:"r1", proyecto:"Módulo RRHH", artefacto_tipo:"compliance",  fecha_asignacion:iso(18), fecha_inicio:iso(18,9,15), fecha_cierre:iso(17), hallazgos:[finding("major","gdpr-violation"),finding("minor","log-personal-data")], ciclos_revision:2, quality_gate_resultado:"warning", deuda_tecnica_antes:240, deuda_tecnica_despues:60, compliance_ok:false },
  { id:"e05", revisor_id:"r1", proyecto:"API Pagos", artefacto_tipo:"sonarqube",     fecha_asignacion:iso(14), fecha_inicio:iso(14,10),   fecha_cierre:iso(13), hallazgos:[finding("critical","coverage-below-80"),finding("major","code-smell",true,true)], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:320, deuda_tecnica_despues:80, compliance_ok:null },
  { id:"e06", revisor_id:"r1", proyecto:"App Móvil",  artefacto_tipo:"tests",       fecha_asignacion:iso(10), fecha_inicio:iso(10,9),    fecha_cierre:iso(9),  hallazgos:[finding("major","missing-edge-case"),finding("minor","test-naming")], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:180, deuda_tecnica_despues:45, compliance_ok:null },
  { id:"e07", revisor_id:"r1", proyecto:"Portal CRM", artefacto_tipo:"codigo",       fecha_asignacion:iso(6),  fecha_inicio:iso(6,9,30),  fecha_cierre:iso(5),  hallazgos:[finding("major","complexity"),finding("minor","dead-code")], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:200, deuda_tecnica_despues:50, compliance_ok:null },
  { id:"e08", revisor_id:"r1", proyecto:"API Pagos", artefacto_tipo:"seguridad",     fecha_asignacion:iso(2),  fecha_inicio:iso(2,10),    fecha_cierre:null,    hallazgos:[], ciclos_revision:0, quality_gate_resultado:null, deuda_tecnica_antes:400, deuda_tecnica_despues:400, compliance_ok:null },

  // ── Carlos Pérez ──────────────────────────────────────────────────────────
  { id:"e09", revisor_id:"r2", proyecto:"Módulo RRHH", artefacto_tipo:"codigo",      fecha_asignacion:iso(27), fecha_inicio:iso(27,9),    fecha_cierre:iso(26), hallazgos:[finding("critical","race-condition"),finding("major","exception-handling"),finding("minor","naming-convention",false)], ciclos_revision:2, quality_gate_resultado:"warning", deuda_tecnica_antes:560, deuda_tecnica_despues:180, compliance_ok:null },
  { id:"e10", revisor_id:"r2", proyecto:"App Móvil",   artefacto_tipo:"sonarqube",   fecha_asignacion:iso(23), fecha_inicio:iso(23,9),    fecha_cierre:iso(22), hallazgos:[finding("major","coverage-below-80"),finding("info","code-smell",true,true)], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:220, deuda_tecnica_despues:55, compliance_ok:null },
  { id:"e11", revisor_id:"r2", proyecto:"Portal CRM", artefacto_tipo:"compliance",   fecha_asignacion:iso(19), fecha_inicio:iso(19,10),   fecha_cierre:iso(18), hallazgos:[finding("major","missing-consent"),finding("minor","privacy-notice")], ciclos_revision:2, quality_gate_resultado:null, deuda_tecnica_antes:0, deuda_tecnica_despues:0, compliance_ok:false },
  { id:"e12", revisor_id:"r2", proyecto:"API Pagos", artefacto_tipo:"tests",         fecha_asignacion:iso(15), fecha_inicio:iso(15,11),   fecha_cierre:iso(14), hallazgos:[finding("major","missing-integration-test"),finding("minor","flaky-test")], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:300, deuda_tecnica_despues:75, compliance_ok:null },
  { id:"e13", revisor_id:"r2", proyecto:"Módulo RRHH", artefacto_tipo:"documentacion",fecha_asignacion:iso(11), fecha_inicio:iso(11,9),   fecha_cierre:iso(10), hallazgos:[finding("minor","outdated-diagram"),finding("info","typo")], ciclos_revision:1, quality_gate_resultado:null, deuda_tecnica_antes:0, deuda_tecnica_despues:0, compliance_ok:true },
  { id:"e14", revisor_id:"r2", proyecto:"App Móvil",   artefacto_tipo:"seguridad",   fecha_asignacion:iso(7),  fecha_inicio:iso(7,9),     fecha_cierre:iso(6),  hallazgos:[finding("critical","insecure-storage"),finding("major","missing-ssl-pin")], ciclos_revision:2, quality_gate_resultado:"failed", deuda_tecnica_antes:500, deuda_tecnica_despues:500, compliance_ok:false },
  { id:"e15", revisor_id:"r2", proyecto:"Portal CRM", artefacto_tipo:"codigo",       fecha_asignacion:iso(3),  fecha_inicio:iso(3,10),    fecha_cierre:iso(2),  hallazgos:[finding("major","god-class"),finding("minor","magic-number")], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:380, deuda_tecnica_despues:95, compliance_ok:null },

  // ── Laura Martínez ────────────────────────────────────────────────────────
  { id:"e16", revisor_id:"r3", proyecto:"API Pagos", artefacto_tipo:"codigo",        fecha_asignacion:iso(26), fecha_inicio:iso(26,9),    fecha_cierre:iso(25), hallazgos:[finding("blocker","xss-vulnerability"),finding("critical","broken-auth"),finding("major","missing-rate-limit"),finding("minor","log-sensitive")], ciclos_revision:3, quality_gate_resultado:"failed", deuda_tecnica_antes:700, deuda_tecnica_despues:700, compliance_ok:false },
  { id:"e17", revisor_id:"r3", proyecto:"Módulo RRHH", artefacto_tipo:"tests",       fecha_asignacion:iso(21), fecha_inicio:iso(21,9),    fecha_cierre:iso(20), hallazgos:[finding("major","no-boundary-tests"),finding("minor","test-duplication")], ciclos_revision:1, quality_gate_resultado:"warning", deuda_tecnica_antes:260, deuda_tecnica_despues:90, compliance_ok:null },
  { id:"e18", revisor_id:"r3", proyecto:"App Móvil",   artefacto_tipo:"compliance",  fecha_asignacion:iso(16), fecha_inicio:iso(16,10),   fecha_cierre:iso(15), hallazgos:[finding("major","missing-accessibility"),finding("minor","color-contrast")], ciclos_revision:1, quality_gate_resultado:null, deuda_tecnica_antes:0, deuda_tecnica_despues:0, compliance_ok:true },
  { id:"e19", revisor_id:"r3", proyecto:"Portal CRM", artefacto_tipo:"sonarqube",    fecha_asignacion:iso(12), fecha_inicio:iso(12,9),    fecha_cierre:iso(11), hallazgos:[finding("critical","coverage-below-80"),finding("major","complexity")], ciclos_revision:2, quality_gate_resultado:"passed", deuda_tecnica_antes:410, deuda_tecnica_despues:102, compliance_ok:null },
  { id:"e20", revisor_id:"r3", proyecto:"API Pagos", artefacto_tipo:"documentacion", fecha_asignacion:iso(8),  fecha_inicio:iso(8,9),     fecha_cierre:iso(7),  hallazgos:[finding("minor","missing-endpoint-desc"),finding("info","example-missing")], ciclos_revision:1, quality_gate_resultado:null, deuda_tecnica_antes:0, deuda_tecnica_despues:0, compliance_ok:true },
  { id:"e21", revisor_id:"r3", proyecto:"Módulo RRHH", artefacto_tipo:"codigo",      fecha_asignacion:iso(4),  fecha_inicio:iso(4,9),     fecha_cierre:iso(3),  hallazgos:[finding("major","open-closed"),finding("minor","unused-variable")], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:290, deuda_tecnica_despues:72, compliance_ok:null },
  { id:"e22", revisor_id:"r3", proyecto:"Portal CRM", artefacto_tipo:"seguridad",    fecha_asignacion:iso(1),  fecha_inicio:iso(1,9),     fecha_cierre:null,    hallazgos:[], ciclos_revision:0, quality_gate_resultado:null, deuda_tecnica_antes:450, deuda_tecnica_despues:450, compliance_ok:null },

  // ── Diego Ramírez ─────────────────────────────────────────────────────────
  { id:"e23", revisor_id:"r4", proyecto:"App Móvil",   artefacto_tipo:"codigo",      fecha_asignacion:iso(24), fecha_inicio:iso(24,9),    fecha_cierre:iso(23), hallazgos:[finding("major","memory-leak"),finding("minor","string-concat")], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:350, deuda_tecnica_despues:87, compliance_ok:null },
  { id:"e24", revisor_id:"r4", proyecto:"Portal CRM", artefacto_tipo:"sonarqube",    fecha_asignacion:iso(20), fecha_inicio:iso(20,9),    fecha_cierre:iso(19), hallazgos:[finding("critical","coverage-below-80"),finding("major","code-smell")], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:280, deuda_tecnica_despues:70, compliance_ok:null },
  { id:"e25", revisor_id:"r4", proyecto:"API Pagos", artefacto_tipo:"compliance",    fecha_asignacion:iso(16), fecha_inicio:iso(16,9),    fecha_cierre:iso(15), hallazgos:[finding("major","pci-dss-violation"),finding("critical","data-encryption")], ciclos_revision:2, quality_gate_resultado:null, deuda_tecnica_antes:0, deuda_tecnica_despues:0, compliance_ok:false },
  { id:"e26", revisor_id:"r4", proyecto:"Módulo RRHH", artefacto_tipo:"tests",       fecha_asignacion:iso(13), fecha_inicio:iso(13,10),   fecha_cierre:iso(12), hallazgos:[finding("major","missing-mock"),finding("minor","assertion-style")], ciclos_revision:1, quality_gate_resultado:"warning", deuda_tecnica_antes:190, deuda_tecnica_despues:48, compliance_ok:null },
  { id:"e27", revisor_id:"r4", proyecto:"App Móvil",   artefacto_tipo:"documentacion",fecha_asignacion:iso(9), fecha_inicio:iso(9,9),     fecha_cierre:iso(8),  hallazgos:[finding("minor","stale-readme")], ciclos_revision:1, quality_gate_resultado:null, deuda_tecnica_antes:0, deuda_tecnica_despues:0, compliance_ok:true },
  { id:"e28", revisor_id:"r4", proyecto:"Portal CRM", artefacto_tipo:"seguridad",    fecha_asignacion:iso(5),  fecha_inicio:iso(5,10),    fecha_cierre:iso(4),  hallazgos:[finding("major","open-redirect"),finding("minor","verbose-error")], ciclos_revision:1, quality_gate_resultado:"warning", deuda_tecnica_antes:320, deuda_tecnica_despues:80, compliance_ok:null },
  { id:"e29", revisor_id:"r4", proyecto:"API Pagos", artefacto_tipo:"codigo",        fecha_asignacion:iso(1),  fecha_inicio:iso(1,9,30),  fecha_cierre:null,    hallazgos:[], ciclos_revision:0, quality_gate_resultado:null, deuda_tecnica_antes:500, deuda_tecnica_despues:500, compliance_ok:null },

  // ── Ana Fernández ─────────────────────────────────────────────────────────
  { id:"e30", revisor_id:"r5", proyecto:"Módulo RRHH", artefacto_tipo:"sonarqube",   fecha_asignacion:iso(29), fecha_inicio:iso(29,9),    fecha_cierre:iso(28), hallazgos:[finding("major","coverage-below-80"),finding("minor","code-smell",true,true)], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:420, deuda_tecnica_despues:105, compliance_ok:null },
  { id:"e31", revisor_id:"r5", proyecto:"API Pagos", artefacto_tipo:"codigo",        fecha_asignacion:iso(24), fecha_inicio:iso(24,9),    fecha_cierre:iso(23), hallazgos:[finding("critical","input-validation"),finding("major","error-handling"),finding("minor","comments")], ciclos_revision:2, quality_gate_resultado:"passed", deuda_tecnica_antes:460, deuda_tecnica_despues:115, compliance_ok:null },
  { id:"e32", revisor_id:"r5", proyecto:"Portal CRM", artefacto_tipo:"compliance",   fecha_asignacion:iso(20), fecha_inicio:iso(20,9),    fecha_cierre:iso(19), hallazgos:[finding("minor","cookie-policy")], ciclos_revision:1, quality_gate_resultado:null, deuda_tecnica_antes:0, deuda_tecnica_despues:0, compliance_ok:true },
  { id:"e33", revisor_id:"r5", proyecto:"App Móvil",   artefacto_tipo:"tests",       fecha_asignacion:iso(17), fecha_inicio:iso(17,9),    fecha_cierre:iso(16), hallazgos:[finding("major","no-e2e-tests"),finding("minor","naming")], ciclos_revision:2, quality_gate_resultado:"warning", deuda_tecnica_antes:240, deuda_tecnica_despues:60, compliance_ok:null },
  { id:"e34", revisor_id:"r5", proyecto:"Módulo RRHH", artefacto_tipo:"seguridad",   fecha_asignacion:iso(13), fecha_inicio:iso(13,9),    fecha_cierre:iso(12), hallazgos:[finding("critical","ssrf-risk"),finding("major","missing-cors")], ciclos_revision:2, quality_gate_resultado:"failed", deuda_tecnica_antes:580, deuda_tecnica_despues:580, compliance_ok:false },
  { id:"e35", revisor_id:"r5", proyecto:"Portal CRM", artefacto_tipo:"documentacion",fecha_asignacion:iso(8),  fecha_inicio:iso(8,9),     fecha_cierre:iso(7),  hallazgos:[finding("minor","missing-glossary"),finding("info","screenshot-outdated")], ciclos_revision:1, quality_gate_resultado:null, deuda_tecnica_antes:0, deuda_tecnica_despues:0, compliance_ok:true },
  { id:"e36", revisor_id:"r5", proyecto:"API Pagos", artefacto_tipo:"codigo",        fecha_asignacion:iso(4),  fecha_inicio:iso(4,10),    fecha_cierre:iso(3),  hallazgos:[finding("major","circular-dependency"),finding("minor","unused-param")], ciclos_revision:1, quality_gate_resultado:"passed", deuda_tecnica_antes:310, deuda_tecnica_despues:77, compliance_ok:null },
  { id:"e37", revisor_id:"r5", proyecto:"Módulo RRHH", artefacto_tipo:"sonarqube",   fecha_asignacion:iso(1),  fecha_inicio:iso(1,9),     fecha_cierre:null,    hallazgos:[], ciclos_revision:0, quality_gate_resultado:null, deuda_tecnica_antes:380, deuda_tecnica_despues:380, compliance_ok:null },
];

// ── Derived / computed helpers ───────────────────────────────────────────────

export function diffMinutes(start: string, end: string | null): number {
  if (!end) return 0;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

export function reviewerStats(reviewerId: string) {
  const all    = REVIEWS.filter(r => r.revisor_id === reviewerId);
  const closed = all.filter(r => r.fecha_cierre !== null);
  const open   = all.filter(r => r.fecha_cierre === null);
  const findings = all.flatMap(r => r.hallazgos);

  const byType = Object.fromEntries(
    (["codigo","documentacion","tests","seguridad","compliance","sonarqube"] as ReviewType[]).map(t => [
      t,
      all.filter(r => r.artefacto_tipo === t).length,
    ])
  );

  const deudaAhorrada = closed.reduce(
    (acc, r) => acc + Math.max(0, r.deuda_tecnica_antes - r.deuda_tecnica_despues),
    0
  );

  const avgCycles = closed.length
    ? closed.reduce((a, r) => a + r.ciclos_revision, 0) / closed.length
    : 0;

  const avgTimeMin = closed.length
    ? closed.reduce((a, r) => a + diffMinutes(r.fecha_inicio, r.fecha_cierre), 0) / closed.length
    : 0;

  const aceptados = findings.filter(f => f.aceptado_por_dev && !f.es_falso_positivo).length;
  const falsos    = findings.filter(f => f.es_falso_positivo).length;
  const reincidencias = all.filter(r => r.ciclos_revision > 1).length;

  return {
    total: all.length,
    cerradas: closed.length,
    abiertas: open.length,
    hallazgos: findings.length,
    aceptados,
    falsos,
    reincidencias,
    byType,
    deudaAhorrada,
    avgCycles: +avgCycles.toFixed(1),
    avgTimeMin: Math.round(avgTimeMin),
  };
}

export function teamSummary() {
  const all = REVIEWS;
  const closed = all.filter(r => r.fecha_cierre !== null);
  const findings = all.flatMap(r => r.hallazgos);

  const qgPassed  = closed.filter(r => r.quality_gate_resultado === "passed").length;
  const qgTotal   = closed.filter(r => r.quality_gate_resultado !== null).length;
  const compliant = closed.filter(r => r.compliance_ok === true).length;
  const compTotal = closed.filter(r => r.compliance_ok !== null).length;

  const deudaTotal = closed.reduce(
    (acc, r) => acc + Math.max(0, r.deuda_tecnica_antes - r.deuda_tecnica_despues),
    0
  );

  const defectsByWeek: { week: string; abiertos: number; cerrados: number }[] = [];
  for (let w = 4; w >= 0; w--) {
    const label = `Sem -${w + 1}`;
    const weekStart = new Date("2026-08-31");
    weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
    const weekEnd = new Date("2026-08-31");
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const inWeek = all.filter(r => {
      const d = new Date(r.fecha_asignacion);
      return d >= weekStart && d < weekEnd;
    });
    defectsByWeek.push({
      week: label,
      abiertos: inWeek.flatMap(r => r.hallazgos).length,
      cerrados: inWeek.filter(r => r.fecha_cierre).flatMap(r => r.hallazgos).length,
    });
  }

  const avgTimeByType = (["codigo","documentacion","tests","seguridad","compliance","sonarqube"] as ReviewType[]).map(t => {
    const done = closed.filter(r => r.artefacto_tipo === t);
    const avg = done.length
      ? done.reduce((a, r) => a + diffMinutes(r.fecha_inicio, r.fecha_cierre!), 0) / done.length
      : 0;
    return { tipo: t, avgMin: Math.round(avg) };
  });

  const severityDist = {
    blocker:  findings.filter(f => f.severity === "blocker").length,
    critical: findings.filter(f => f.severity === "critical").length,
    major:    findings.filter(f => f.severity === "major").length,
    minor:    findings.filter(f => f.severity === "minor").length,
    info:     findings.filter(f => f.severity === "info").length,
  };

  const topCategories = (() => {
    const counts: Record<string, number> = {};
    findings.forEach(f => { counts[f.categoria] = (counts[f.categoria] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat, count]) => ({ cat, count }));
  })();

  // Weekly velocity (reviews closed per week)
  const velocityByWeek = [4,3,2,1,0].map(w => {
    const weekStart = new Date("2026-08-31");
    weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
    const weekEnd = new Date("2026-08-31");
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const count = closed.filter(r => {
      const d = new Date(r.fecha_cierre!);
      return d >= weekStart && d < weekEnd;
    }).length;
    return { week: `Sem -${w + 1}`, count };
  });

  // Projects at risk (no review in last 10 days OR last QG failed)
  const projects = [...new Set(all.map(r => r.proyecto))];
  const projectsAtRisk = projects.filter(p => {
    const pReviews = all.filter(r => r.proyecto === p);
    const lastClosed = pReviews.filter(r => r.fecha_cierre).sort((a,b) => new Date(b.fecha_cierre!).getTime() - new Date(a.fecha_cierre!).getTime())[0];
    if (!lastClosed) return true;
    const daysAgo = (new Date("2026-08-31").getTime() - new Date(lastClosed.fecha_cierre!).getTime()) / 86400000;
    const lastQG = lastClosed.quality_gate_resultado;
    return daysAgo > 8 || lastQG === "failed";
  });

  return {
    total: all.length,
    cerradas: closed.length,
    abiertas: all.filter(r => !r.fecha_cierre).length,
    qgPassRate: qgTotal ? Math.round((qgPassed / qgTotal) * 100) : 0,
    complianceRate: compTotal ? Math.round((compliant / compTotal) * 100) : 0,
    deudaAhorrada: deudaTotal,
    defectsByWeek,
    avgTimeByType,
    severityDist,
    topCategories,
    velocityByWeek,
    projectsAtRisk,
    totalFindings: findings.length,
    falsePositives: findings.filter(f => f.es_falso_positivo).length,
  };
}

// Activity heatmap: reviewer × day (last 30 days)
export function activityHeatmap() {
  return REVIEWERS.map(rev => {
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date("2026-08-31");
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const count = REVIEWS.filter(r =>
        r.revisor_id === rev.id &&
        r.fecha_inicio.slice(0, 10) === dStr
      ).length;
      days.push({ date: dStr, count });
    }
    return { reviewer: rev, days };
  });
}

// Trend: avg QA score per week (proxy: % findings resolved)
export function scoreTrend() {
  return [4,3,2,1,0].map(w => {
    const weekStart = new Date("2026-08-31");
    weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
    const weekEnd = new Date("2026-08-31");
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const wReviews = REVIEWS.filter(r => {
      const d = new Date(r.fecha_asignacion);
      return d >= weekStart && d < weekEnd && r.fecha_cierre;
    });
    const findings = wReviews.flatMap(r => r.hallazgos);
    const accepted = findings.filter(f => f.aceptado_por_dev && !f.es_falso_positivo).length;
    const score = findings.length ? Math.round((accepted / findings.length) * 100) : 0;
    return { week: `Sem -${w + 1}`, score };
  });
}

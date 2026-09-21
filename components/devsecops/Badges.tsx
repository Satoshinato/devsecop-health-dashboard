import type { EstadoGate, Rating } from "@/lib/devsecops-data";

const RATING_CLASSES: Record<Rating, string> = {
  A: "bg-emerald-100 text-emerald-700 border-emerald-200",
  B: "bg-lime-100 text-lime-700 border-lime-200",
  C: "bg-amber-100 text-amber-700 border-amber-200",
  D: "bg-orange-100 text-orange-700 border-orange-200",
  E: "bg-rose-100 text-rose-700 border-rose-200",
};

export function RatingBadge({ rating, title }: { rating: Rating; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex w-5 h-5 items-center justify-center rounded border text-[10px] font-bold ${RATING_CLASSES[rating]}`}
    >
      {rating}
    </span>
  );
}

export function GateBadge({ estado }: { estado: EstadoGate }) {
  const mapa: Record<EstadoGate, { texto: string; clase: string }> = {
    OK: { texto: "Passed", clase: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    WARN: { texto: "Warning", clase: "bg-amber-50 text-amber-700 border-amber-200" },
    ERROR: { texto: "Failed", clase: "bg-rose-50 text-rose-700 border-rose-200" },
  };
  const { texto, clase } = mapa[estado];
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${clase}`}>
      {texto}
    </span>
  );
}

const SEVERIDAD_CLASSES: Record<string, string> = {
  "CRÍTICA": "bg-rose-600 text-white",
  ALTA: "bg-orange-500 text-white",
  MEDIA: "bg-amber-400 text-amber-950",
  BAJA: "bg-slate-300 text-slate-700",
};

export function SeverityPill({ severidad }: { severidad: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
        SEVERIDAD_CLASSES[severidad] ?? "bg-slate-200 text-slate-700"
      }`}
    >
      {severidad}
    </span>
  );
}

export function SinDatosBadge({ texto = "Sin adopción" }: { texto?: string }) {
  return (
    <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
      {texto}
    </span>
  );
}

"use client";

import type { DashboardLoadState } from "@/lib/use-dashboard-data";

export default function DataStatus({ state }: { state: DashboardLoadState }) {
  if (state.status === "loading") {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        Cargando métricas…
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
        Datos no disponibles. {state.message}
      </p>
    );
  }
  return null;
}

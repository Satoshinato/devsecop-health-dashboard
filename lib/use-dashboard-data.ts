"use client";

import { useEffect, useState } from "react";
import type { ScanSnapshot } from "@/lib/snapshot";
import { rollHistory } from "./history";

export type DashboardLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; scans: ScanSnapshot[] };

export function useDashboardData(): DashboardLoadState {
  const [state, setState] = useState<DashboardLoadState>({ status: "loading" });

  useEffect(() => {
    Promise.all([
      fetch("/data/dashboard.json", { cache: "no-store" }),
      fetch("/data/history.json", { cache: "no-store" }),
    ])
      .then(async ([dashboardResponse, historyResponse]) => {
        if (!dashboardResponse.ok) {
          throw new Error("No está dashboard.json (corré npm run scan:fixture).");
        }
        const dashboard = (await dashboardResponse.json()) as ScanSnapshot;
        const history = historyResponse.ok
          ? ((await historyResponse.json()) as ScanSnapshot[])
          : [];
        const list = Array.isArray(history) ? history : [];
        setState({ status: "ok", scans: rollHistory(list, dashboard) });
      })
      .catch((reason: unknown) => {
        setState({
          status: "error",
          message: reason instanceof Error ? reason.message : "Datos no disponibles",
        });
      });
  }, []);

  return state;
}

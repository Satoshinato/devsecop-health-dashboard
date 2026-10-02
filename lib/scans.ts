import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ScanSnapshot } from "@/lib/snapshot";
import { rollHistory } from "./history";

const PUBLIC_DASHBOARD = join(process.cwd(), "public/data/dashboard.json");
const PUBLIC_HISTORY = join(process.cwd(), "public/data/history.json");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/** Scans para tests y build: public/data (contrato S3). */
export function cargarScans(limite = 14): ScanSnapshot[] {
  if (!existsSync(PUBLIC_DASHBOARD)) {
    throw new Error("No hay public/data/dashboard.json. Corré `npm run scan:fixture`.");
  }
  const dashboard = readJson<ScanSnapshot>(PUBLIC_DASHBOARD);
  const history = existsSync(PUBLIC_HISTORY) ? readJson<ScanSnapshot[]>(PUBLIC_HISTORY) : [];
  const list = Array.isArray(history) ? history : [];
  return rollHistory(list, dashboard, limite);
}

export { scanActual } from "./history";

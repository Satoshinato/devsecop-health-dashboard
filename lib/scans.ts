import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ScanSnapshot } from "@/lib/snapshot";

const SCANS_DIR = join(process.cwd(), "data/scans");
const SCAN_FILE = /^scan-(\d{4}-\d{2}-\d{2})\.json$/;

export function cargarScans(limite = 14): ScanSnapshot[] {
  const archivos = readdirSync(SCANS_DIR)
    .filter(nombre => SCAN_FILE.test(nombre))
    .sort();
  const recientes = archivos.slice(-limite);
  return recientes.map(nombre => {
    const crudo = readFileSync(join(SCANS_DIR, nombre), "utf8");
    return JSON.parse(crudo) as ScanSnapshot;
  });
}

export function scanActual(scans: ScanSnapshot[]): ScanSnapshot {
  const ultimo = scans[scans.length - 1];
  if (!ultimo) {
    throw new Error("No hay snapshots en data/scans. Corré `npm run scan:fixture`.");
  }
  return ultimo;
}

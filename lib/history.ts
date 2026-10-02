import type { ScanSnapshot } from "./snapshot";

const HISTORY_LIMIT = 14;

export function scanActual(scans: ScanSnapshot[]): ScanSnapshot {
  const ultimo = scans[scans.length - 1];
  if (!ultimo) {
    throw new Error("No hay snapshots. Corré `npm run scan:fixture`.");
  }
  return ultimo;
}

export function rollHistory(
  previous: ScanSnapshot[],
  current: ScanSnapshot,
  limite = HISTORY_LIMIT,
): ScanSnapshot[] {
  const withoutToday = previous.filter(s => s.fecha !== current.fecha);
  return [...withoutToday, current].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-limite);
}

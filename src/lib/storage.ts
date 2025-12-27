import type { AppData, Spool } from "../types/filament";

const KEY = "filament_tracker_v1";

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { version: 1, spools: [] };

    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.spools)) {
      return { version: 1, spools: [] };
    }

    // 🔹 Migrate old statuses
    parsed.spools = parsed.spools.map((s: any) => {
      let status = s.status as string;

      if (status === "ACTIVE") status = "IN_STORAGE";
      if (status === "ARCHIVED") status = "EMPTY";

      return { ...s, status };
    });

    return parsed;
  } catch {
    return { version: 1, spools: [] };
  }
}


export function saveData(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function upsertSpool(spools: Spool[], spool: Spool): Spool[] {
  const idx = spools.findIndex((s) => s.id === spool.id);
  if (idx === -1) return [spool, ...spools];
  const copy = [...spools];
  copy[idx] = spool;
  return copy;
}

export function removeSpool(spools: Spool[], id: string): Spool[] {
  return spools.filter((s) => s.id !== id);
}

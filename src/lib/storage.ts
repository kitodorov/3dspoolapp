import type { AppData, Spool, Printer } from "../types/filament";

const KEY = "filament_tracker_v1";

const DEFAULT_DATA: AppData = {
  version: 1,
  spools: [],
  printers: [],
};


export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DATA;

    const parsed = JSON.parse(raw) as Partial<AppData> | null;
    if (!parsed || parsed.version !== 1) return DEFAULT_DATA;

    const spools = Array.isArray(parsed.spools) ? (parsed.spools as any[]) : [];
    const printers = Array.isArray(parsed.printers) ? (parsed.printers as any[]) : [];

    // 🔹 Migrate old statuses + ensure printers field exists
    const migratedSpools = spools.map((s: any) => {
      let status = s.status as string;

      if (status === "ACTIVE") status = "IN_STORAGE";
      if (status === "ARCHIVED") status = "EMPTY";

      // If you later add spool.printerId, you can also sanitize it here:
      // (we'll do this after printers are real objects)
      return { ...s, status };
    });

    const data: AppData = {
      version: 1,
      spools: migratedSpools as Spool[],
      printers: printers as Printer[],
    };

    return data;
  } catch {
    return DEFAULT_DATA;
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

export function upsertPrinter(printers: Printer[], p: Printer) {
  const idx = printers.findIndex((x) => x.id === p.id);
  if (idx === -1) return [p, ...printers];
  return printers.map((x) => (x.id === p.id ? p : x));
}

export function removePrinter(printers: Printer[], id: string) {
  return printers.filter((p) => p.id !== id);
}

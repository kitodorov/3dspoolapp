import type { Spool } from "../types/filament";

export type SpoolGroup = {
  key: string;
  brandLabel: string;
  material: string;
  color: string;
  diameterMm: number;
  spools: Spool[];
  count: number;
  totalRemainingG: number;
  avgRemainingPct: number;
};

function brandLabelOf(s: Spool) {
  const b = (s.brand || "").trim();
  return b.length ? b : "(no brand)";
}

export function groupSpools(spools: Spool[]): SpoolGroup[] {
  const map = new Map<string, SpoolGroup>();

  for (const s of spools) {
    const brandLabel = brandLabelOf(s);
    const key = [
      brandLabel,
      s.material,
      s.color.trim().toLowerCase(),
      s.diameterMm,
    ].join("||");

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        brandLabel,
        material: s.material,
        color: s.color,
        diameterMm: s.diameterMm,
        spools: [s],
        count: 1,
        totalRemainingG: s.remainingG,
        avgRemainingPct: s.remainingPct,
      });
    } else {
      existing.spools.push(s);
      existing.count += 1;
      existing.totalRemainingG += s.remainingG;
      existing.avgRemainingPct =
        existing.spools.reduce((acc, x) => acc + x.remainingPct, 0) / existing.spools.length;
    }
  }

  // Sort: ACTIVE groups first, then lowest avg pct
  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    spools: g.spools.slice().sort((a, b) => a.remainingPct - b.remainingPct),
  }));

  const groupRank = (g: SpoolGroup) => (g.spools.some((s) => s.status === "ACTIVE") ? 0 : 1);

  groups.sort((a, b) => {
    const ra = groupRank(a), rb = groupRank(b);
    if (ra !== rb) return ra - rb;
    return a.avgRemainingPct - b.avgRemainingPct;
  });

  return groups;
}

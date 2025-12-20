export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function round(n: number, decimals = 0): number {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export function nanoidLike(): string {
  // good enough for local IDs
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

/**
 * Keep grams and percent consistent.
 * remainingG is treated as the main value; remainingPct is derived from it.
 */
export function syncRemainingFromG(remainingG: number, capacityG: number) {
  const safeCap = Math.max(1, capacityG);
  const pct = clamp((remainingG / safeCap) * 100, 0, 100);
  return { remainingG: clamp(remainingG, 0, safeCap), remainingPct: round(pct, 1) };
}

/**
 * Convert percent to grams, then sync.
 */
export function syncRemainingFromPct(remainingPct: number, capacityG: number) {
  const safeCap = Math.max(1, capacityG);
  const pct = clamp(remainingPct, 0, 100);
  const g = (pct / 100) * safeCap;
  return syncRemainingFromG(g, safeCap);
}

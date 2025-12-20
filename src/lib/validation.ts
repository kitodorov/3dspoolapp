import { clamp } from "./utils";

export function sanitizeText(s: string): string {
  return (s ?? "").trim();
}

export function sanitizePositiveNumber(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

export function sanitizePercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return clamp(n, 0, 100);
}

export function sanitizeNonNegative(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

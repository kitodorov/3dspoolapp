import { useMemo } from "react";

function normalizeColorName(s: string) {
  return (s || "").trim().toLowerCase();
}

function isHexColor(s: string) {
  const v = (s || "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
}

function colorFromName(name: string): string | null {
  const n = normalizeColorName(name);

  // common filament names → decent approximations
  const map: Record<string, string> = {
    black: "#111111",
    white: "#f5f5f5",
    gray: "#8a8a8a",
    grey: "#8a8a8a",
    silver: "#b9c0c8",
    red: "#d11f1f",
    blue: "#1f5bd1",
    green: "#1f9b4a",
    yellow: "#f2d21b",
    orange: "#f08a24",
    purple: "#7a3bd1",
    violet: "#7a3bd1",
    pink: "#e84aa8",
    brown: "#7a4a2a",
    gold: "#d4af37",
    bronze: "#b08d57",
    transparent: "rgba(255,255,255,0.2)",
    clear: "rgba(255,255,255,0.2)",
  };

  if (map[n]) return map[n];

  // handle variants like "matte black", "galaxy black", "dark red"
  const tokens = n.split(/[\s\-_/]+/).filter(Boolean);
  for (const t of tokens) {
    if (map[t]) return map[t];
  }

  // If user typed a CSS color like "rebeccapurple"
  // We can't safely validate without DOM, but it's okay to try using it.
  // If it fails in CSS, we fallback below with pattern.
  if (n && n.length <= 20) return name;

  return null;
}

export function ColorSwatch({
  color,
  size = 14,
}: {
  color: string;
  size?: number;
}) {
  const swatch = useMemo(() => {
    const trimmed = (color || "").trim();
    if (isHexColor(trimmed)) return trimmed;
    return colorFromName(trimmed);
  }, [color]);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 6,
    border: "1px solid #e5e5e5",
    background: swatch ?? "repeating-linear-gradient(45deg, #eee, #eee 6px, #fff 6px, #fff 12px)",
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.02)",
    flex: "0 0 auto",
  };

  return <span title={color} style={style} />;
}

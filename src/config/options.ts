export type BrandOption = { label: string; value: string };

export type ColorOption = {
  label: string;   // "Black"
  value: string;   // stored in your spool.color, e.g. "Black"
  hex: string;     // used for swatch, e.g. "#111111"
};

export const BRANDS: BrandOption[] = [
  { label: "Bambu Lab", value: "Bambu Lab" },
  { label: "Elegoo", value: "Elegoo" },
  { label: "SUNLU", value: "SUNLU" },
  { label: "eSUN", value: "eSUN" },
  { label: "Prusament", value: "Prusament" },
  { label: "Polymaker", value: "Polymaker" },
  { label: "Anycubic", value: "Anycubic" },
  { label: "Kingroon", value: "Kingroon" },
  { label: "Creality", value: "Creality" },
  { label: "Geetech", value: "Geetech" },
];

export const COLORS: ColorOption[] = [
  { label: "Black", value: "Black", hex: "#111111" },
  { label: "White", value: "White", hex: "#f5f5f5" },
  { label: "Gray", value: "Gray", hex: "#8a8a8a" },
  { label: "Silver", value: "Silver", hex: "#b9c0c8" },
  { label: "Red", value: "Red", hex: "#d11f1f" },
  { label: "Blue", value: "Blue", hex: "#1f5bd1" },
  { label: "Green", value: "Green", hex: "#1f9b4a" },
  { label: "Yellow", value: "Yellow", hex: "#f2d21b" },
  { label: "Orange", value: "Orange", hex: "#f08a24" },
  { label: "Purple", value: "Purple", hex: "#7a3bd1" },
  { label: "Pink", value: "Pink", hex: "#e84aa8" },
  { label: "Brown", value: "Brown", hex: "#7a4a2a" },
  { label: "Gold", value: "Gold", hex: "#d4af37" },
  { label: "Magenta", value: "Magenta", hex: "#ff00ff" },
  { label: "Turquoise", value: "Turquoise", hex: "#40e0d0" },
  { label: "Apple Green", value: "Apple Green", hex: "#8db600" },
];

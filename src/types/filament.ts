export type Material =
  | "PLA"
  | "PLA Silk"
  | "PLA Wood"
  | "PLA Tough"
  | "PETG"
  | "ABS"
  | "TPU"
  | "ASA"
  | "NYLON"
  | "PC"
  | "OTHER";

export type SpoolStatus = "IN_USE" | "IN_STORAGE" | "EMPTY";

export type Spool = {
  id: string;

  name: string;      // e.g. "Elegoo PLA+"
  brand?: string;    // optional
  material: Material;
  color: string;     // free text for v1
  diameterMm: 1.75 | 2.85;

  // Capacity in grams (usually 1000g, sometimes 750g etc.)
  capacityG: number;

  // Remaining tracked BOTH ways:
  remainingG: number;     // source of truth for calculations
  remainingPct: number;   // stored for UI + quick edits (0-100)

  status: SpoolStatus;

  notes?: string;

  createdAt: string; // ISO
  updatedAt: string; // ISO

  printerId?: string; // only used when status === "IN_USE"
};

export type Printer = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};


export type AppData = {
  version: 1;
  spools: Spool[];
  printers: Printer[];
};


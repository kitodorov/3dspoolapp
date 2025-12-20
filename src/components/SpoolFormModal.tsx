import { useEffect, useMemo, useState } from "react";
import type { Material, Spool, SpoolStatus } from "../types/filament";
import { nanoidLike, syncRemainingFromG, syncRemainingFromPct } from "../lib/utils";
import { sanitizeNonNegative, sanitizePercent, sanitizePositiveNumber, sanitizeText } from "../lib/validation";

const MATERIALS: Material[] = ["PLA", "PETG", "ABS", "TPU", "ASA", "NYLON", "PC", "OTHER"];
const STATUSES: SpoolStatus[] = ["ACTIVE", "EMPTY", "ARCHIVED"];

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Spool | null;
  onClose: () => void;
  onSave: (spool: Spool) => void;
};

export function SpoolFormModal({ open, mode, initial, onClose, onSave }: Props) {
  const isEdit = mode === "edit";

  const seed = useMemo(() => {
    const now = new Date().toISOString();
    if (isEdit && initial) return initial;
    const capacityG = 1000;
    const remaining = syncRemainingFromG(1000, capacityG);
    return {
      id: nanoidLike(),
      name: "",
      brand: "",
      material: "PLA" as Material,
      color: "Black",
      diameterMm: 1.75 as 1.75,
      capacityG,
      ...remaining,
      status: "ACTIVE" as SpoolStatus,
      notes: "",
      createdAt: now,
      updatedAt: now,
    } satisfies Spool;
  }, [isEdit, initial]);

  const [name, setName] = useState(seed.name);
  const [brand, setBrand] = useState(seed.brand ?? "");
  const [material, setMaterial] = useState<Material>(seed.material);
  const [color, setColor] = useState(seed.color);
  const [diameterMm, setDiameterMm] = useState<1.75 | 2.85>(seed.diameterMm);
  const [capacityG, setCapacityG] = useState<number>(seed.capacityG);
  const [remainingG, setRemainingG] = useState<number>(seed.remainingG);
  const [remainingPct, setRemainingPct] = useState<number>(seed.remainingPct);
  const [status, setStatus] = useState<SpoolStatus>(seed.status);
  const [notes, setNotes] = useState(seed.notes ?? "");
  const [linkMode, setLinkMode] = useState<"grams" | "percent">("grams");

  useEffect(() => {
    if (!open) return;
    setName(seed.name);
    setBrand(seed.brand ?? "");
    setMaterial(seed.material);
    setColor(seed.color);
    setDiameterMm(seed.diameterMm);
    setCapacityG(seed.capacityG);
    setRemainingG(seed.remainingG);
    setRemainingPct(seed.remainingPct);
    setStatus(seed.status);
    setNotes(seed.notes ?? "");
    setLinkMode("grams");
  }, [open, seed]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const applySync = (mode: "grams" | "percent", nextCap = capacityG, g = remainingG, pct = remainingPct) => {
    const safeCap = sanitizePositiveNumber(nextCap, 1000);
    if (mode === "grams") {
      const safeG = sanitizeNonNegative(g);
      const synced = syncRemainingFromG(safeG, safeCap);
      setCapacityG(safeCap);
      setRemainingG(synced.remainingG);
      setRemainingPct(synced.remainingPct);
    } else {
      const safePct = sanitizePercent(pct);
      const synced = syncRemainingFromPct(safePct, safeCap);
      setCapacityG(safeCap);
      setRemainingG(synced.remainingG);
      setRemainingPct(synced.remainingPct);
    }
  };

  const canSave = sanitizeText(name).length > 0 && sanitizeText(color).length > 0;

  const handleSave = () => {
    const now = new Date().toISOString();
    const safeCap = sanitizePositiveNumber(capacityG, 1000);

    // keep both consistent based on selected linkMode
    const synced =
      linkMode === "grams"
        ? syncRemainingFromG(sanitizeNonNegative(remainingG), safeCap)
        : syncRemainingFromPct(sanitizePercent(remainingPct), safeCap);

    const spool: Spool = {
      ...seed,
      name: sanitizeText(name),
      brand: sanitizeText(brand) || undefined,
      material,
      color: sanitizeText(color),
      diameterMm,
      capacityG: safeCap,
      remainingG: synced.remainingG,
      remainingPct: synced.remainingPct,
      status,
      notes: sanitizeText(notes) || undefined,
      updatedAt: now,
      createdAt: seed.createdAt ?? now,
      id: seed.id,
    };

    onSave(spool);
    onClose();
  };

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {isEdit ? "Edit Spool" : "Add Spool"}
          </div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="stack">
          <div className="grid2">
            <div>
              <label className="subtle">Name *</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Elegoo PLA+" />
            </div>
            <div>
              <label className="subtle">Brand</label>
              <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="grid3">
            <div>
              <label className="subtle">Material</label>
              <select className="select" value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="subtle">Color *</label>
              <input className="input" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Red, Galaxy Black" />
            </div>

            <div>
              <label className="subtle">Diameter</label>
              <select
                className="select"
                value={diameterMm}
                onChange={(e) => setDiameterMm(Number(e.target.value) as 1.75 | 2.85)}
              >
                <option value={1.75}>1.75mm</option>
                <option value={2.85}>2.85mm</option>
              </select>
            </div>
          </div>

          <div className="grid3">
            <div>
              <label className="subtle">Capacity (g)</label>
              <input
                className="input"
                type="number"
                value={capacityG}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setCapacityG(next);
                }}
                onBlur={() => applySync(linkMode)}
                min={1}
              />
            </div>

            <div>
              <label className="subtle">Remaining (g)</label>
              <input
                className="input"
                type="number"
                value={remainingG}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setRemainingG(next);
                  if (linkMode === "grams") applySync("grams", capacityG, next, remainingPct);
                }}
                min={0}
              />
            </div>

            <div>
              <label className="subtle">Remaining (%)</label>
              <input
                className="input"
                type="number"
                value={remainingPct}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setRemainingPct(next);
                  if (linkMode === "percent") applySync("percent", capacityG, remainingG, next);
                }}
                min={0}
                max={100}
                step={0.1}
              />
            </div>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row">
              <span className="subtle">Sync input:</span>
              <button
                className={"btn" + (linkMode === "grams" ? " primary" : "")}
                type="button"
                onClick={() => {
                  setLinkMode("grams");
                  applySync("grams");
                }}
              >
                grams → %
              </button>
              <button
                className={"btn" + (linkMode === "percent" ? " primary" : "")}
                type="button"
                onClick={() => {
                  setLinkMode("percent");
                  applySync("percent");
                }}
              >
                % → grams
              </button>
            </div>

            <div style={{ minWidth: 220 }}>
              <label className="subtle">Status</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value as SpoolStatus)}>
                {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="subtle">Notes</label>
            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes: nozzle temp, where you bought it, etc." />
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={handleSave} disabled={!canSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

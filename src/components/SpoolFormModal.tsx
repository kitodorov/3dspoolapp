import { useEffect, useMemo, useState } from "react";
import type { Material, Spool, SpoolStatus } from "../types/filament";
import { nanoidLike, syncRemainingFromG, syncRemainingFromPct } from "../lib/utils";
import { sanitizeNonNegative, sanitizePercent, sanitizePositiveNumber, sanitizeText } from "../lib/validation";
import { BRANDS, COLORS } from "../config/options";
import { ColorSwatch } from "./ColorSwatch";


const MATERIALS: Material[] = ["PLA", "PLA Silk", "PLA Wood", "PLA Tough", "PETG", "ABS", "TPU", "ASA", "NYLON", "PC", "OTHER"];
const STATUSES: { value: SpoolStatus; label: string }[] = [
  { value: "IN_USE", label: "In use (printer / AMS)" },
  { value: "IN_STORAGE", label: "In storage" },
  { value: "EMPTY", label: "Empty (used up)" },
];

function autoName(brand: string, material: Material, color: string) {
  const b = (brand || "").trim();
  const c = (color || "").trim();

  // If no brand, omit it
  if (b) return `${b} ${material} - ${c}`;
  return `${material} - ${c}`;
}

function canonicalName(brand: string, material: Material, color: string) {
  const b = sanitizeText(brand);
  const c = sanitizeText(color);

  const brandLabel = BRANDS.find((x) => x.value === b)?.label ?? b;
  const colorLabel = COLORS.find((x) => x.value === c)?.label ?? c;

  if (brandLabel) return `${brandLabel} ${material} - ${colorLabel}`;
  return `${material} - ${colorLabel}`;
}


type SpoolPrefill = Partial<Pick<Spool, "brand" | "material" | "color" | "diameterMm" | "capacityG">>;


type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Spool | null;
  prefill?: SpoolPrefill | null;
  initialQty?: number | null;
  onClose: () => void;
  onSave: (spool: Spool, qty?: number) => void;
};

export function SpoolFormModal({ open, mode, initial, prefill, initialQty, onClose, onSave }: Props) {
  const isEdit = mode === "edit";

  const seed = useMemo(() => {
    const now = new Date().toISOString();
    if (isEdit && initial) return initial;
    const capacityG = 1000;
    const remaining = syncRemainingFromG(1000, capacityG);
    const base: Spool = {
      id: nanoidLike(),
      name: "",
      brand: "",
      material: "PLA" as Material,
      color: "Black",
      diameterMm: 1.75 as 1.75,
      capacityG,
      ...remaining,
      status: "IN_STORAGE" as SpoolStatus,
      notes: "",
      createdAt: now,
      updatedAt: now,
    };

    if (!isEdit && prefill) {
      if (typeof prefill.brand === "string") base.brand = prefill.brand;
      if (prefill.material) base.material = prefill.material;
      if (typeof prefill.color === "string") base.color = prefill.color;
      if (prefill.diameterMm) base.diameterMm = prefill.diameterMm;
      if (typeof prefill.capacityG === "number" && Number.isFinite(prefill.capacityG)) {
        base.capacityG = prefill.capacityG;
        const synced = syncRemainingFromG(base.remainingG, base.capacityG);
        base.remainingG = synced.remainingG;
        base.remainingPct = synced.remainingPct;
      }
      if (!base.name || base.name.trim().length === 0) {
        base.name = autoName(base.brand ?? "", base.material, base.color);
      }
    }

    return base satisfies Spool;

  }, [isEdit, initial, prefill]);

  const [name, setName] = useState(seed.name);
  // const [nameTouched, setNameTouched] = useState(false);
  const [brand, setBrand] = useState(seed.brand ?? "");
  const [material, setMaterial] = useState<Material>(seed.material);
  const [color, setColor] = useState(seed.color);
  const [brandMode, setBrandMode] = useState<"list" | "custom">("list");
  const [colorMode, setColorMode] = useState<"list" | "custom">("list");
  const [diameterMm, setDiameterMm] = useState<1.75 | 2.85>(seed.diameterMm);
  const [capacityG, setCapacityG] = useState<number>(seed.capacityG);
  const [remainingG, setRemainingG] = useState<number>(seed.remainingG);
  const [remainingPct, setRemainingPct] = useState<number>(seed.remainingPct);
  const [status, setStatus] = useState<SpoolStatus>(seed.status);
  const [notes, setNotes] = useState(seed.notes ?? "");
  const [linkMode, setLinkMode] = useState<"grams" | "percent">("grams");
  const [qty, setQty] = useState<number>(1);


  useEffect(() => {
    if (!open) return;
    setName(seed.name);
    if (!isEdit && prefill) {
      const next = canonicalName(seed.brand ?? "", seed.material, seed.color);
      setName(next);
    }
    // setNameTouched(false);
    setBrand(seed.brand ?? "");
    setMaterial(seed.material);
    setColor(seed.color);
    setDiameterMm(seed.diameterMm);
    setCapacityG(seed.capacityG);
    setRemainingG(seed.remainingG);
    setRemainingPct(seed.remainingPct);
    setStatus(seed.status);
    setQty(1);
    setNotes(seed.notes ?? "");
    setLinkMode("grams");
    setQty(!isEdit ? Math.max(1, Math.floor(initialQty || 1)) : 1);
    const brandInList = BRANDS.some((b) => b.value === (seed.brand ?? ""));
    setBrandMode(brandInList ? "list" : "custom");
    const colorInList = COLORS.some((c) => c.value === seed.color);
    setColorMode(colorInList ? "list" : "custom");
  }, [open, seed,initialQty, isEdit]);

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

    const n = isEdit ? 1 : Math.max(1, Math.floor(qty || 1));
    onSave(spool, n);
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
              <input
                className="input"
                value={name}
                onChange={(e) => {
                  // setNameTouched(true);
                  setName(e.target.value);
                }}
                placeholder="e.g. Elegoo PLA+"
              />
            </div>
            <div>
              <label className="subtle">Brand</label>

              {brandMode === "list" ? (
                <div className="row">
                  <select
                    className="select"
                    value={brand}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom__") {
                        setBrand("");
                        setBrandMode("custom");
                      } else {
                        setBrand(v);
                      }
                    }}
                  >
                    <option value="">(no brand)</option>
                    {BRANDS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                    <option value="__custom__">Custom…</option>
                  </select>
                </div>
              ) : (
                <div className="row">
                  <input
                    className="input"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Type brand…"
                  />
                  <button className="btn" type="button" onClick={() => setBrandMode("list")}>
                    List
                  </button>
                </div>
              )}
            </div>
          </div>
          {!isEdit ? (
            <div className="grid2">
              <div>
                <label className="subtle">Quantity</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={50}
                  value={qty}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setQty(Math.max(1, Math.min(50, Math.floor(Number.isFinite(v) ? v : 1))));
                  }}
                />
                <div className="subtle" style={{ marginTop: 4 }}>
                  Creates multiple spools with the same details.
                </div>
              </div>

              <div />
            </div>
          ) : null}
          <div className="grid3">
            <div>
              <label className="subtle">Material</label>
              <select className="select" value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="subtle">Color *</label>

              {colorMode === "list" ? (
                <div className="row">
                  {/* swatch shown reliably next to dropdown */}
                  <ColorSwatch
                    color={
                      COLORS.find((c) => c.value === color)?.hex ?? color
                    }
                    size={16}
                  />

                  <select
                    className="select"
                    value={color}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom__") {
                        setColor("");
                        setColorMode("custom");
                      } else {
                        setColor(v);
                      }
                    }}
                  >
                    {COLORS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                    <option value="__custom__">Custom…</option>
                  </select>
                </div>
              ) : (
                <div className="row">
                  <input
                    className="input"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Type color… (or #RRGGBB)"
                  />
                  <ColorSwatch color={color} size={16} />
                  <button className="btn" type="button" onClick={() => setColorMode("list")}>
                    List
                  </button>
                </div>
              )}
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
              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as SpoolStatus)}
              >
                {STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
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

import { useEffect, useMemo, useState } from "react";
import type { Spool , Printer } from "../types/filament";
import { syncRemainingFromG } from "../lib/utils";
import { formatDate } from "../lib/utils";
import { ColorSwatch } from "./ColorSwatch";

type Props = {
  open: boolean;
  spool: Spool | null;
  onClose: () => void;
  onEdit: (spool: Spool) => void;
  onDelete: (id: string) => void;
  onUpdate: (spool: Spool) => void;
  printers: Printer[];
};

export function SpoolDetailsModal({ open, spool, printers, onClose, onEdit, onDelete, onUpdate }: Props) {
  const [delta, setDelta] = useState<number>(50);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const safe = useMemo(() => spool, [spool]);
  if (!open || !safe) return null;

  const applyDelta = (sign: 1 | -1) => {
    const now = new Date().toISOString();
    const nextG = safe.remainingG + sign * (Number.isFinite(delta) ? delta : 0);
    const synced = syncRemainingFromG(nextG, safe.capacityG);

    const next: Spool = {
      ...safe,
      remainingG: synced.remainingG,
      remainingPct: synced.remainingPct,
      updatedAt: now,
      status:
        synced.remainingG === 0
          ? "EMPTY"
          : safe.status === "EMPTY"
            ? "IN_STORAGE"
            : safe.status,
    };
    onUpdate(next);
  };

  const handleMarkEmpty = () => {
    const now = new Date().toISOString();
    onUpdate({ ...safe, remainingG: 0, remainingPct: 0, status: "EMPTY", updatedAt: now });
  };
  const toggleUseStorage = () => {
  const now = new Date().toISOString();

  if (safe.status === "IN_STORAGE") {
    const first = printers[0]?.id;
    onUpdate({ ...safe, status: "IN_USE", printerId: safe.printerId ?? first, updatedAt: now });
    return;
  }

  if (safe.status === "IN_USE") {
    onUpdate({ ...safe, status: "IN_STORAGE", printerId: undefined, updatedAt: now });
    return;
  }
  };

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            {/* Title row with swatch */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ColorSwatch color={safe.color} size={16} />
              <div style={{ fontWeight: 900, fontSize: 16 }}>{safe.name}</div>
            </div>

            <div className="subtle">
              {safe.material} • {safe.color} • {safe.diameterMm}mm • cap {Math.round(safe.capacityG)}g
            </div>
          </div>

          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              {Math.round(safe.remainingG)}g
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {safe.remainingPct.toFixed(1)}%
            </div>
          </div>
          <div className="subtle" style={{ marginTop: 6 }}>
            Updated: {formatDate(safe.updatedAt)}
          </div>
        </div>

        <div className="grid3" style={{ marginBottom: 12 }}>
          <div>
            <label className="subtle">Quick amount (g)</label>
            <input className="input" type="number" min={0} value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <button className="btn" onClick={() => applyDelta(-1)}>- Used</button>
            <button className="btn primary" onClick={() => applyDelta(1)}>+ Refill</button>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <button className="btn" onClick={handleMarkEmpty}>Mark Empty</button>
          </div>
        </div>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <span className="badge">{safe.status}</span>
            {safe.brand ? <span className="badge">{safe.brand}</span> : null}
          </div>

          <div className="row" style={{ gap: 10 }}>
            {(safe.status === "IN_STORAGE" || safe.status === "IN_USE") ? (
              <button className="btn" onClick={toggleUseStorage}>
                {safe.status === "IN_STORAGE" ? "Move to IN_USE" : "Move to IN_STORAGE"}
              </button>
            ) : null}

            <button className="btn" onClick={() => onEdit(safe)}>Edit</button>
            <button className="btn danger" onClick={() => onDelete(safe.id)}>Delete</button>
          </div>
        </div>
        
        {safe.status === "IN_USE" ? (
        <div style={{ marginTop: 10 }}>
          <label className="subtle">Assigned printer</label>
          <select
            className="select"
            value={safe.printerId ?? ""}
            onChange={(e) => {
              const now = new Date().toISOString();
              const v = e.target.value || undefined;
              onUpdate({ ...safe, printerId: v, updatedAt: now });
            }}
          >
            <option value="">(no printer)</option>
            {printers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        ) : null}
        {safe.notes ? (
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Notes</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{safe.notes}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

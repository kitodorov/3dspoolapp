import { useEffect, useMemo, useState } from "react";
import type { Printer } from "../types/filament";
import { nanoidLike } from "../lib/utils";
import { sanitizeText } from "../lib/validation";

type Props = {
  open: boolean;
  printers: Printer[];
  onClose: () => void;
  onUpsert: (p: Printer) => void;
  onDelete: (id: string) => void;
};

export function PrintersModal({ open, printers, onClose, onUpsert, onDelete }: Props) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const sorted = useMemo(() => {
    return [...printers].sort((a, b) => a.name.localeCompare(b.name));
  }, [printers]);

  if (!open) return null;

  const canAdd = sanitizeText(name).length > 0;

  const add = () => {
    const now = new Date().toISOString();
    const p: Printer = {
      id: nanoidLike(),
      name: sanitizeText(name),
      createdAt: now,
      updatedAt: now,
    };
    onUpsert(p);
    setName("");
  };

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div style={{ fontWeight: 800, fontSize: 16 }}>Printers</div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="stack">
          <div className="grid2">
            <div>
              <label className="subtle">Add printer</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bambu X1C"
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
              <button className="btn primary" onClick={add} disabled={!canAdd}>
                Add
              </button>
            </div>
          </div>

          <div className="card">
            {sorted.length === 0 ? (
              <div className="subtle">No printers yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {sorted.map((p) => (
                  <div key={p.id} className="row" style={{ justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                    <button
                      className="btn danger"
                      onClick={() => {
                        const ok = confirm(`Delete printer "${p.name}"?\n\nAssigned spools will be unassigned.`);
                        if (!ok) return;
                        onDelete(p.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="subtle">
            Deleting a printer will unassign it from any spools currently in use.
          </div>
        </div>
      </div>
    </div>
  );
}

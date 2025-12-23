import type { Spool } from "../types/filament";
import { groupSpools } from "../lib/grouping";
import { ColorSwatch } from "./ColorSwatch";

type Props = {
  spools: Spool[];
  onOpen: (spool: Spool) => void;
};

function pctBar(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ width: 140, height: 10, borderRadius: 999, border: "1px solid #eee", background: "#fafafa" }}>
      <div
        style={{
          width: `${clamped}%`,
          height: "100%",
          borderRadius: 999,
          background: "#111",
          opacity: 0.12,
        }}
      />
    </div>
  );
}

export function InventoryList({ spools, onOpen }: Props) {
  if (spools.length === 0) {
    return (
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 6 }}>No spools yet</div>
        <div className="subtle">Click “Add Spool” to create your first entry.</div>
      </div>
    );
  }

  const groups = groupSpools(spools);

  return (
    <div className="card">
      <div className="subtle" style={{ marginBottom: 10 }}>
        Grouped by <b>brand + material + color + diameter</b>. Click a spool row to edit / adjust.
      </div>

      {groups.map((g) => {
        const lowGroup = g.avgRemainingPct <= 10 && g.totalRemainingG > 0;

        return (
          <div key={g.key} style={{ borderTop: "1px solid #eee", paddingTop: 10, marginTop: 10 }}>
            {/* Group header */}
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ColorSwatch color={g.color} size={16} />
                  <div style={{ fontWeight: 900 }}>
                    {g.brandLabel} • {g.material} • {g.color} • {g.diameterMm}mm
                    {lowGroup ? <span className="badge" style={{ marginLeft: 8 }}>low</span> : null}
                  </div>
                </div>
                <div className="subtle" style={{ marginTop: 4 }}>
                  <b>{g.count}</b> spool{g.count === 1 ? "" : "s"} • total{" "}
                  <b>{Math.round(g.totalRemainingG)}g</b> • avg <b>{g.avgRemainingPct.toFixed(1)}%</b>
                </div>
              </div>

              <div className="row" style={{ gap: 10 }}>
                {pctBar(g.avgRemainingPct)}
              </div>
            </div>

            {/* Spool table */}
            <table className="table" style={{ marginTop: 6 }}>
              <thead>
                <tr>
                  <th>Spool</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {g.spools.map((s) => {
                  const low = s.status === "ACTIVE" && s.remainingPct <= 10 && s.remainingG > 0;
                  return (
                    <tr key={s.id} onClick={() => onOpen(s)} style={{ cursor: "pointer" }}>
                      <td>
                        <div style={{ fontWeight: 800 }}>{s.name}</div>
                        <div className="subtle">
                          cap {Math.round(s.capacityG)}g
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
                          {Math.round(s.remainingG)}g ({s.remainingPct.toFixed(1)}%)
                          {low ? <span className="badge">low</span> : null}
                        </div>
                      </td>
                      <td>
                        <span className="badge">{s.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

import type { Spool } from "../types/filament";

type Props = {
  spools: Spool[];
  onOpen: (spool: Spool) => void;
};

export function InventoryList({ spools, onOpen }: Props) {
  if (spools.length === 0) {
    return (
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 6 }}>No spools yet</div>
        <div className="subtle">Click “Add Spool” to create your first entry.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Spool</th>
            <th>Material</th>
            <th>Color</th>
            <th>Remaining</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {spools.map((s) => {
            const low = s.status === "ACTIVE" && s.remainingPct <= 10 && s.remainingG > 0;
            return (
              <tr key={s.id} onClick={() => onOpen(s)} style={{ cursor: "pointer" }}>
                <td>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                  <div className="subtle">
                    {s.brand ? `${s.brand} • ` : ""}
                    {s.diameterMm}mm • cap {Math.round(s.capacityG)}g
                  </div>
                </td>
                <td>{s.material}</td>
                <td>{s.color}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>
                    {Math.round(s.remainingG)}g ({s.remainingPct.toFixed(1)}%)
                    {low ? <span className="badge" style={{ marginLeft: 8 }}>low</span> : null}
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
      <div className="subtle" style={{ marginTop: 10 }}>
        Click a spool to edit or do quick “used/refill” adjustments.
      </div>
    </div>
  );
}

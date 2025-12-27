import type { Spool } from "../types/filament";

export function StatPills({ spools }: { spools: Spool[] }) {
  const active = spools.filter((s) => s.status !== "EMPTY");
  const inUse = spools.filter((s) => s.status === "IN_USE");

  const totalG = active.reduce((acc, s) => acc + s.remainingG, 0);
  const low = active.filter((s) => s.remainingPct <= 10 && s.remainingG > 0);

  return (
    <div className="row" style={{ flexWrap: "wrap", marginBottom: 12 }}>
      <span className="pill">
        <b>{inUse.length}</b> in use
      </span>
      <span className="pill">
        <b>{active.length}</b> available
      </span>
      {/* <span className="pill">
        <b>{active.length}</b> active spools
      </span> */}
      <span className="pill">
        <b>{Math.round(totalG)}</b> g total remaining
      </span>
      <span className="pill">
        <b>{low.length}</b> low (&le;10%)
      </span>
      <span className="subtle" style={{ marginLeft: "auto" }}>
        Tip: press <span className="kbd">Esc</span> to close modals
      </span>
    </div>
  );
}

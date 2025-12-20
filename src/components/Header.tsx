type Props = {
  onAdd: () => void;
};

export function Header({ onAdd }: Props) {
  return (
    <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
      <div>
        <h1 className="h1">3D Spool Tracker</h1>
        <div className="subtle">Local-only inventory (saved in your browser).</div>
      </div>
      <div className="row">
        <button className="btn primary" onClick={onAdd}>+ Add Spool</button>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <div style={{ marginTop: 16, paddingBottom: 20 }}>
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 800 }}>Enjoying 3D Spool Tracker?</div>
          <div className="subtle">If it helps you, you can support development.</div>
        </div>

        <a
          className="btn primary"
          href="https://buymeacoffee.com/ktechforge"
          target="_blank"
          rel="noopener noreferrer"
        >
          ☕ Support me
        </a>
      </div>

      <div className="subtle" style={{ textAlign: "center", marginTop: 10 }}>
        KTechForge • Local-first • No accounts
      </div>
    </div>
  );
}

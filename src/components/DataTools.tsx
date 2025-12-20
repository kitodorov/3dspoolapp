import type { AppData, Spool } from "../types/filament";

type Props = {
  data: AppData;
  onApply: (next: AppData) => void;
};

function downloadJson(filename: string, obj: unknown) {
  const json = JSON.stringify(obj, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function isValidAppData(x: any): x is AppData {
  return x && typeof x === "object" && x.version === 1 && Array.isArray(x.spools);
}

function isValidSpoolLike(x: any): x is Spool {
  return x && typeof x === "object" && typeof x.id === "string" && x.id.trim().length > 0;
}

/**
 * Merge with de-duplication by spool.id.
 * Imported spools overwrite existing ones if ids collide.
 */
function mergeById(existing: Spool[], incoming: Spool[]): Spool[] {
  const map = new Map<string, Spool>();

  // existing first
  for (const s of existing) {
    if (isValidSpoolLike(s)) map.set(s.id, s);
  }

  // then incoming overwrites duplicates
  for (const s of incoming) {
    if (isValidSpoolLike(s)) map.set(s.id, s);
  }

  // Return newest-updated first (nice UX)
  return Array.from(map.values()).sort((a, b) => {
    const ta = Date.parse(a.updatedAt ?? a.createdAt ?? "") || 0;
    const tb = Date.parse(b.updatedAt ?? b.createdAt ?? "") || 0;
    return tb - ta;
  });
}

export function DataTools({ data, onApply }: Props) {
  const handleExport = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const filename = `3dspoolapp-backup-${yyyy}-${mm}-${dd}.json`;
    downloadJson(filename, data);
  };

  const handleFilePick: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    // allow re-selecting same file later
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!isValidAppData(parsed)) {
        alert("Invalid backup file. Expected: { version: 1, spools: [...] }");
        return;
      }

      const choice = (prompt(
        `Import mode?\n\n` +
          `Type:\n` +
          `  R = Replace (overwrite current data)\n` +
          `  M = Merge (combine + de-duplicate by id)\n\n` +
          `Spools in file: ${parsed.spools.length}\n` +
          `Current spools: ${data.spools.length}\n\n` +
          `Enter R or M:`,
        "M"
      ) || "").trim().toUpperCase();

      if (choice !== "R" && choice !== "M") return;

      if (choice === "R") {
        const ok = confirm(
          `Replace will OVERWRITE your current data.\n\n` +
            `Current spools: ${data.spools.length}\n` +
            `New spools: ${parsed.spools.length}\n\n` +
            `Continue?`
        );
        if (!ok) return;

        onApply(parsed);
        alert("Import complete (replaced).");
        return;
      }

      // Merge
      const mergedSpools = mergeById(data.spools, parsed.spools);
      const ok = confirm(
        `Merge will combine data and de-duplicate by id.\n\n` +
          `Current spools: ${data.spools.length}\n` +
          `File spools: ${parsed.spools.length}\n` +
          `Result spools: ${mergedSpools.length}\n\n` +
          `Continue?`
      );
      if (!ok) return;

      onApply({ version: 1, spools: mergedSpools });
      alert("Import complete (merged).");
    } catch (err) {
      console.error(err);
      alert("Could not read that file as JSON.");
    }
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 800 }}>Backup</div>
          <div className="subtle">Export/import your spools as a JSON file (replace or merge).</div>
        </div>

        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn" onClick={handleExport}>
            Export JSON
          </button>

          <label className="btn" style={{ cursor: "pointer" }}>
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleFilePick}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

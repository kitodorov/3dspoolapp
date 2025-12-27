import { useMemo, useState } from "react";
import "./styles.css";
import type { Material, Spool } from "./types/filament";
import { loadData, saveData, upsertSpool, removeSpool } from "./lib/storage";
import { Header } from "./components/Header";
import { StatPills } from "./components/StatPills";
import { InventoryList } from "./components/InventoryList";
import { SpoolFormModal } from "./components/SpoolFormModal";
import { SpoolDetailsModal } from "./components/SpoolDetailsModal";
import { DataTools } from "./components/DataTools";
import { Footer } from "./components/Footer";

function canonicalName(brand: string | undefined, material: string, color: string) {
  const b = (brand ?? "").trim();
  const c = (color ?? "").trim();
  return b ? `${b} ${material} - ${c}` : `${material} - ${c}`;
}


type Filters = {
  q: string;
  material: Material | "ALL";
  status: "ALL" | "IN_USE" | "IN_STORAGE" | "EMPTY";
};

export default function App() {
  const [data, setData] = useState(() => loadData());

  const [filters, setFilters] = useState<Filters>({
    q: "",
    material: "ALL",
    status: "ALL",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Spool | null>(null);
  const [prefill, setPrefill] = useState<Partial<Pick<Spool, "brand" | "material" | "color" | "diameterMm" | "capacityG">> | null>(null);
  const [initialQty, setInitialQty] = useState<number>(1);



  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<Spool | null>(null);

  const spools = data.spools;

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return spools
      .filter((s) => {
        if (filters.material !== "ALL" && s.material !== filters.material) return false;
        if (filters.status !== "ALL" && s.status !== filters.status) return false;
        if (!q) return true;

        const hay = `${s.name} ${s.brand ?? ""} ${s.material} ${s.color} ${s.status}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        // Active first, then by lowest remaining
        const rank = (s: Spool) =>  s.status === "IN_USE" ? 0 : s.status === "IN_STORAGE" ? 1 : 2;
        const ra = rank(a), rb = rank(b);
        if (ra !== rb) return ra - rb;
        return a.remainingPct - b.remainingPct;
      });
  }, [spools, filters]);

  const persist = (nextSpools: Spool[]) => {
    const next = { ...data, spools: nextSpools };
    setData(next);
    saveData(next);
  };


  const handleApplyData = (nextData: typeof data) => {
  setData(nextData);
  saveData(nextData);

  // Close modals just in case (prevents stale selections)
  setFormOpen(false);
  setDetailsOpen(false);
  setSelected(null);
  setEditing(null);
  };


  const handleAdd = () => {
    setFormMode("create");
    setEditing(null);
    setPrefill(null);
    setInitialQty(1);
    setFormOpen(true);
  };

  const handleAddAnother = (p: Partial<Pick<Spool, "brand" | "material" | "color" | "diameterMm" | "capacityG">>, qty = 1) => {
  setFormMode("create");
  setEditing(null);
  setPrefill(p);
  setFormOpen(true);
  setInitialQty(Math.max(1, Math.floor(qty || 1)));
};


  const handleOpenDetails = (spool: Spool) => {
    setSelected(spool);
    setDetailsOpen(true);
  };

  const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };
  
  function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function nextNameIndex(spools: Spool[], baseName: string) {
    const re = new RegExp(`^${escapeRegex(baseName)}\\s*#(\\d+)$`, "i");
    let max = 0;

    for (const s of spools) {
      const m = (s.name || "").trim().match(re);
      if (!m) continue;
      const n = Number(m[1]);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
    return max + 1;
  }


  const handleSaveSpool = (incoming: Spool, qty = 1) => {
    const n = Math.max(1, Math.floor(qty || 1));
    if (formMode === "edit") {
      const next = data.spools.map((s) => (s.id === incoming.id ? incoming : s));
      persist(next);
      setFormOpen(false);
      setEditing(null);
      setPrefill(null);
      return;
    }
    const now = new Date().toISOString();
    const sameGroup = (s: Spool) =>
      (s.brand ?? "") === (incoming.brand ?? "") &&
      s.material === incoming.material &&
      s.color === incoming.color &&
      s.diameterMm === incoming.diameterMm;
    const groupSpools = data.spools.filter(sameGroup);
    const baseName = canonicalName(incoming.brand, incoming.material, incoming.color);
    // const shouldSuffix = baseName.length > 0; 
    const startIndex = nextNameIndex(groupSpools, baseName);
    const created: Spool[] = Array.from({ length: n }, (_, i) => ({
      ...incoming,
      id: makeId(),
      createdAt: now,
      updatedAt: now,
      name: `${baseName} #${startIndex + i}`,
    }));

    persist([...created, ...data.spools]);

    setFormOpen(false);
    setEditing(null);
    setPrefill(null);
  };



  const handleUpdateSpool = (spool: Spool) => {
    const next = upsertSpool(spools, spool);
    persist(next);
    setSelected(spool);
  };

  const handleDeleteSpool = (id: string) => {
    const ok = confirm("Delete this spool? This cannot be undone.");
    if (!ok) return;
    const next = removeSpool(spools, id);
    persist(next);
    setDetailsOpen(false);
    setSelected(null);
  };

  const handleEditFromDetails = (spool: Spool) => {
    setDetailsOpen(false);
    setEditing(spool);
    setFormMode("edit");
    setFormOpen(true);
  };

  const materialOptions = useMemo(() => {
    const set = new Set(spools.map((s) => s.material));
    return Array.from(set).sort();
  }, [spools]);

  return (
    <div className="container">
      <Header onAdd={handleAdd} />
      <DataTools data={data} onApply={handleApplyData} />
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="grid3">
          <div>
            <label className="subtle">Search</label>
            <input
              className="input"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder="name, brand, material, color…"
            />
          </div>

          <div>
            <label className="subtle">Material</label>
            <select
              className="select"
              value={filters.material}
              onChange={(e) => setFilters((f) => ({ ...f, material: e.target.value as Filters["material"] }))}
            >
              <option value="ALL">All</option>
              {materialOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="subtle">Status</label>
            <select
              className="select"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as Filters["status"] }))}
            >
              <option value="ALL">All</option>
              <option value="IN_USE">In use</option>
              <option value="IN_STORAGE">In Storage</option>
              <option value="EMPTY">Empty</option>
            </select>
          </div>
        </div>

        <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
          <StatPills spools={filtered} />
        </div>
      </div>

      <InventoryList
        spools={filtered}
        onOpen={handleOpenDetails}
        onAddAnother={handleAddAnother}
      />


      <SpoolFormModal
        open={formOpen}
        mode={formMode}
        initial={editing}
        prefill={prefill}
        initialQty={initialQty}
        onClose={() => { setFormOpen(false); setPrefill(null); setInitialQty(1); }}
        onSave={handleSaveSpool}
      />

      <SpoolDetailsModal
        open={detailsOpen}
        spool={selected}
        onClose={() => setDetailsOpen(false)}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteSpool}
        onUpdate={handleUpdateSpool}
      />
      <Footer />
    </div>
  );
}

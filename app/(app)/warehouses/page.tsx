"use client";

// ============================================================
// Warehouses page
// Shows nested tree: Warehouse → Location
// Create warehouse / Create location modals
// ============================================================

import { useState, useEffect } from "react";
import {
  getWarehouses,
  createWarehouse,
  createLocation,
} from "@/lib/api-mock";
import { Warehouse, Location } from "@/lib/types";
import {
  PageHeader,
  EmptyState,
  ErrorState,
  Modal,
  FormField,
  inputClass,
  PrimaryButton,
} from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

// ---- Location item ----
function LocationItem({ location }: { location: Location }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors">
      <span className="text-slate-300">└</span>
      <span className="text-sm text-slate-600">{location.name}</span>
    </div>
  );
}

// ---- Warehouse card ----
function WarehouseCard({
  warehouse,
  onAddLocation,
}: {
  warehouse: Warehouse;
  onAddLocation: (wh: Warehouse) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const locations = warehouse.locations ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-400 hover:text-slate-600 transition-colors text-sm"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▾" : "▸"}
          </button>
          <span className="text-xl">🏭</span>
          <div>
            <h3 className="font-semibold text-slate-900">{warehouse.name}</h3>
            <p className="text-xs text-slate-400">
              {locations.length} location{locations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => onAddLocation(warehouse)}
          className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
        >
          + Add location
        </button>
      </div>

      {expanded && (
        <div>
          {locations.length === 0 ? (
            <div className="px-5 py-4 text-sm text-slate-400 italic">
              No locations yet — add one above.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {locations.map((loc) => (
                <LocationItem key={loc.id} location={loc} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Main page ----
export default function WarehousesPage() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [showNewWarehouse, setShowNewWarehouse] = useState(false);
  const [addLocationTarget, setAddLocationTarget] = useState<Warehouse | null>(null);

  const [whName, setWhName] = useState("");
  const [whError, setWhError] = useState("");
  const [whLoading, setWhLoading] = useState(false);

  const [locName, setLocName] = useState("");
  const [locError, setLocError] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreateWarehouse(e: React.FormEvent) {
    e.preventDefault();
    if (!whName.trim()) { setWhError("Warehouse name is required."); return; }
    setWhError("");
    setWhLoading(true);
    try {
      const newWh = await createWarehouse({ name: whName.trim() });
      setWarehouses((prev) => [...prev, newWh]);
      setWhName("");
      setShowNewWarehouse(false);
      toast({ message: "Warehouse created!", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create warehouse.";
      toast({ message: msg, type: "error" });
    } finally {
      setWhLoading(false);
    }
  }

  async function handleCreateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!addLocationTarget) return;
    if (!locName.trim()) { setLocError("Location name is required."); return; }
    setLocError("");
    setLocLoading(true);
    try {
      const newLoc: Location = await createLocation(addLocationTarget.id, { name: locName.trim() });
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === addLocationTarget.id
            ? { ...w, locations: [...(w.locations ?? []), newLoc] }
            : w
        )
      );
      setLocName("");
      setAddLocationTarget(null);
      toast({ message: "Location added!", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add location.";
      toast({ message: msg, type: "error" });
    } finally {
      setLocLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Manage your warehouses and their storage locations."
        action={
          <PrimaryButton onClick={() => setShowNewWarehouse(true)} id="new-warehouse-button">
            + New Warehouse
          </PrimaryButton>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-slate-100 h-32 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon="🏭"
          title="No warehouses yet"
          description="Create your first warehouse to start managing inventory locations."
          action={
            <PrimaryButton onClick={() => setShowNewWarehouse(true)}>
              + New Warehouse
            </PrimaryButton>
          }
        />
      ) : (
        <div className="space-y-4">
          {warehouses.map((wh) => (
            <WarehouseCard
              key={wh.id}
              warehouse={wh}
              onAddLocation={setAddLocationTarget}
            />
          ))}
        </div>
      )}

      {/* New warehouse modal */}
      <Modal open={showNewWarehouse} onClose={() => setShowNewWarehouse(false)} title="New Warehouse">
        <form onSubmit={handleCreateWarehouse} noValidate className="p-6 space-y-4">
          <FormField label="Warehouse name" htmlFor="wh-name" error={whError} required>
            <input
              id="wh-name"
              type="text"
              value={whName}
              onChange={(e) => { setWhName(e.target.value); setWhError(""); }}
              placeholder="Main Warehouse"
              className={inputClass}
              autoFocus
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowNewWarehouse(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" loading={whLoading}>
              Create warehouse
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Add location modal */}
      <Modal
        open={!!addLocationTarget}
        onClose={() => setAddLocationTarget(null)}
        title={`Add location — ${addLocationTarget?.name ?? ""}`}
      >
        <form onSubmit={handleCreateLocation} noValidate className="p-6 space-y-4">
          <FormField label="Location name" htmlFor="loc-name" error={locError} required>
            <input
              id="loc-name"
              type="text"
              value={locName}
              onChange={(e) => { setLocName(e.target.value); setLocError(""); }}
              placeholder="Rack A / Main Store / Section 1"
              className={inputClass}
              autoFocus
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddLocationTarget(null)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" loading={locLoading}>
              Add location
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

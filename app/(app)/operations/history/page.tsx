"use client";

// ============================================================
// Move History — unified read-only view of all operation types
// Filterable by type/status/product/location/date
// ============================================================

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getStockLedger, getProducts, getAllLocations } from "@/lib/api";
import { StockLedgerEntry, OperationType, Product, Location, Warehouse } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  PageHeader, TableSkeleton, EmptyState, ErrorState, inputClass, selectClass,
} from "@/components/ui/shared";
import { DocumentStatus } from "@/lib/types";

// Operation type badge colors
function OpBadge({ type }: { type: OperationType }) {
  const styles: Record<OperationType, string> = {
    RECEIPT: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DELIVERY: "bg-red-50 text-red-700 border-red-200",
    TRANSFER: "bg-blue-50 text-blue-700 border-blue-200",
    ADJUSTMENT: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${styles[type]}`}>
      {type}
    </span>
  );
}

function HistoryContent() {
  const searchParams = useSearchParams();

  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<(Location & { warehouse: Warehouse })[]>([]);

  const [filters, setFilters] = useState<{
    operationType: string;
    productId: string;
    locationId: string;
    dateFrom: string;
    dateTo: string;
  }>({
    operationType: searchParams.get("type") || "",
    productId: searchParams.get("product") || "",
    locationId: searchParams.get("location") || "",
    dateFrom: "",
    dateTo: "",
  });

  const fetch = useCallback(async (f: { operationType: string; productId: string; locationId: string; dateFrom: string; dateTo: string }) => {
    setLoading(true);
    setError(false);
    try {
      const res = await getStockLedger({
        operationType: (f.operationType as OperationType) || undefined,
        productId: f.productId || undefined,
        locationId: f.locationId || undefined,
        dateFrom: f.dateFrom || undefined,
        dateTo: f.dateTo || undefined,
      });
      setEntries(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getProducts().then((r) => setProducts(r.data)).catch(() => {});
    getAllLocations().then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(filters);
  }, [filters, fetch]);

  function updateFilter(key: keyof typeof filters, val: string) {
    setFilters((p) => ({ ...p, [key]: val }));
  }

  function clearFilters() {
    setFilters({ operationType: "", productId: "", locationId: "", dateFrom: "", dateTo: "" });
  }

  // Map operation type to document status for StatusBadge reuse
  const opToStatus: Record<string, DocumentStatus> = {
    RECEIPT: "Done",
    DELIVERY: "Done",
    TRANSFER: "Done",
    ADJUSTMENT: "Done",
  };

  return (
    <div>
      <PageHeader
        title="Move History"
        description="Unified read-only view of all inventory movements."
      />

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 mb-5 shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Operation</label>
          <select
            id="history-op-filter"
            value={filters.operationType}
            onChange={(e) => updateFilter("operationType", e.target.value)}
            className={`${selectClass} w-36`}
          >
            <option value="">All types</option>
            <option value="RECEIPT">Receipt</option>
            <option value="DELIVERY">Delivery</option>
            <option value="TRANSFER">Transfer</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
          <select
            id="history-product-filter"
            value={filters.productId}
            onChange={(e) => updateFilter("productId", e.target.value)}
            className={`${selectClass} w-44`}
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
          <select
            id="history-location-filter"
            value={filters.locationId}
            onChange={(e) => updateFilter("locationId", e.target.value)}
            className={`${selectClass} w-44`}
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.warehouse.name} → {l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">From date</label>
          <input
            id="history-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            className={`${inputClass} w-36`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">To date</label>
          <input
            id="history-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
            className={`${inputClass} w-36`}
          />
        </div>
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors self-end"
        >
          Clear
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Date", "Operation", "Product", "Quantity", "Source", "Destination", "Reference"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <TableSkeleton rows={6} cols={7} />
            ) : error ? (
              <tr><td colSpan={7}><ErrorState onRetry={() => fetch(filters)} /></td></tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon="📋"
                    title="No movement history"
                    description="Operations you validate will appear here."
                  />
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <OpBadge type={entry.operationType} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {entry.product?.name ?? entry.productId}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${entry.quantity >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {entry.sourceLocation?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {entry.destLocation?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">
                    {entry.referenceType}/{entry.referenceId}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Read-only notice */}
      <p className="mt-3 text-xs text-slate-400 text-center">
        This view is read-only. Stock movements are recorded automatically when operations are validated.
      </p>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading…</div>}>
      <HistoryContent />
    </Suspense>
  );
}

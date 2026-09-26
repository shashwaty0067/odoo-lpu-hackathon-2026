"use client";

// ============================================================
// Stock Ledger — read-only paginated table
// Colors: RECEIPT=green, DELIVERY=red, TRANSFER=blue, ADJUSTMENT=amber
// Signed quantities, no edit/delete anywhere on this page.
// ============================================================

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getStockLedger, getProducts, getAllLocations } from "@/lib/api";
import { StockLedgerEntry, OperationType, Product, Location, Warehouse } from "@/lib/types";
import {
  PageHeader, TableSkeleton, EmptyState, ErrorState, inputClass, selectClass,
} from "@/components/ui/shared";

// Operation badge — consistent colors per the spec
function LedgerOpBadge({ type }: { type: OperationType }) {
  const styles: Record<OperationType, string> = {
    RECEIPT: "bg-emerald-100 text-emerald-800 border-emerald-200",
    DELIVERY: "bg-red-100 text-red-800 border-red-200",
    TRANSFER: "bg-blue-100 text-blue-800 border-blue-200",
    ADJUSTMENT: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${styles[type]}`}>
      {type}
    </span>
  );
}

const PAGE_SIZE = 15;

function LedgerContent() {
  const searchParams = useSearchParams();

  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<(Location & { warehouse: Warehouse })[]>([]);

  const [filters, setFilters] = useState<{
    productId: string;
    locationId: string;
    operationType: string;
    dateFrom: string;
    dateTo: string;
  }>({
    productId: searchParams.get("product") || "",
    locationId: searchParams.get("location") || "",
    operationType: searchParams.get("type") || "",
    dateFrom: "",
    dateTo: "",
  });

  const fetch = useCallback(async (f: { productId: string; locationId: string; operationType: string; dateFrom: string; dateTo: string }, pg: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await getStockLedger({
        productId: f.productId || undefined,
        locationId: f.locationId || undefined,
        operationType: (f.operationType as OperationType) || undefined,
        dateFrom: f.dateFrom || undefined,
        dateTo: f.dateTo || undefined,
        page: pg,
        pageSize: PAGE_SIZE,
      });
      setEntries(res.data);
      setTotal(res.total);
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
    setPage(1);
    fetch(filters, 1);
  }, [filters, fetch]);

  function handlePage(newPage: number) {
    setPage(newPage);
    fetch(filters, newPage);
  }

  function updateFilter(key: keyof typeof filters, val: string) {
    setFilters((p) => ({ ...p, [key]: val }));
  }

  function clearFilters() {
    setFilters({ productId: "", locationId: "", operationType: "", dateFrom: "", dateTo: "" });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Stock Ledger"
        description="Complete, immutable record of all stock movements. Read-only."
      />

      {/* Immutability notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm text-slate-600">
        <span>🔒</span>
        <span>
          The stock ledger is <strong>immutable</strong>. Entries are created automatically when
          operations are validated and cannot be edited or deleted.
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 mb-5 shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
          <select
            id="ledger-product-filter"
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
            id="ledger-location-filter"
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
          <label className="block text-xs font-medium text-slate-500 mb-1">Operation</label>
          <select
            id="ledger-op-filter"
            value={filters.operationType}
            onChange={(e) => updateFilter("operationType", e.target.value)}
            className={`${selectClass} w-36`}
          >
            <option value="">All types</option>
            <option value="RECEIPT">RECEIPT</option>
            <option value="DELIVERY">DELIVERY</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
          <input
            id="ledger-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            className={`${inputClass} w-36`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
          <input
            id="ledger-date-to"
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
              {["Date / Time", "Product", "Operation", "Quantity", "Source", "Destination", "Reference", "User"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <TableSkeleton rows={8} cols={8} />
            ) : error ? (
              <tr><td colSpan={8}><ErrorState onRetry={() => fetch(filters, page)} /></td></tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon="📚"
                    title="No ledger entries found"
                    description="Stock movements appear here when operations are validated."
                  />
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">
                      {entry.product?.name ?? entry.productId}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">{entry.product?.sku ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <LedgerOpBadge type={entry.operationType} />
                  </td>
                  <td className="px-4 py-3">
                    {/* Signed quantity — positive green, negative red */}
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        entry.quantity > 0
                          ? "text-emerald-600"
                          : entry.quantity < 0
                          ? "text-red-600"
                          : "text-slate-500"
                      }`}
                    >
                      {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {entry.sourceLocation?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {entry.destLocation?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-indigo-600">
                    {entry.referenceType}/{entry.referenceId.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {entry.performedBy?.name ?? entry.performedById}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} entries
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              id="ledger-prev-page"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => handlePage(p)}
                  className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    p === page
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => handlePage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              id="ledger-next-page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading…</div>}>
      <LedgerContent />
    </Suspense>
  );
}

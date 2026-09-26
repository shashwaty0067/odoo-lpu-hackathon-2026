"use client";

// ============================================================
// Stock Adjustments — list page
// ============================================================

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getAdjustments } from "@/lib/api";
import { StockAdjustment, DocumentStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  PageHeader, TableSkeleton, EmptyState, ErrorState, selectClass, PrimaryButton,
} from "@/components/ui/shared";

function AdjustmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as DocumentStatus) || "";

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const fetch = useCallback(async (status: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await getAdjustments({ status: status as DocumentStatus || undefined });
      setAdjustments(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(statusFilter);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    router.replace(`/operations/adjustments?${params.toString()}`, { scroll: false });
  }, [statusFilter, fetch, router]);

  return (
    <div>
      <PageHeader
        title="Stock Adjustments"
        description="Correct stock levels based on physical inventory counts."
        action={
          <Link href="/operations/adjustments/new">
            <PrimaryButton id="new-adjustment-button">+ New Adjustment</PrimaryButton>
          </Link>
        }
      />

      <div className="flex gap-3 mb-5">
        <select
          id="adjustment-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${selectClass} w-40`}
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Done">Done</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Reference", "Product", "Location", "System Qty", "Counted Qty", "Δ Difference", "Status", "Date", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <TableSkeleton rows={5} cols={9} />
            ) : error ? (
              <tr><td colSpan={9}><ErrorState onRetry={() => fetch(statusFilter)} /></td></tr>
            ) : adjustments.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    icon="🔧"
                    title="No adjustments yet"
                    description="Create a stock adjustment when physical count differs from system stock."
                    action={
                      <Link href="/operations/adjustments/new">
                        <PrimaryButton>+ New Adjustment</PrimaryButton>
                      </Link>
                    }
                  />
                </td>
              </tr>
            ) : (
              adjustments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/operations/adjustments/${a.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      {a.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{a.product?.name ?? a.productId}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.location?.name ?? a.locationId}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.systemQuantity}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.countedQuantity}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-bold ${
                        a.delta > 0
                          ? "text-emerald-600"
                          : a.delta < 0
                          ? "text-red-600"
                          : "text-slate-500"
                      }`}
                    >
                      {a.delta > 0 ? `+${a.delta}` : a.delta}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/operations/adjustments/${a.id}`} className="text-xs text-indigo-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdjustmentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading…</div>}>
      <AdjustmentsContent />
    </Suspense>
  );
}

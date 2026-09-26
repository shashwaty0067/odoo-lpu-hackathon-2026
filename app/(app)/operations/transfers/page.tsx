"use client";

// ============================================================
// Internal Transfers — list page
// ============================================================

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getTransfers } from "@/lib/api-mock";
import { InternalTransfer, DocumentStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  PageHeader, TableSkeleton, EmptyState, ErrorState, selectClass, PrimaryButton,
} from "@/components/ui/shared";

function TransfersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as DocumentStatus) || "";

  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const fetch = useCallback(async (status: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await getTransfers({ status: status as DocumentStatus || undefined });
      setTransfers(res.data);
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
    router.replace(`/operations/transfers?${params.toString()}`, { scroll: false });
  }, [statusFilter, fetch, router]);

  return (
    <div>
      <PageHeader
        title="Internal Transfers"
        description="Move stock between warehouse locations."
        action={
          <Link href="/operations/transfers/new">
            <PrimaryButton id="new-transfer-button">+ New Transfer</PrimaryButton>
          </Link>
        }
      />

      <div className="flex gap-3 mb-5">
        <select
          id="transfer-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${selectClass} w-40`}
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Done">Done</option>
          <option value="Canceled">Canceled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Reference", "Items", "Source → Destination", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : error ? (
              <tr><td colSpan={6}><ErrorState onRetry={() => fetch(statusFilter)} /></td></tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon="🔄"
                    title="No transfers yet"
                    description="Create your first internal stock transfer."
                    action={
                      <Link href="/operations/transfers/new">
                        <PrimaryButton>+ New Transfer</PrimaryButton>
                      </Link>
                    }
                  />
                </td>
              </tr>
            ) : (
              transfers.map((t) => {
                const firstItem = t.items[0];
                const routeLabel = firstItem
                  ? `${firstItem.sourceLocation?.name ?? "?"} → ${firstItem.destLocation?.name ?? "?"}`
                  : "—";
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/operations/transfers/${t.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                        {t.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.items.length}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono text-xs">{routeLabel}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/operations/transfers/${t.id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TransfersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading…</div>}>
      <TransfersContent />
    </Suspense>
  );
}

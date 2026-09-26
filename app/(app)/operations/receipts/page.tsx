"use client";

// ============================================================
// Receipts list page
// Pattern reused for Deliveries (same structure, different entity)
// ============================================================

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getReceipts, cancelReceipt } from "@/lib/api-mock";
import { Receipt, DocumentStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  PageHeader,
  TableSkeleton,
  EmptyState,
  ErrorState,
  selectClass,
  PrimaryButton,
} from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

function ReceiptsContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  const [cancelTarget, setCancelTarget] = useState<Receipt | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetch = useCallback(async (status: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await getReceipts({ status: (status as DocumentStatus) || undefined });
      setReceipts(res.data);
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
    router.replace(`/operations/receipts?${params.toString()}`, { scroll: false });
  }, [statusFilter, fetch, router]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const updated = await cancelReceipt(cancelTarget.id);
      setReceipts((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast({ message: `Receipt ${cancelTarget.reference} canceled.`, type: "success" });
      setCancelTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel receipt.";
      toast({ message: msg, type: "error" });
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Receipts"
        description="Incoming stock receipts from suppliers."
        action={
          <Link href="/operations/receipts/new">
            <PrimaryButton id="new-receipt-button">+ New Receipt</PrimaryButton>
          </Link>
        }
      />

      {/* Filter */}
      <div className="flex gap-3 mb-5">
        <select
          id="receipt-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${selectClass} w-40`}
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Waiting">Waiting</option>
          <option value="Ready">Ready</option>
          <option value="Done">Done</option>
          <option value="Canceled">Canceled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Reference", "Supplier", "Items", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : error ? (
              <tr>
                <td colSpan={6}><ErrorState onRetry={() => fetch(statusFilter)} /></td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon="📥"
                    title="No receipts yet"
                    description="Create your first receipt to start receiving stock."
                    action={
                      <Link href="/operations/receipts/new">
                        <PrimaryButton>+ New Receipt</PrimaryButton>
                      </Link>
                    }
                  />
                </td>
              </tr>
            ) : (
              receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/operations/receipts/${r.id}`}
                      className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                      {r.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{r.supplier}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.items.length}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/operations/receipts/${r.id}`} className="text-xs text-indigo-600 hover:underline">
                        View
                      </Link>
                      {r.status !== "Done" && r.status !== "Canceled" && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => setCancelTarget(r)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel receipt?"
        description={
          <>
            <p>
              Are you sure you want to cancel receipt{" "}
              <strong>{cancelTarget?.reference}</strong>?
            </p>
            {cancelTarget?.status === "Done" && (
              <p className="mt-2 text-amber-600 text-xs font-medium">
                ⚠ This receipt has been validated. Canceling it would require a manual reversal adjustment.
              </p>
            )}
          </>
        }
        confirmLabel="Yes, cancel"
        variant="danger"
        loading={cancelLoading}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading…</div>}>
      <ReceiptsContent />
    </Suspense>
  );
}

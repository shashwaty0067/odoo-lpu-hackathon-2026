"use client";

// ============================================================
// Deliveries list page — same pattern as Receipts
// ============================================================

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getDeliveries, cancelDelivery } from "@/lib/api";
import { Delivery, DocumentStatus } from "@/lib/types";
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

function DeliveriesContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as DocumentStatus) || "";

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [cancelTarget, setCancelTarget] = useState<Delivery | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetch = useCallback(async (status: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await getDeliveries({ status: status as DocumentStatus || undefined });
      setDeliveries(res.data);
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
    router.replace(`/operations/deliveries?${params.toString()}`, { scroll: false });
  }, [statusFilter, fetch, router]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const updated = await cancelDelivery(cancelTarget.id);
      setDeliveries((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast({ message: `Delivery ${cancelTarget.reference} canceled.`, type: "success" });
      setCancelTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel delivery.";
      toast({ message: msg, type: "error" });
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Delivery Orders"
        description="Outgoing deliveries to customers."
        action={
          <Link href="/operations/deliveries/new">
            <PrimaryButton id="new-delivery-button">+ New Delivery</PrimaryButton>
          </Link>
        }
      />

      <div className="flex gap-3 mb-5">
        <select
          id="delivery-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${selectClass} w-40`}
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Waiting">Waiting</option>
          <option value="Done">Done</option>
          <option value="Canceled">Canceled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Reference", "Customer", "Items", "Status", "Created", "Actions"].map((h) => (
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
              <tr><td colSpan={6}><ErrorState onRetry={() => fetch(statusFilter)} /></td></tr>
            ) : deliveries.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon="📤"
                    title="No delivery orders yet"
                    description="Create your first delivery order."
                    action={
                      <Link href="/operations/deliveries/new">
                        <PrimaryButton>+ New Delivery</PrimaryButton>
                      </Link>
                    }
                  />
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/operations/deliveries/${d.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      {d.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{d.customer}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{d.items.length}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/operations/deliveries/${d.id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
                      {d.status !== "Done" && d.status !== "Canceled" && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button onClick={() => setCancelTarget(d)} className="text-xs text-red-500 hover:underline">Cancel</button>
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
        title="Cancel delivery?"
        description={
          <p>Cancel delivery <strong>{cancelTarget?.reference}</strong> to {cancelTarget?.customer}?</p>
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

export default function DeliveriesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading…</div>}>
      <DeliveriesContent />
    </Suspense>
  );
}

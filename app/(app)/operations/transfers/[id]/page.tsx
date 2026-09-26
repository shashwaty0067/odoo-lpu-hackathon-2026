"use client";

// ============================================================
// Transfer detail page — source → destination visual
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTransfer, validateTransfer } from "@/lib/api";
import { InternalTransfer } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [transfer, setTransfer] = useState<InternalTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getTransfer(id)
      .then(setTransfer)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleValidate() {
    setActionLoading(true);
    try {
      const updated = await validateTransfer(id);
      setTransfer(updated);
      toast({ message: `Transfer ${updated.reference} validated!`, type: "success" });
      setShowValidate(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to validate transfer.";
      toast({ message: msg, type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-slate-100 h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !transfer) {
    return <ErrorState message="Could not load transfer." onRetry={() => router.refresh()} />;
  }

  const canValidate = transfer.status !== "Done" && transfer.status !== "Canceled";

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
          >
            ← Back to transfers
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{transfer.reference}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Internal stock transfer</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={transfer.status} />
          {canValidate && (
            <button
              onClick={() => setShowValidate(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              id="validate-transfer-button"
            >
              ✓ Validate
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Created</p>
          <p className="text-sm text-slate-800">{new Date(transfer.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Last updated</p>
          <p className="text-sm text-slate-800">{new Date(transfer.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Items with source → destination visual */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Items ({transfer.items.length})</h2>
        </div>
        {transfer.items.length === 0 ? (
          <EmptyState title="No items" description="This transfer has no line items." />
        ) : (
          <div className="divide-y divide-slate-50">
            {transfer.items.map((item) => (
              <div key={item.id} className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-slate-800">
                    {item.product?.name ?? item.productId}
                  </span>
                  <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {item.product?.sku ?? "—"}
                  </span>
                </div>

                {/* Arrow visualization */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Source</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.sourceLocation?.name ?? item.sourceLocationId}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-indigo-500 font-bold text-xl">→</span>
                    <span className="text-xs font-bold text-slate-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-0.5">
                      {item.quantity} {item.product?.unitOfMeasure ?? ""}
                    </span>
                  </div>
                  <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-emerald-600 mb-1 font-medium uppercase tracking-wide">Destination</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.destLocation?.name ?? item.destLocationId}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showValidate}
        title="Validate transfer?"
        description={
          <p>
            Validating <strong>{transfer.reference}</strong> will move the stock from the
            source to the destination locations. This cannot be undone.
          </p>
        }
        confirmLabel="Validate"
        variant="primary"
        loading={actionLoading}
        onConfirm={handleValidate}
        onCancel={() => setShowValidate(false)}
      />
    </div>
  );
}

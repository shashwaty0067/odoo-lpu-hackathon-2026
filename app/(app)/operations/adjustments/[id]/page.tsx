"use client";

// ============================================================
// Adjustment detail page
// Shows system qty, counted qty, delta, who performed it, validate button
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdjustment, validateAdjustment } from "@/lib/api";
import { StockAdjustment } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

export default function AdjustmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [adj, setAdj] = useState<StockAdjustment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getAdjustment(id)
      .then(setAdj)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleValidate() {
    setActionLoading(true);
    try {
      const updated = await validateAdjustment(id);
      setAdj(updated);
      toast({ message: `Adjustment ${updated.reference} validated — stock updated!`, type: "success" });
      setShowValidate(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to validate adjustment.";
      toast({ message: msg, type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-slate-100 h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !adj) {
    return <ErrorState message="Could not load adjustment." onRetry={() => router.refresh()} />;
  }

  const canValidate = adj.status !== "Done";

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1">
            ← Back to adjustments
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{adj.reference}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stock adjustment</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={adj.status} />
          {canValidate && (
            <button
              onClick={() => setShowValidate(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              id="validate-adjustment-button"
            >
              ✓ Validate Adjustment
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Product</p>
            <p className="text-sm font-semibold text-slate-800">{adj.product?.name ?? adj.productId}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{adj.product?.sku ?? ""}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Location</p>
            <p className="text-sm font-semibold text-slate-800">{adj.location?.name ?? adj.locationId}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Performed by</p>
            <p className="text-sm text-slate-700">{adj.performedBy?.name ?? adj.performedById}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date</p>
            <p className="text-sm text-slate-700">{new Date(adj.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quantity comparison */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Quantity Comparison</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">System Qty</p>
            <p className="text-3xl font-bold text-slate-700">{adj.systemQuantity}</p>
            <p className="text-xs text-slate-400 mt-1">{adj.product?.unitOfMeasure ?? ""}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Counted Qty</p>
            <p className="text-3xl font-bold text-slate-700">{adj.countedQuantity}</p>
            <p className="text-xs text-slate-400 mt-1">{adj.product?.unitOfMeasure ?? ""}</p>
          </div>
          <div
            className={`rounded-lg p-4 text-center ${
              adj.delta === 0
                ? "bg-emerald-50"
                : adj.delta > 0
                ? "bg-blue-50"
                : "bg-red-50"
            }`}
          >
            <p className={`text-xs uppercase tracking-wide mb-2 font-medium ${adj.delta === 0 ? "text-emerald-600" : adj.delta > 0 ? "text-blue-600" : "text-red-600"}`}>
              Difference
            </p>
            <p className={`text-3xl font-bold ${adj.delta === 0 ? "text-emerald-600" : adj.delta > 0 ? "text-blue-600" : "text-red-600"}`}>
              {adj.delta > 0 ? `+${adj.delta}` : adj.delta}
            </p>
            <p className="text-xs text-slate-400 mt-1">{adj.product?.unitOfMeasure ?? ""}</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showValidate}
        title="Validate adjustment?"
        description={
          <p>
            This will update the stock for{" "}
            <strong>{adj.product?.name}</strong> at{" "}
            <strong>{adj.location?.name}</strong> from{" "}
            <strong>{adj.systemQuantity}</strong> to{" "}
            <strong>{adj.countedQuantity}</strong>. This cannot be undone.
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

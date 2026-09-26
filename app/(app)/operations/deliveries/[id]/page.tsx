"use client";

// ============================================================
// Delivery detail page — same pattern as Receipt detail
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDelivery, validateDelivery, cancelDelivery } from "@/lib/api";
import { Delivery } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getDelivery(id)
      .then(setDelivery)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleValidate() {
    setActionLoading(true);
    try {
      const updated = await validateDelivery(id);
      setDelivery(updated);
      toast({ message: `Delivery ${updated.reference} validated!`, type: "success" });
      setShowValidate(false);
    } catch (err: unknown) {
      // Surface exact backend errors (e.g. insufficient stock) as toast
      const msg = err instanceof Error ? err.message : "Failed to validate delivery.";
      toast({ message: msg, type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      const updated = await cancelDelivery(id);
      setDelivery(updated);
      toast({ message: `Delivery ${updated.reference} canceled.`, type: "success" });
      setShowCancel(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel delivery.";
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

  if (error || !delivery) {
    return <ErrorState message="Could not load delivery." onRetry={() => router.refresh()} />;
  }

  const canValidate = delivery.status !== "Done" && delivery.status !== "Canceled";
  const canCancel = delivery.status !== "Canceled" && delivery.status !== "Done";

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1">
            ← Back to deliveries
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{delivery.reference}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Customer: {delivery.customer}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={delivery.status} />
          {canValidate && (
            <button
              onClick={() => setShowValidate(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              id="validate-delivery-button"
            >
              ✓ Validate
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              id="cancel-delivery-button"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Created</p>
          <p className="text-sm text-slate-800">{new Date(delivery.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Last updated</p>
          <p className="text-sm text-slate-800">{new Date(delivery.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Items ({delivery.items.length})</h2>
        </div>
        {delivery.items.length === 0 ? (
          <EmptyState title="No items" description="This delivery has no line items." />
        ) : (
          <table>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Product", "SKU", "From Location", "Quantity"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {delivery.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.product?.name ?? item.productId}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{item.product?.sku ?? "—"}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.location?.name ?? item.locationId}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.quantity} {item.product?.unitOfMeasure ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={showValidate}
        title="Validate delivery?"
        description={
          <p>
            Validating <strong>{delivery.reference}</strong> will deduct the listed quantities from stock.
            If stock is insufficient at the time of validation, you will see the exact error message.
          </p>
        }
        confirmLabel="Validate"
        variant="primary"
        loading={actionLoading}
        onConfirm={handleValidate}
        onCancel={() => setShowValidate(false)}
      />

      <ConfirmDialog
        open={showCancel}
        title="Cancel delivery?"
        description={<p>Cancel delivery <strong>{delivery.reference}</strong> to {delivery.customer}?</p>}
        confirmLabel="Yes, cancel"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />
    </div>
  );
}

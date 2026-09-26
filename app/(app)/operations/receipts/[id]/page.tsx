"use client";

// ============================================================
// Receipt detail page
// Shows items, status, Validate / Cancel actions with confirm dialogs
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReceipt, validateReceipt, cancelReceipt } from "@/lib/api-mock";
import { Receipt } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getReceipt(id)
      .then((r) => setReceipt(r))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleValidate() {
    setActionLoading(true);
    try {
      const updated = await validateReceipt(id);
      setReceipt(updated);
      toast({ message: `Receipt ${updated.reference} validated!`, type: "success" });
      setShowValidate(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to validate receipt.";
      toast({ message: msg, type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      const updated = await cancelReceipt(id);
      setReceipt(updated);
      toast({ message: `Receipt ${updated.reference} canceled.`, type: "success" });
      setShowCancel(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel receipt.";
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

  if (error || !receipt) {
    return (
      <ErrorState
        message="Could not load receipt."
        onRetry={() => router.refresh()}
      />
    );
  }

  const canValidate = receipt.status !== "Done" && receipt.status !== "Canceled";
  const canCancel = receipt.status !== "Canceled";

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
          >
            ← Back to receipts
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{receipt.reference}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Supplier: {receipt.supplier}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={receipt.status} />
          {canValidate && (
            <button
              onClick={() => setShowValidate(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              id="validate-receipt-button"
            >
              ✓ Validate
            </button>
          )}
          {canCancel && receipt.status !== "Done" && (
            <button
              onClick={() => setShowCancel(true)}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              id="cancel-receipt-button"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Created</p>
          <p className="text-sm text-slate-800">
            {new Date(receipt.createdAt).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Last updated</p>
          <p className="text-sm text-slate-800">
            {new Date(receipt.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">
            Items ({receipt.items.length})
          </h2>
        </div>
        {receipt.items.length === 0 ? (
          <EmptyState title="No items" description="This receipt has no line items." />
        ) : (
          <table>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Product", "SKU", "Location", "Quantity"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {receipt.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {item.product?.name ?? item.productId}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {item.product?.sku ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {item.location?.name ?? item.locationId}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {item.quantity} {item.product?.unitOfMeasure ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Validate confirm */}
      <ConfirmDialog
        open={showValidate}
        title="Validate receipt?"
        description={
          <p>
            Validating <strong>{receipt.reference}</strong> will add the listed quantities
            to stock. This action cannot be undone without a manual adjustment.
          </p>
        }
        confirmLabel="Validate"
        variant="primary"
        loading={actionLoading}
        onConfirm={handleValidate}
        onCancel={() => setShowValidate(false)}
      />

      {/* Cancel confirm */}
      <ConfirmDialog
        open={showCancel}
        title="Cancel receipt?"
        description={
          <>
            <p>
              Are you sure you want to cancel <strong>{receipt.reference}</strong>?
            </p>
            {receipt.status === "Done" && (
              <p className="mt-2 text-amber-600 text-sm font-medium">
                ⚠ This receipt has already been validated. Canceling a completed receipt
                would require a reversal adjustment — please contact your administrator.
              </p>
            )}
          </>
        }
        confirmLabel="Yes, cancel"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />
    </div>
  );
}

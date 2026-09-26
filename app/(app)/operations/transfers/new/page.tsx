"use client";

// ============================================================
// New Internal Transfer form
// Validates same-location client-side before hitting server
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTransfer, getProducts, getAllLocations } from "@/lib/api";
import { Product, Location, Warehouse } from "@/lib/types";
import {
  PageHeader, FormField, inputClass, selectClass, PrimaryButton,
} from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

export default function NewTransferPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [productId, setProductId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destLocationId, setDestLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<(Location & { warehouse: Warehouse })[]>([]);

  useEffect(() => {
    getProducts().then((r) => setProducts(r.data)).catch(() => {});
    getAllLocations().then(setLocations).catch(() => {});
  }, []);

  // Live client-side same-location check — shows error before even submitting
  useEffect(() => {
    if (sourceLocationId && destLocationId && sourceLocationId === destLocationId) {
      setErrors((p) => ({
        ...p,
        destLocationId: "Source and destination locations cannot be the same.",
      }));
    } else {
      setErrors((p) => ({ ...p, destLocationId: "" }));
    }
  }, [sourceLocationId, destLocationId]);

  function validate() {
    const e: Record<string, string> = {};
    if (!productId) e.productId = "Product is required.";
    if (!sourceLocationId) e.sourceLocationId = "Source location is required.";
    if (!destLocationId) e.destLocationId = "Destination location is required.";
    else if (sourceLocationId === destLocationId)
      e.destLocationId = "Source and destination locations cannot be the same.";
    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0)
      e.quantity = "Quantity must be greater than zero.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const transfer = await createTransfer({
        items: [{ productId, sourceLocationId, destLocationId, quantity: Number(quantity) }],
      });
      toast({ message: `Transfer ${transfer.reference} created!`, type: "success" });
      router.push(`/operations/transfers/${transfer.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create transfer.";
      toast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function clearError(key: string) {
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="New Internal Transfer" description="Move stock between two storage locations." />

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <FormField label="Product" htmlFor="tr-product" error={errors.productId} required>
          <select
            id="tr-product"
            value={productId}
            onChange={(e) => { setProductId(e.target.value); clearError("productId"); }}
            className={selectClass}
          >
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </FormField>

        <FormField label="Source Location" htmlFor="tr-source" error={errors.sourceLocationId} required>
          <select
            id="tr-source"
            value={sourceLocationId}
            onChange={(e) => { setSourceLocationId(e.target.value); clearError("sourceLocationId"); }}
            className={selectClass}
          >
            <option value="">Select source…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.warehouse.name} → {l.name}</option>
            ))}
          </select>
        </FormField>

        {/* Arrow visual */}
        {sourceLocationId && destLocationId && (
          <div className="flex items-center gap-3 py-2 px-4 bg-slate-50 rounded-lg text-sm text-slate-600">
            <span className="font-medium">
              {locations.find((l) => l.id === sourceLocationId)?.name ?? "Source"}
            </span>
            <span className="text-indigo-500 font-bold text-lg">→</span>
            <span className="font-medium">
              {locations.find((l) => l.id === destLocationId)?.name ?? "Destination"}
            </span>
          </div>
        )}

        <FormField
          label="Destination Location"
          htmlFor="tr-dest"
          error={errors.destLocationId}
          required
        >
          <select
            id="tr-dest"
            value={destLocationId}
            onChange={(e) => { setDestLocationId(e.target.value); }}
            className={`${selectClass} ${errors.destLocationId ? "border-red-400" : ""}`}
          >
            <option value="">Select destination…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.warehouse.name} → {l.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Quantity" htmlFor="tr-qty" error={errors.quantity} required>
          <input
            id="tr-qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); clearError("quantity"); }}
            placeholder="e.g. 10"
            className={inputClass}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={loading}>Create transfer</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

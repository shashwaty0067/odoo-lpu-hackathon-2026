"use client";

// ============================================================
// New Stock Adjustment form
// - Fetches current system quantity live on product+location change
// - Shows live delta = countedQty - systemQty before submit
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAdjustment, getProducts, getAllLocations, getSystemQuantity } from "@/lib/api";
import { Product, Location, Warehouse } from "@/lib/types";
import {
  PageHeader, FormField, inputClass, selectClass, PrimaryButton,
} from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

export default function NewAdjustmentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [countedQty, setCountedQty] = useState("");
  const [systemQty, setSystemQty] = useState<number | null>(null);
  const [systemQtyLoading, setSystemQtyLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<(Location & { warehouse: Warehouse })[]>([]);

  useEffect(() => {
    getProducts().then((r) => setProducts(r.data)).catch(() => {});
    getAllLocations().then(setLocations).catch(() => {});
  }, []);

  // Fetch system quantity whenever product + location are both selected
  useEffect(() => {
    if (!productId || !locationId) {
      setSystemQty(null);
      return;
    }
    setSystemQtyLoading(true);
    getSystemQuantity(productId, locationId)
      .then(setSystemQty)
      .catch(() => setSystemQty(null))
      .finally(() => setSystemQtyLoading(false));
  }, [productId, locationId]);

  // Live-computed delta
  const delta =
    systemQty !== null && countedQty !== ""
      ? Number(countedQty) - systemQty
      : null;

  function validate() {
    const e: Record<string, string> = {};
    if (!productId) e.productId = "Product is required.";
    if (!locationId) e.locationId = "Location is required.";
    if (countedQty === "") e.countedQty = "Physical count is required.";
    else if (isNaN(Number(countedQty)) || Number(countedQty) < 0)
      e.countedQty = "Physical count must be ≥ 0.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const adj = await createAdjustment({
        productId,
        locationId,
        countedQuantity: Number(countedQty),
      });
      toast({ message: `Adjustment ${adj.reference} created!`, type: "success" });
      router.push(`/operations/adjustments/${adj.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create adjustment.";
      toast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <div className="max-w-xl">
      <PageHeader
        title="New Stock Adjustment"
        description="Record the physical inventory count and correct the system quantity."
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
          <FormField label="Product" htmlFor="adj-product" error={errors.productId} required>
            <select
              id="adj-product"
              value={productId}
              onChange={(e) => { setProductId(e.target.value); setErrors((p) => ({ ...p, productId: "" })); }}
              className={selectClass}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Location" htmlFor="adj-location" error={errors.locationId} required>
            <select
              id="adj-location"
              value={locationId}
              onChange={(e) => { setLocationId(e.target.value); setErrors((p) => ({ ...p, locationId: "" })); }}
              className={selectClass}
            >
              <option value="">Select location…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.warehouse.name} → {l.name}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* System quantity + counted quantity + live delta */}
        {productId && locationId && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
              Quantity Comparison
            </h2>

            {/* System quantity (fetched automatically) */}
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Current System Quantity
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  What the system currently records for this product at this location
                </p>
              </div>
              {systemQtyLoading ? (
                <div className="w-12 h-6 animate-pulse bg-slate-200 rounded" />
              ) : (
                <span className="text-2xl font-bold text-slate-700">
                  {systemQty ?? 0} {selectedProduct?.unitOfMeasure ?? ""}
                </span>
              )}
            </div>

            {/* Counted quantity input */}
            <FormField
              label="Physical / Counted Quantity"
              htmlFor="adj-counted"
              error={errors.countedQty}
              required
            >
              <input
                id="adj-counted"
                type="number"
                min={0}
                value={countedQty}
                onChange={(e) => { setCountedQty(e.target.value); setErrors((p) => ({ ...p, countedQty: "" })); }}
                placeholder="Enter the physical count you measured"
                className={inputClass}
              />
            </FormField>

            {/* Live delta display */}
            {delta !== null && (
              <div
                className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                  delta === 0
                    ? "bg-emerald-50 border-emerald-200"
                    : delta > 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${delta === 0 ? "text-emerald-600" : delta > 0 ? "text-blue-600" : "text-red-600"}`}>
                    Difference (Counted − System)
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {delta === 0
                      ? "No adjustment needed — counts match!"
                      : delta > 0
                      ? "Stock will be increased by this amount."
                      : "Stock will be decreased by this amount."}
                  </p>
                </div>
                <span
                  className={`text-2xl font-bold ${
                    delta === 0
                      ? "text-emerald-600"
                      : delta > 0
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta} {selectedProduct?.unitOfMeasure ?? ""}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={loading}>
            Create adjustment
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

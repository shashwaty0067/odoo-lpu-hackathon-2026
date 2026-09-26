"use client";

// ============================================================
// Create Receipt page
// Dynamic line items (add/remove rows)
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createReceipt,
  getProducts,
  getAllLocations,
} from "@/lib/api";
import { Product, Location, Warehouse } from "@/lib/types";
import {
  PageHeader,
  FormField,
  inputClass,
  selectClass,
  PrimaryButton,
} from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

interface LineItem {
  productId: string;
  locationId: string;
  quantity: string;
}

export default function NewReceiptPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [supplier, setSupplier] = useState("");
  const [reference, setReference] = useState(
    `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  );
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", locationId: "", quantity: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<(Location & { warehouse: Warehouse })[]>([]);

  useEffect(() => {
    getProducts().then((r) => setProducts(r.data)).catch(() => {});
    getAllLocations().then(setLocations).catch(() => {});
  }, []);

  function addLine() {
    setLines((prev) => [...prev, { productId: "", locationId: "", quantity: "" }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, key: keyof LineItem, val: string) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)));
    setErrors((prev) => ({ ...prev, [`line_${i}_${key}`]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!supplier.trim()) e.supplier = "Supplier is required.";
    if (!reference.trim()) e.reference = "Reference is required.";
    if (lines.length === 0) e.lines = "Add at least one line item.";
    lines.forEach((l, i) => {
      if (!l.productId) e[`line_${i}_productId`] = "Required";
      if (!l.locationId) e[`line_${i}_locationId`] = "Required";
      const qty = Number(l.quantity);
      if (!l.quantity || isNaN(qty) || qty <= 0)
        e[`line_${i}_quantity`] = "Must be > 0";
    });
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const receipt = await createReceipt({
        supplier: supplier.trim(),
        reference: reference.trim(),
        items: lines.map((l) => ({
          productId: l.productId,
          locationId: l.locationId,
          quantity: Number(l.quantity),
        })),
      });
      toast({ message: `Receipt ${receipt.reference} created!`, type: "success" });
      router.push(`/operations/receipts/${receipt.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create receipt.";
      toast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="New Receipt"
        description="Record incoming stock from a supplier."
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
            Header
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Supplier" htmlFor="rec-supplier" error={errors.supplier} required>
              <input
                id="rec-supplier"
                type="text"
                value={supplier}
                onChange={(e) => { setSupplier(e.target.value); setErrors((p) => ({ ...p, supplier: "" })); }}
                placeholder="TechSupply Co."
                className={inputClass}
              />
            </FormField>
            <FormField label="Reference" htmlFor="rec-ref" error={errors.reference} required>
              <input
                id="rec-ref"
                type="text"
                value={reference}
                onChange={(e) => { setReference(e.target.value); setErrors((p) => ({ ...p, reference: "" })); }}
                className={inputClass}
              />
            </FormField>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
              Items
            </h2>
            <button
              type="button"
              onClick={addLine}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Add line
            </button>
          </div>

          {errors.lines && (
            <p className="text-xs text-red-600 mb-3">{errors.lines}</p>
          )}

          <div className="space-y-3">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_100px_auto] gap-2 items-start">
                <div>
                  <select
                    value={line.productId}
                    onChange={(e) => updateLine(i, "productId", e.target.value)}
                    className={`${selectClass} ${errors[`line_${i}_productId`] ? "border-red-400" : ""}`}
                    aria-label={`Line ${i + 1} product`}
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  {errors[`line_${i}_productId`] && (
                    <p className="text-xs text-red-500 mt-0.5">{errors[`line_${i}_productId`]}</p>
                  )}
                </div>
                <div>
                  <select
                    value={line.locationId}
                    onChange={(e) => updateLine(i, "locationId", e.target.value)}
                    className={`${selectClass} ${errors[`line_${i}_locationId`] ? "border-red-400" : ""}`}
                    aria-label={`Line ${i + 1} location`}
                  >
                    <option value="">Select location…</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.warehouse.name} → {l.name}
                      </option>
                    ))}
                  </select>
                  {errors[`line_${i}_locationId`] && (
                    <p className="text-xs text-red-500 mt-0.5">{errors[`line_${i}_locationId`]}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(i, "quantity", e.target.value)}
                    placeholder="Qty"
                    className={`${inputClass} ${errors[`line_${i}_quantity`] ? "border-red-400" : ""}`}
                    aria-label={`Line ${i + 1} quantity`}
                  />
                  {errors[`line_${i}_quantity`] && (
                    <p className="text-xs text-red-500 mt-0.5">{errors[`line_${i}_quantity`]}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="mt-2 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors text-lg leading-none"
                  aria-label="Remove line"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          {/* Submit disabled while request is in flight to prevent double-submission */}
          <PrimaryButton type="submit" loading={loading}>
            Create receipt
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

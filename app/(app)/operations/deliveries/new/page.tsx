"use client";

// ============================================================
// Create Delivery page
// Inline stock validation warning on submit (surfaces exact backend error)
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDelivery, getProducts, getAllLocations } from "@/lib/api-mock";
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

export default function NewDeliveryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState("");
  const [reference, setReference] = useState(
    `DEL-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  );
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", locationId: "", quantity: "" }]);
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
    if (!customer.trim()) e.customer = "Customer is required.";
    if (!reference.trim()) e.reference = "Reference is required.";
    lines.forEach((l, i) => {
      if (!l.productId) e[`line_${i}_productId`] = "Required";
      if (!l.locationId) e[`line_${i}_locationId`] = "Required";
      const qty = Number(l.quantity);
      // Reject non-positive quantities before hitting the server
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
      const delivery = await createDelivery({
        customer: customer.trim(),
        reference: reference.trim(),
        items: lines.map((l) => ({
          productId: l.productId,
          locationId: l.locationId,
          quantity: Number(l.quantity),
        })),
      });
      toast({ message: `Delivery ${delivery.reference} created!`, type: "success" });
      router.push(`/operations/deliveries/${delivery.id}`);
    } catch (err: unknown) {
      // Surface the exact backend message (e.g. "Insufficient stock. Available: 5, requested: 10.")
      const msg = err instanceof Error ? err.message : "Failed to create delivery.";
      toast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="New Delivery Order" description="Schedule outgoing stock to a customer." />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Header</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Customer" htmlFor="del-customer" error={errors.customer} required>
              <input
                id="del-customer"
                type="text"
                value={customer}
                onChange={(e) => { setCustomer(e.target.value); setErrors((p) => ({ ...p, customer: "" })); }}
                placeholder="Acme Corp"
                className={inputClass}
              />
            </FormField>
            <FormField label="Reference" htmlFor="del-ref" error={errors.reference} required>
              <input
                id="del-ref"
                type="text"
                value={reference}
                onChange={(e) => { setReference(e.target.value); setErrors((p) => ({ ...p, reference: "" })); }}
                className={inputClass}
              />
            </FormField>
          </div>
        </div>

        {/* Stock availability info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-2">
          <span>⚠</span>
          <span>
            If a requested quantity exceeds available stock, you will see the exact error
            message (e.g. "Insufficient stock. Available: 5, requested: 10.") after submitting.
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Items</h2>
            <button type="button" onClick={addLine} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              + Add line
            </button>
          </div>

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
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  {errors[`line_${i}_productId`] && <p className="text-xs text-red-500 mt-0.5">{errors[`line_${i}_productId`]}</p>}
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
                      <option key={l.id} value={l.id}>{l.warehouse.name} → {l.name}</option>
                    ))}
                  </select>
                  {errors[`line_${i}_locationId`] && <p className="text-xs text-red-500 mt-0.5">{errors[`line_${i}_locationId`]}</p>}
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
                  {errors[`line_${i}_quantity`] && <p className="text-xs text-red-500 mt-0.5">{errors[`line_${i}_quantity`]}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="mt-2 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={loading}>Create delivery</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

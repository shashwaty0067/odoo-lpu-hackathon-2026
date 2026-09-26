"use client";

// ============================================================
// Products list page
// Server-side query params: ?search=&category=
// Features: search, category filter, new product modal, edit modal,
//           product detail (stock by location), low-stock badge.
// ============================================================

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  getProductStock,
  getWarehouses,
} from "@/lib/api-mock";
import {
  Product,
  Category,
  Stock,
  Location,
  Warehouse,
} from "@/lib/types";
import {
  PageHeader,
  TableSkeleton,
  EmptyState,
  ErrorState,
  Modal,
  FormField,
  inputClass,
  selectClass,
  PrimaryButton,
} from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

// ---- Low stock badge ----
function LowStockBadge({ product }: { product: Product }) {
  if ((product.totalStock ?? 0) === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
        Out of stock
      </span>
    );
  }
  if ((product.totalStock ?? 0) <= product.reorderThreshold) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        ⚠ Low stock
      </span>
    );
  }
  return null;
}

// ---- Stock breakdown modal ----
function StockBreakdownModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<(Stock & { location: Location & { warehouse: Warehouse } })[]>([]);

  useEffect(() => {
    getProductStock(product.id)
      .then(setStocks)
      .finally(() => setLoading(false));
  }, [product.id]);

  return (
    <Modal open onClose={onClose} title={`Stock — ${product.name}`}>
      <div className="p-6">
        <p className="text-sm text-slate-500 mb-4">
          SKU: <span className="font-mono text-slate-700">{product.sku}</span> ·
          Unit: {product.unitOfMeasure} · Reorder at: {product.reorderThreshold}
        </p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-100 h-10 rounded-lg" />
            ))}
          </div>
        ) : stocks.length === 0 ? (
          <EmptyState title="No stock recorded" description="This product has no stock entries yet." />
        ) : (
          <div className="space-y-2">
            {stocks.map((s) => (
              <div
                key={s.locationId}
                className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {s.location.warehouse.name}
                  </p>
                  <p className="text-xs text-slate-500">{s.location.name}</p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    s.quantity === 0
                      ? "text-red-600"
                      : s.quantity <= product.reorderThreshold
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {s.quantity} {product.unitOfMeasure}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-sm text-slate-500">
            Total: <strong className="text-slate-800">{product.totalStock ?? 0} {product.unitOfMeasure}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---- Product form (create / edit) ----
function ProductForm({
  categories,
  initial,
  onSuccess,
  onClose,
}: {
  categories: Category[];
  initial?: Product;
  onSuccess: (p: Product) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    categoryId: initial?.categoryId ?? (categories[0]?.id ?? ""),
    unitOfMeasure: initial?.unitOfMeasure ?? "pcs",
    reorderThreshold: String(initial?.reorderThreshold ?? 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.sku.trim()) e.sku = "SKU is required.";
    // Basic SKU format: alphanumeric + hyphens, 3-20 chars
    else if (!/^[A-Z0-9-]{2,20}$/i.test(form.sku.trim()))
      e.sku = "SKU must be 2-20 characters (letters, numbers, hyphens).";
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.categoryId) e.categoryId = "Category is required.";
    if (!form.unitOfMeasure.trim()) e.unitOfMeasure = "Unit is required.";
    const thresh = Number(form.reorderThreshold);
    if (isNaN(thresh) || thresh < 0)
      e.reorderThreshold = "Reorder threshold must be ≥ 0.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        sku: form.sku.trim().toUpperCase(),
        name: form.name.trim(),
        categoryId: form.categoryId,
        unitOfMeasure: form.unitOfMeasure.trim(),
        reorderThreshold: Number(form.reorderThreshold),
      };
      const result = initial
        ? await updateProduct(initial.id, payload)
        : await createProduct(payload);
      toast({ message: initial ? "Product updated!" : "Product created!", type: "success" });
      onSuccess(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save product.";
      // Surface server errors (e.g. "SKU already exists.") via toast — not raw object
      toast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function f(key: keyof typeof form, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="SKU" htmlFor="prod-sku" error={errors.sku} required>
          <input
            id="prod-sku"
            type="text"
            value={form.sku}
            onChange={(e) => f("sku", e.target.value)}
            placeholder="ELEC-001"
            className={inputClass}
            disabled={!!initial} // SKU is immutable on edit
          />
          {initial && (
            <p className="text-xs text-slate-400 mt-0.5">SKU cannot be changed after creation.</p>
          )}
        </FormField>
        <FormField label="Name" htmlFor="prod-name" error={errors.name} required>
          <input
            id="prod-name"
            type="text"
            value={form.name}
            onChange={(e) => f("name", e.target.value)}
            placeholder="USB-C Hub"
            className={inputClass}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Category" htmlFor="prod-category" error={errors.categoryId} required>
          <select
            id="prod-category"
            value={form.categoryId}
            onChange={(e) => f("categoryId", e.target.value)}
            className={selectClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Unit of Measure" htmlFor="prod-unit" error={errors.unitOfMeasure} required>
          <input
            id="prod-unit"
            type="text"
            value={form.unitOfMeasure}
            onChange={(e) => f("unitOfMeasure", e.target.value)}
            placeholder="pcs / kg / box / ream"
            className={inputClass}
          />
        </FormField>
      </div>
      <FormField
        label="Reorder Threshold"
        htmlFor="prod-threshold"
        error={errors.reorderThreshold}
        required
      >
        <input
          id="prod-threshold"
          type="number"
          min={0}
          value={form.reorderThreshold}
          onChange={(e) => f("reorderThreshold", e.target.value)}
          placeholder="10"
          className={inputClass}
        />
        <p className="text-xs text-slate-400 mt-0.5">
          A low-stock badge appears when total stock ≤ this number.
        </p>
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <PrimaryButton type="submit" loading={loading}>
          {initial ? "Save changes" : "Create product"}
        </PrimaryButton>
      </div>
    </form>
  );
}

// ---- Products table ----
function ProductsContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") ?? "");
  const [pendingSearch, setPendingSearch] = useState(search);

  const [showNewModal, setShowNewModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async (s: string, cat: string) => {
    setLoading(true);
    setError(false);
    try {
      const result = await getProducts({ search: s, category: cat });
      setProducts(result.data);
      setTotal(result.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts(search, categoryFilter);
    // Sync to URL query params
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }, [search, categoryFilter, fetchProducts, router]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(pendingSearch);
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total} product${total !== 1 ? "s" : ""} total`}
        action={
          <PrimaryButton onClick={() => setShowNewModal(true)} id="new-product-button">
            + New Product
          </PrimaryButton>
        }
      />

      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            id="product-search"
            type="search"
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </form>
        <select
          id="product-category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`${selectClass} w-44`}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {(search || categoryFilter) && (
          <button
            onClick={() => { setSearch(""); setPendingSearch(""); setCategoryFilter(""); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Name", "SKU", "Category", "Unit", "Total Stock", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <TableSkeleton rows={6} cols={7} />
            ) : error ? (
              <tr>
                <td colSpan={7}>
                  <ErrorState onRetry={() => fetchProducts(search, categoryFilter)} />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon="📦"
                    title="No products found"
                    description={
                      search
                        ? `No products match "${search}". Try a different search.`
                        : "No products yet — create your first one!"
                    }
                    action={
                      !search ? (
                        <PrimaryButton onClick={() => setShowNewModal(true)}>
                          + New Product
                        </PrimaryButton>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewProduct(product)}
                      className="text-sm font-medium text-indigo-600 hover:underline text-left"
                    >
                      {product.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {product.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {product.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{product.unitOfMeasure}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {product.totalStock ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <LowStockBadge product={product} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewProduct(product)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        View stock
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => setEditProduct(product)}
                        className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New product modal */}
      {showNewModal && (
        <Modal open onClose={() => setShowNewModal(false)} title="New Product">
          <ProductForm
            categories={categories}
            onSuccess={(p) => {
              setProducts((prev) => [p, ...prev]);
              setShowNewModal(false);
            }}
            onClose={() => setShowNewModal(false)}
          />
        </Modal>
      )}

      {/* Edit product modal */}
      {editProduct && (
        <Modal open onClose={() => setEditProduct(null)} title="Edit Product">
          <ProductForm
            categories={categories}
            initial={editProduct}
            onSuccess={(p) => {
              setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
              setEditProduct(null);
            }}
            onClose={() => setEditProduct(null)}
          />
        </Modal>
      )}

      {/* Stock breakdown modal */}
      {viewProduct && (
        <StockBreakdownModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
        />
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading…</div>}>
      <ProductsContent />
    </Suspense>
  );
}

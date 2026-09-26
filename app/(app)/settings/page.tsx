"use client";

// ============================================================
// Settings page
// - Categories management (list / create / rename)
// - RBAC placeholder section
// ============================================================

import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory } from "@/lib/api";
import { Category } from "@/lib/types";
import {
  PageHeader, EmptyState, ErrorState, FormField, inputClass, PrimaryButton,
} from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";

// ---- Category item with inline rename ----
function CategoryRow({
  category,
  onRename,
}: {
  category: Category;
  onRename: (id: string, name: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onRename(category.id, name.trim());
      toast({ message: "Category renamed!", type: "success" });
      setEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rename.";
      toast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 rounded-lg">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setName(category.name); } }}
          className={`${inputClass} flex-1`}
          autoFocus
          aria-label="Rename category"
        />
        <button
          onClick={handleSave}
          disabled={loading || !name.trim()}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setEditing(false); setName(category.name); }}
          className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-indigo-400" />
        <span className="text-sm font-medium text-slate-700">{category.name}</span>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
        aria-label={`Rename ${category.name}`}
      >
        Rename
      </button>
    </div>
  );
}

// ---- Add category form ----
function AddCategoryForm({ onAdd }: { onAdd: (c: Category) => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Category name is required."); return; }
    setError("");
    setLoading(true);
    try {
      const newCat = await createCategory({ name: name.trim() });
      toast({ message: `Category "${newCat.name}" created!`, type: "success" });
      onAdd(newCat);
      setName("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category.";
      toast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex gap-2 items-end mt-4">
      <FormField label="New category name" htmlFor="new-category" error={error} required>
        <input
          id="new-category"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Packaging Materials"
          className={inputClass}
        />
      </FormField>
      <PrimaryButton type="submit" loading={loading} className="mb-0 shrink-0">
        + Add
      </PrimaryButton>
    </form>
  );
}

// ---- Main settings page ----
export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRename(id: string, name: string) {
    const updated = await updateCategory(id, { name });
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Manage application-wide settings." />

      {/* Categories section */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Product Categories</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Categories are used to group products. Renaming a category affects all products in it.
          </p>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-slate-100 h-10 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <ErrorState onRetry={load} />
          ) : categories.length === 0 ? (
            <EmptyState title="No categories yet" description="Add your first product category below." />
          ) : (
            <div className="space-y-1">
              {categories.map((c) => (
                <CategoryRow key={c.id} category={c} onRename={handleRename} />
              ))}
            </div>
          )}

          <AddCategoryForm
            onAdd={(c) => setCategories((prev) => [...prev, c])}
          />
        </div>
      </div>

      {/* RBAC placeholder */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Role-Based Permissions</h2>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span className="text-2xl">🔐</span>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Role-based permissions are planned for a future version.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                In the current MVP, all authenticated users have full access. Role management
                (Admin / Staff / Viewer) will be implemented when the backend authentication
                system is configured.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

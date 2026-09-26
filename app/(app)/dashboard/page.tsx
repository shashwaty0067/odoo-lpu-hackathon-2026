"use client";

// ============================================================
// Dashboard — KPI cards + recent activity table
// Fetches live from mock API (real backend can be dropped in).
// Supports filters that trigger a refetch, not DOM hiding.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getDashboardKpis,
  getRecentActivity,
  getCategories,
  getWarehouses,
} from "@/lib/api";
import { DashboardKpis, DashboardFilters, RecentActivity, Category, Warehouse } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  KpiSkeleton,
  TableSkeleton,
  EmptyState,
  ErrorState,
  PageHeader,
  selectClass,
} from "@/components/ui/shared";

// ---- KPI Card ----
function KpiCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ---- Filter bar ----
function FilterBar({
  filters,
  onChange,
  categories,
  warehouses,
}: {
  filters: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
  categories: Category[];
  warehouses: Warehouse[];
}) {
  return (
    <div className="flex flex-wrap gap-3 bg-white border border-slate-100 rounded-xl p-4 mb-6 shadow-sm">
      <select
        id="filter-doc-type"
        value={filters.docType ?? ""}
        onChange={(e) => onChange({ ...filters, docType: e.target.value || undefined })}
        className={`${selectClass} w-40`}
        aria-label="Filter by document type"
      >
        <option value="">All types</option>
        <option value="Receipt">Receipt</option>
        <option value="Delivery">Delivery</option>
        <option value="Transfer">Transfer</option>
        <option value="Adjustment">Adjustment</option>
      </select>

      <select
        id="filter-status"
        value={filters.status ?? ""}
        onChange={(e) =>
          onChange({ ...filters, status: (e.target.value as DashboardFilters["status"]) || undefined })
        }
        className={`${selectClass} w-36`}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="Draft">Draft</option>
        <option value="Waiting">Waiting</option>
        <option value="Ready">Ready</option>
        <option value="Done">Done</option>
        <option value="Canceled">Canceled</option>
      </select>

      <select
        id="filter-warehouse"
        value={filters.warehouseId ?? ""}
        onChange={(e) => onChange({ ...filters, warehouseId: e.target.value || undefined })}
        className={`${selectClass} w-44`}
        aria-label="Filter by warehouse"
      >
        <option value="">All warehouses</option>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>

      <select
        id="filter-category"
        value={filters.categoryId ?? ""}
        onChange={(e) => onChange({ ...filters, categoryId: e.target.value || undefined })}
        className={`${selectClass} w-44`}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        onClick={() => onChange({})}
        className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}

// ---- Recent activity row ----
function ActivityRow({ item }: { item: RecentActivity }) {
  const typeHref: Record<RecentActivity["type"], string> = {
    Receipt: "/operations/receipts",
    Delivery: "/operations/deliveries",
    Transfer: "/operations/transfers",
    Adjustment: "/operations/adjustments",
  };
  const typeColor: Record<RecentActivity["type"], string> = {
    Receipt: "bg-emerald-50 text-emerald-700",
    Delivery: "bg-red-50 text-red-700",
    Transfer: "bg-blue-50 text-blue-700",
    Adjustment: "bg-amber-50 text-amber-700",
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor[item.type]}`}>
          {item.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`${typeHref[item.type]}/${item.id}`}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          {item.reference}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
        {item.description}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
        {new Date(item.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
    </tr>
  );
}

// ---- Main dashboard page ----
export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [kpiError, setKpiError] = useState(false);
  const [activityError, setActivityError] = useState(false);

  const fetchKpis = useCallback(async (f: DashboardFilters) => {
    setKpiLoading(true);
    setKpiError(false);
    try {
      const data = await getDashboardKpis(f);
      setKpis(data);
    } catch {
      setKpiError(true);
    } finally {
      setKpiLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError(false);
    try {
      const data = await getRecentActivity();
      setActivity(data);
    } catch {
      setActivityError(true);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpis(filters);
    // Activity doesn't change with filters in this MVP (backend can wire that up)
    fetchActivity();
    getCategories().then(setCategories).catch(() => {});
    getWarehouses().then(setWarehouses).catch(() => {});
  }, [fetchKpis, fetchActivity, filters]);

  // When filters change, refetch KPIs from the server
  function handleFilterChange(f: DashboardFilters) {
    setFilters(f);
  }

  const filteredActivity = activity.filter((a) => {
    if (filters.docType && a.type !== filters.docType) return false;
    if (filters.status && a.status !== filters.status) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your inventory operations."
      />

      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        categories={categories}
        warehouses={warehouses}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {kpiLoading ? (
          Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : kpiError ? (
          <div className="col-span-full">
            <ErrorState
              message="Could not load KPI data."
              onRetry={() => fetchKpis(filters)}
            />
          </div>
        ) : kpis ? (
          <>
            <KpiCard
              label="In Stock"
              value={kpis.totalProductsInStock}
              icon="📦"
              color="text-slate-800"
              href="/products"
            />
            <KpiCard
              label="Low Stock"
              value={kpis.lowStockCount}
              icon="⚠️"
              color="text-amber-600"
              href="/products?filter=low"
            />
            <KpiCard
              label="Out of Stock"
              value={kpis.outOfStockCount}
              icon="❌"
              color="text-red-600"
              href="/products?filter=out"
            />
            <KpiCard
              label="Pending Receipts"
              value={kpis.pendingReceipts}
              icon="📥"
              color="text-blue-600"
              href="/operations/receipts?status=Draft"
            />
            <KpiCard
              label="Pending Deliveries"
              value={kpis.pendingDeliveries}
              icon="📤"
              color="text-indigo-600"
              href="/operations/deliveries?status=Draft"
            />
            <KpiCard
              label="Transfers Scheduled"
              value={kpis.pendingTransfers}
              icon="🔄"
              color="text-purple-600"
              href="/operations/transfers?status=Draft"
            />
          </>
        ) : null}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
          <span className="text-xs text-slate-400">
            {!activityLoading && `${filteredActivity.length} operation${filteredActivity.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Reference</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activityLoading ? (
                <TableSkeleton rows={6} cols={5} />
              ) : activityError ? (
                <tr>
                  <td colSpan={5}>
                    <ErrorState onRetry={fetchActivity} />
                  </td>
                </tr>
              ) : filteredActivity.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon="📋"
                      title="No activity yet"
                      description="Operations you create will appear here."
                    />
                  </td>
                </tr>
              ) : (
                filteredActivity.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

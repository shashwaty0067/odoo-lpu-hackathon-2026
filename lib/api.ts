// ============================================================
// lib/api.ts
//
// Public API surface for StockSense components.
// All UI components import functions from HERE.
//
// This file now calls the real Next.js API routes instead of
// the mock implementation. The function signatures are identical
// to the previous mock exports so zero page changes are needed.
// ============================================================

import type {
  DashboardKpis,
  DashboardFilters,
  PaginatedResult,
  Product,
  ProductSearchParams,
  Warehouse,
  Location,
  Receipt,
  ReceiptItem,
  ReceiptFilters,
  Delivery,
  DeliveryFilters,
  InternalTransfer,
  TransferFilters,
  StockAdjustment,
  AdjustmentFilters,
  StockLedgerEntry,
  LedgerFilters,
  Category,
  RecentActivity,
  Stock,
} from "./types";

// ---- Utility ----
function buildQs(params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboardKpis(_filters?: DashboardFilters): Promise<DashboardKpis> {
  return apiFetch<DashboardKpis>("/api/dashboard");
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const result = await apiFetch<{ data: RecentActivity[] }>("/api/history?pageSize=20");
  return result.data;
}

// ============================================================
// CATEGORIES
// ============================================================

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/api/categories");
}

export async function createCategory(data: { name: string }): Promise<Category> {
  return apiFetch<Category>("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: { name: string }): Promise<Category> {
  return apiFetch<Category>(`/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ============================================================
// PRODUCTS
// ============================================================

export async function getProducts(params?: ProductSearchParams): Promise<PaginatedResult<Product>> {
  return apiFetch<PaginatedResult<Product>>(
    `/api/products${buildQs({
      search: params?.search,
      category: params?.category,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`
  );
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    return await apiFetch<Product>(`/api/products/${id}`);
  } catch {
    return null;
  }
}

export async function getProductStock(
  productId: string
): Promise<(Stock & { location: Location & { warehouse: Warehouse } })[]> {
  const stocks = await apiFetch<(Stock & { location: Location & { warehouse: Warehouse } })[]>(
    `/api/stock?productId=${productId}`
  );
  return stocks;
}

export async function createProduct(data: {
  sku: string;
  name: string;
  categoryId: string;
  unitOfMeasure: string;
  reorderThreshold: number;
}): Promise<Product> {
  return apiFetch<Product>("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "totalStock">>
): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ============================================================
// WAREHOUSES
// ============================================================

export async function getWarehouses(): Promise<Warehouse[]> {
  return apiFetch<Warehouse[]>("/api/warehouses");
}

export async function createWarehouse(data: { name: string; code?: string }): Promise<Warehouse> {
  // Derive a code from the name if not provided
  const code = data.code ?? data.name.toUpperCase().replace(/\s+/g, "-").slice(0, 10);
  return apiFetch<Warehouse>("/api/warehouses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, code }),
  });
}

export async function createLocation(
  warehouseId: string,
  data: { name: string; code?: string }
): Promise<Location> {
  const code = data.code ?? data.name.toUpperCase().replace(/\s+/g, "-").slice(0, 10);
  return apiFetch<Location>("/api/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ warehouseId, name: data.name, code }),
  });
}

export async function getAllLocations(): Promise<(Location & { warehouse: Warehouse })[]> {
  return apiFetch<(Location & { warehouse: Warehouse })[]>("/api/locations");
}

// ============================================================
// RECEIPTS
// ============================================================

export async function getReceipts(filters?: ReceiptFilters): Promise<PaginatedResult<Receipt>> {
  return apiFetch<PaginatedResult<Receipt>>(
    `/api/receipts${buildQs({ status: filters?.status, page: filters?.page, pageSize: filters?.pageSize })}`
  );
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  try {
    return await apiFetch<Receipt>(`/api/receipts/${id}`);
  } catch {
    return null;
  }
}

export async function createReceipt(data: {
  supplier: string;
  reference: string;
  items: { productId: string; locationId: string; quantity: number }[];
}): Promise<Receipt> {
  // The API expects a single locationId (destination) on the header.
  // Use the first item's locationId as the destination.
  const locationId = data.items[0]?.locationId;
  return apiFetch<Receipt>("/api/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      supplier: data.supplier,
      reference: data.reference,
      locationId,
      items: data.items,
    }),
  });
}

export async function addReceiptItem(
  receiptId: string,
  item: { productId: string; locationId: string; quantity: number }
): Promise<ReceiptItem> {
  // Not a dedicated endpoint — this stub exists for API compatibility.
  // The frontend currently creates receipts with all items at once.
  throw new Error("addReceiptItem: use createReceipt with all items");
}

export async function validateReceipt(id: string): Promise<Receipt> {
  return apiFetch<Receipt>(`/api/receipts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "validate" }),
  });
}

export async function cancelReceipt(id: string): Promise<Receipt> {
  return apiFetch<Receipt>(`/api/receipts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel" }),
  });
}

// ============================================================
// DELIVERIES
// ============================================================

export async function getDeliveries(filters?: DeliveryFilters): Promise<PaginatedResult<Delivery>> {
  return apiFetch<PaginatedResult<Delivery>>(
    `/api/deliveries${buildQs({ status: filters?.status, page: filters?.page, pageSize: filters?.pageSize })}`
  );
}

export async function getDelivery(id: string): Promise<Delivery | null> {
  try {
    return await apiFetch<Delivery>(`/api/deliveries/${id}`);
  } catch {
    return null;
  }
}

export async function createDelivery(data: {
  customer: string;
  reference: string;
  items: { productId: string; locationId: string; quantity: number }[];
}): Promise<Delivery> {
  const locationId = data.items[0]?.locationId;
  return apiFetch<Delivery>("/api/deliveries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: data.customer,
      reference: data.reference,
      locationId,
      items: data.items,
    }),
  });
}

export async function validateDelivery(id: string): Promise<Delivery> {
  return apiFetch<Delivery>(`/api/deliveries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "validate" }),
  });
}

export async function cancelDelivery(id: string): Promise<Delivery> {
  return apiFetch<Delivery>(`/api/deliveries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel" }),
  });
}

// ============================================================
// INTERNAL TRANSFERS
// ============================================================

export async function getTransfers(
  filters?: TransferFilters
): Promise<PaginatedResult<InternalTransfer>> {
  return apiFetch<PaginatedResult<InternalTransfer>>(
    `/api/transfers${buildQs({ status: filters?.status, page: filters?.page, pageSize: filters?.pageSize })}`
  );
}

export async function getTransfer(id: string): Promise<InternalTransfer | null> {
  try {
    return await apiFetch<InternalTransfer>(`/api/transfers/${id}`);
  } catch {
    return null;
  }
}

export async function createTransfer(data: {
  items: {
    productId: string;
    sourceLocationId: string;
    destLocationId: string;
    quantity: number;
  }[];
}): Promise<InternalTransfer> {
  // Generate a reference on the client side (server will reject duplicates)
  const ref = `TRF-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  const first = data.items[0];
  return apiFetch<InternalTransfer>("/api/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: ref,
      sourceLocationId: first?.sourceLocationId,
      destLocationId: first?.destLocationId,
      items: data.items,
    }),
  });
}

export async function validateTransfer(id: string): Promise<InternalTransfer> {
  return apiFetch<InternalTransfer>(`/api/transfers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "validate" }),
  });
}

// ============================================================
// STOCK ADJUSTMENTS
// ============================================================

export async function getAdjustments(
  filters?: AdjustmentFilters
): Promise<PaginatedResult<StockAdjustment>> {
  return apiFetch<PaginatedResult<StockAdjustment>>(
    `/api/adjustments${buildQs({ status: filters?.status, page: filters?.page, pageSize: filters?.pageSize })}`
  );
}

export async function getAdjustment(id: string): Promise<StockAdjustment | null> {
  try {
    return await apiFetch<StockAdjustment>(`/api/adjustments/${id}`);
  } catch {
    return null;
  }
}

export async function getSystemQuantity(productId: string, locationId: string): Promise<number> {
  const result = await apiFetch<{ quantity: number }>(
    `/api/stock/quantity?productId=${productId}&locationId=${locationId}`
  );
  return result.quantity;
}

export async function createAdjustment(data: {
  productId: string;
  locationId: string;
  countedQuantity: number;
}): Promise<StockAdjustment> {
  const ref = `ADJ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  return apiFetch<StockAdjustment>("/api/adjustments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: ref,
      productId: data.productId,
      locationId: data.locationId,
      countedQuantity: data.countedQuantity,
    }),
  });
}

export async function validateAdjustment(id: string): Promise<StockAdjustment> {
  return apiFetch<StockAdjustment>(`/api/adjustments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "validate" }),
  });
}

// ============================================================
// STOCK LEDGER
// ============================================================

export async function getStockLedger(
  filters?: LedgerFilters
): Promise<PaginatedResult<StockLedgerEntry>> {
  return apiFetch<PaginatedResult<StockLedgerEntry>>(
    `/api/ledger${buildQs({
      productId: filters?.productId,
      locationId: filters?.locationId,
      operationType: filters?.operationType,
      dateFrom: filters?.dateFrom,
      dateTo: filters?.dateTo,
      page: filters?.page,
      pageSize: filters?.pageSize,
    })}`
  );
}

// ============================================================
// AUTH (keep stub implementations — real auth uses next-auth)
// ============================================================

export async function signUp(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function requestPasswordResetOtp(
  _email: string
): Promise<{ success: boolean }> {
  // TODO: implement OTP-based reset when email service is configured
  return { success: true };
}

export async function verifyOtpAndResetPassword(
  _email: string,
  _otp: string,
  _newPassword: string
): Promise<{ success: boolean }> {
  // TODO: implement OTP-based reset when email service is configured
  return { success: true };
}

export async function updateProfile(data: {
  name: string;
  email: string;
}): Promise<{ success: boolean }> {
  // TODO: wire to session-aware profile update endpoint
  console.log("updateProfile (stub)", data);
  return { success: true };
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  if (data.currentPassword === data.newPassword) {
    throw new Error("New password must be different from your current password.");
  }
  // TODO: wire to session-aware password change endpoint
  return { success: true };
}

// Also re-export all types for convenience
export type {
  User,
  Category,
  Product,
  Warehouse,
  Location,
  Stock,
  Receipt,
  ReceiptItem,
  Delivery,
  DeliveryItem,
  InternalTransfer,
  InternalTransferItem,
  StockAdjustment,
  StockLedgerEntry,
  DashboardKpis,
  DashboardFilters,
  PaginatedResult,
  ProductSearchParams,
  ReceiptFilters,
  DeliveryFilters,
  TransferFilters,
  AdjustmentFilters,
  LedgerFilters,
  RecentActivity,
  DocumentStatus,
  OperationType,
  UserRole,
} from "./types";

// ============================================================
// StockSense — Shared TypeScript types
// These mirror the Prisma schema exactly so components and
// mock/real API functions share a single source of truth.
// ============================================================

export type UserRole = "ADMIN" | "STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string; // ISO date string
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  category?: Category;
  unitOfMeasure: string;
  reorderThreshold: number;
  totalStock?: number; // computed: sum of Stock across all locations
}

export interface Warehouse {
  id: string;
  name: string;
  locations?: Location[];
}

export interface Location {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  name: string;
}

export interface Stock {
  productId: string;
  locationId: string;
  location?: Location;
  quantity: number;
}

// ---- Document statuses ----
export type DocumentStatus = "Draft" | "Waiting" | "Ready" | "Done" | "Canceled";

// ---- Receipts ----
export interface ReceiptItem {
  id: string;
  receiptId: string;
  productId: string;
  product?: Product;
  locationId: string;
  location?: Location;
  quantity: number;
}

export interface Receipt {
  id: string;
  reference: string;
  supplier: string;
  status: DocumentStatus;
  items: ReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

// ---- Deliveries ----
export interface DeliveryItem {
  id: string;
  deliveryId: string;
  productId: string;
  product?: Product;
  locationId: string;
  location?: Location;
  quantity: number;
}

export interface Delivery {
  id: string;
  reference: string;
  customer: string;
  status: DocumentStatus;
  items: DeliveryItem[];
  createdAt: string;
  updatedAt: string;
}

// ---- Internal Transfers ----
export interface InternalTransferItem {
  id: string;
  transferId: string;
  productId: string;
  product?: Product;
  sourceLocationId: string;
  sourceLocation?: Location;
  destLocationId: string;
  destLocation?: Location;
  quantity: number;
}

export interface InternalTransfer {
  id: string;
  reference: string;
  status: DocumentStatus;
  items: InternalTransferItem[];
  createdAt: string;
  updatedAt: string;
}

// ---- Stock Adjustments ----
export interface StockAdjustment {
  id: string;
  reference: string;
  productId: string;
  product?: Product;
  locationId: string;
  location?: Location;
  systemQuantity: number;
  countedQuantity: number;
  delta: number; // countedQuantity - systemQuantity
  status: DocumentStatus;
  performedById: string;
  performedBy?: User;
  createdAt: string;
}

// ---- Stock Ledger ----
export type OperationType = "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";

export interface StockLedgerEntry {
  id: string;
  productId: string;
  product?: Product;
  operationType: OperationType;
  quantity: number; // positive for in, negative for out
  sourceLocationId?: string;
  sourceLocation?: Location;
  destLocationId?: string;
  destLocation?: Location;
  referenceType: string;
  referenceId: string;
  performedById: string;
  performedBy?: User;
  createdAt: string;
}

// ---- API Payloads ----
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardKpis {
  totalProductsInStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingTransfers: number;
}

export interface DashboardFilters {
  docType?: string;
  status?: DocumentStatus;
  warehouseId?: string;
  categoryId?: string;
}

export interface ProductSearchParams {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface ReceiptFilters {
  status?: DocumentStatus;
  page?: number;
  pageSize?: number;
}

export interface DeliveryFilters {
  status?: DocumentStatus;
  page?: number;
  pageSize?: number;
}

export interface TransferFilters {
  status?: DocumentStatus;
  page?: number;
  pageSize?: number;
}

export interface AdjustmentFilters {
  status?: DocumentStatus;
  page?: number;
  pageSize?: number;
}

export interface LedgerFilters {
  productId?: string;
  locationId?: string;
  operationType?: OperationType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ---- Recent Activity ----
export interface RecentActivity {
  id: string;
  type: "Receipt" | "Delivery" | "Transfer" | "Adjustment";
  reference: string;
  status: DocumentStatus;
  createdAt: string;
  description: string;
}

// ---- API Error shape ----
export interface ApiError {
  message: string;
  code?: string;
}

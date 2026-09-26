// ============================================================
// lib/api.ts
//
// Public API surface for StockSense components.
// All UI components import functions from HERE — never from
// lib/api-mock.ts or lib/mock-data.ts directly.
//
// TODO: When the real backend is ready, replace the bodies of
// these functions with actual fetch/Server Action calls.
// The function names, parameters, and return types must stay
// identical so zero changes are needed in any component.
// ============================================================

// Re-export all mock implementations under the canonical names.
// When the backend is ready, swap out these re-exports for real implementations:
//
//   import { db } from "./db";
//   export async function getProducts(params?) { return db.product.findMany(...) }
//

export {
  // Dashboard
  getDashboardKpis,
  getRecentActivity,

  // Products
  getProducts,
  getProduct,
  getProductStock,
  createProduct,
  updateProduct,

  // Warehouses
  getWarehouses,
  createWarehouse,
  createLocation,
  getAllLocations,

  // Receipts
  getReceipts,
  getReceipt,
  createReceipt,
  addReceiptItem,
  validateReceipt,
  cancelReceipt,

  // Deliveries
  getDeliveries,
  getDelivery,
  createDelivery,
  validateDelivery,
  cancelDelivery,

  // Internal Transfers
  getTransfers,
  getTransfer,
  createTransfer,
  validateTransfer,

  // Stock Adjustments
  getAdjustments,
  getAdjustment,
  getSystemQuantity,
  createAdjustment,
  validateAdjustment,

  // Stock Ledger / Move History
  getStockLedger,

  // Categories
  getCategories,
  createCategory,
  updateCategory,

  // Auth
  signUp,
  requestPasswordResetOtp,
  verifyOtpAndResetPassword,
  updateProfile,
  changePassword,
} from "./api-mock";

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

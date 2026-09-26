// lib/mappers.ts
// Maps Prisma model records → frontend TypeScript types (lib/types.ts)
// The Prisma schema uses different field names / enum values than the
// frontend types, so every API route MUST pass records through here.

import type {
  Category as PrismaCategory,
  Product as PrismaProduct,
  Warehouse as PrismaWarehouse,
  Location as PrismaLocation,
  Stock as PrismaStock,
  Receipt as PrismaReceipt,
  ReceiptItem as PrismaReceiptItem,
  Delivery as PrismaDelivery,
  DeliveryItem as PrismaDeliveryItem,
  Transfer as PrismaTransfer,
  TransferItem as PrismaTransferItem,
  Adjustment as PrismaAdjustment,
  AdjustmentItem as PrismaAdjustmentItem,
  StockLedger as PrismaStockLedger,
  User as PrismaUser,
} from "@prisma/client";

import type {
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
  User,
  DocumentStatus,
  OperationType,
} from "./types";

// ---- Status enums --------------------------------------------------------
// Prisma uses DRAFT / CONFIRMED / CANCELLED
// Frontend types use  Draft / Done    / Canceled

export function toFrontendStatus(s: string): DocumentStatus {
  switch (s) {
    case "DRAFT":
      return "Draft";
    case "CONFIRMED":
      return "Done";
    case "CANCELLED":
      return "Canceled";
    default:
      return "Draft";
  }
}

export function toPrismaStatus(s: DocumentStatus): string {
  switch (s) {
    case "Draft":
      return "DRAFT";
    case "Done":
      return "CONFIRMED";
    case "Canceled":
      return "CANCELLED";
    // Waiting / Ready have no DB equivalent — treat as DRAFT
    default:
      return "DRAFT";
  }
}

// ---- Ledger operation type -----------------------------------------------
// Prisma: RECEIPT | DELIVERY | TRANSFER_IN | TRANSFER_OUT | ADJUSTMENT_IN | ADJUSTMENT_OUT
// Frontend: RECEIPT | DELIVERY | TRANSFER | ADJUSTMENT

export function toFrontendOperationType(t: string): OperationType {
  if (t === "RECEIPT") return "RECEIPT";
  if (t === "DELIVERY") return "DELIVERY";
  if (t === "TRANSFER_IN" || t === "TRANSFER_OUT") return "TRANSFER";
  if (t === "ADJUSTMENT_IN" || t === "ADJUSTMENT_OUT") return "ADJUSTMENT";
  return "RECEIPT";
}

// ---- User ----------------------------------------------------------------
export function mapUser(u: PrismaUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as User["role"],
    createdAt: u.createdAt.toISOString(),
  };
}

// ---- Category ------------------------------------------------------------
export function mapCategory(c: PrismaCategory): Category {
  return { id: c.id, name: c.name };
}

// ---- Product -------------------------------------------------------------
type PrismaProductWithRelations = PrismaProduct & {
  category?: PrismaCategory | null;
  stocks?: PrismaStock[];
};

export function mapProduct(p: PrismaProductWithRelations): Product {
  const totalStock =
    p.stocks !== undefined
      ? p.stocks.reduce((sum, s) => sum + s.quantity, 0)
      : undefined;
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    categoryId: p.categoryId,
    category: p.category ? mapCategory(p.category) : undefined,
    unitOfMeasure: p.unit,           // DB: unit  →  frontend: unitOfMeasure
    reorderThreshold: p.reorderThreshold,
    totalStock,
  };
}

// ---- Warehouse -----------------------------------------------------------
type PrismaWarehouseWithLocations = PrismaWarehouse & {
  locations?: PrismaLocation[];
};

export function mapWarehouse(w: PrismaWarehouseWithLocations): Warehouse {
  return {
    id: w.id,
    name: w.name,
    locations: w.locations?.map(mapLocation),
  };
}

// ---- Location ------------------------------------------------------------
type PrismaLocationWithWarehouse = PrismaLocation & {
  warehouse?: PrismaWarehouse | null;
};

export function mapLocation(l: PrismaLocationWithWarehouse): Location {
  return {
    id: l.id,
    warehouseId: l.warehouseId,
    name: l.name,
    warehouse: l.warehouse ? mapWarehouse(l.warehouse) : undefined,
  };
}

// ---- Stock ---------------------------------------------------------------
type PrismaStockWithRelations = PrismaStock & {
  location?: PrismaLocationWithWarehouse | null;
};

export function mapStock(s: PrismaStockWithRelations): Stock {
  return {
    productId: s.productId,
    locationId: s.locationId,
    quantity: s.quantity,
    location: s.location ? mapLocation(s.location) : undefined,
  };
}

// ---- Receipt -------------------------------------------------------------
type PrismaReceiptWithRelations = PrismaReceipt & {
  items: (PrismaReceiptItem & {
    product?: PrismaProductWithRelations | null;
  })[];
  destinationLocation?: PrismaLocationWithWarehouse | null;
};

export function mapReceipt(r: PrismaReceiptWithRelations): Receipt {
  return {
    id: r.id,
    reference: r.referenceNumber,   // DB: referenceNumber → frontend: reference
    supplier: r.supplierName ?? "", // DB: supplierName    → frontend: supplier
    status: toFrontendStatus(r.status),
    items: r.items.map((item) => ({
      id: item.id,
      receiptId: item.receiptId,
      productId: item.productId,
      product: item.product ? mapProduct(item.product) : undefined,
      // Receipt items in the DB don't have per-item locationId; the receipt
      // itself has a destinationLocationId. We expose it on every item so the
      // frontend (which expects locationId per item) keeps working.
      locationId: r.destinationLocationId,
      location: r.destinationLocation
        ? mapLocation(r.destinationLocation)
        : undefined,
      quantity: item.quantity,
    })),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ---- Delivery ------------------------------------------------------------
type PrismaDeliveryWithRelations = PrismaDelivery & {
  items: (PrismaDeliveryItem & {
    product?: PrismaProductWithRelations | null;
  })[];
  sourceLocation?: PrismaLocationWithWarehouse | null;
};

export function mapDelivery(d: PrismaDeliveryWithRelations): Delivery {
  return {
    id: d.id,
    reference: d.referenceNumber,
    customer: d.customerName ?? "",
    status: toFrontendStatus(d.status),
    items: d.items.map((item) => ({
      id: item.id,
      deliveryId: item.deliveryId,
      productId: item.productId,
      product: item.product ? mapProduct(item.product) : undefined,
      locationId: d.sourceLocationId,
      location: d.sourceLocation ? mapLocation(d.sourceLocation) : undefined,
      quantity: item.quantity,
    })),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

// ---- Internal Transfer ---------------------------------------------------
type PrismaTransferWithRelations = PrismaTransfer & {
  items: (PrismaTransferItem & {
    product?: PrismaProductWithRelations | null;
  })[];
  sourceLocation?: PrismaLocationWithWarehouse | null;
  destinationLocation?: PrismaLocationWithWarehouse | null;
};

export function mapTransfer(t: PrismaTransferWithRelations): InternalTransfer {
  return {
    id: t.id,
    reference: t.referenceNumber,
    status: toFrontendStatus(t.status),
    items: t.items.map((item) => ({
      id: item.id,
      transferId: item.transferId,
      productId: item.productId,
      product: item.product ? mapProduct(item.product) : undefined,
      sourceLocationId: t.sourceLocationId,
      sourceLocation: t.sourceLocation
        ? mapLocation(t.sourceLocation)
        : undefined,
      destLocationId: t.destinationLocationId,
      destLocation: t.destinationLocation
        ? mapLocation(t.destinationLocation)
        : undefined,
      quantity: item.quantity,
    })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// ---- Stock Adjustment ----------------------------------------------------
type PrismaAdjustmentWithRelations = PrismaAdjustment & {
  items: (PrismaAdjustmentItem & {
    product?: PrismaProductWithRelations | null;
  })[];
  location?: PrismaLocationWithWarehouse | null;
  createdBy?: PrismaUser | null;
};

export function mapAdjustment(a: PrismaAdjustmentWithRelations): StockAdjustment {
  // The Prisma Adjustment model is header-level (single location + reason).
  // Each AdjustmentItem has a productId, quantity, and type (INCREASE/DECREASE).
  // The frontend StockAdjustment type is per-product, so we use the first item.
  const firstItem = a.items[0];
  const systemQty = 0; // we don't store systemQty in DB; set to 0 as baseline
  const countedQty = firstItem
    ? firstItem.type === "DECREASE"
      ? 0 - firstItem.quantity // treated as reduction
      : firstItem.quantity
    : 0;
  const delta = countedQty - systemQty;

  return {
    id: a.id,
    reference: a.referenceNumber,
    productId: firstItem?.productId ?? "",
    product: firstItem?.product ? mapProduct(firstItem.product) : undefined,
    locationId: a.locationId,
    location: a.location ? mapLocation(a.location) : undefined,
    systemQuantity: systemQty,
    countedQuantity: countedQty,
    delta,
    status: toFrontendStatus(a.status),
    performedById: a.createdById,
    performedBy: a.createdBy ? mapUser(a.createdBy) : undefined,
    createdAt: a.createdAt.toISOString(),
  };
}

// ---- Stock Ledger Entry --------------------------------------------------
type PrismaStockLedgerWithRelations = PrismaStockLedger & {
  product?: PrismaProductWithRelations | null;
  location?: PrismaLocationWithWarehouse | null;
  performedBy?: PrismaUser | null;
};

export function mapLedgerEntry(
  e: PrismaStockLedgerWithRelations
): StockLedgerEntry {
  return {
    id: e.id,
    productId: e.productId,
    product: e.product ? mapProduct(e.product) : undefined,
    operationType: toFrontendOperationType(e.operationType),
    quantity: e.quantityChange, // DB: quantityChange → frontend: quantity
    // For RECEIPT / ADJUSTMENT_IN: destination = the location
    // For DELIVERY / ADJUSTMENT_OUT: source = the location
    // For TRANSFER_IN: destination; TRANSFER_OUT: source
    sourceLocationId:
      ["DELIVERY", "TRANSFER_OUT", "ADJUSTMENT_OUT"].includes(e.operationType)
        ? e.locationId
        : undefined,
    sourceLocation:
      ["DELIVERY", "TRANSFER_OUT", "ADJUSTMENT_OUT"].includes(e.operationType) &&
      e.location
        ? mapLocation(e.location)
        : undefined,
    destLocationId:
      ["RECEIPT", "TRANSFER_IN", "ADJUSTMENT_IN"].includes(e.operationType)
        ? e.locationId
        : undefined,
    destLocation:
      ["RECEIPT", "TRANSFER_IN", "ADJUSTMENT_IN"].includes(e.operationType) &&
      e.location
        ? mapLocation(e.location)
        : undefined,
    referenceType: e.referenceType ?? "",
    referenceId: e.referenceId ?? "",
    performedById: e.performedById ?? "",
    performedBy: e.performedBy ? mapUser(e.performedBy) : undefined,
    createdAt: e.createdAt.toISOString(),
  };
}

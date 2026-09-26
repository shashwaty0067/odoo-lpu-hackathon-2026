// ============================================================
// lib/mock-data.ts
//
// Centralised mock seed data for StockSense.
// All mock API functions (lib/api.ts) read from these arrays.
// Do NOT import this file in components — always go through lib/api.ts.
//
// TODO: Remove this file when the real backend is connected.
// ============================================================

import {
  Category,
  Product,
  Warehouse,
  Location,
  Stock,
  Receipt,
  Delivery,
  InternalTransfer,
  StockAdjustment,
  StockLedgerEntry,
  User,
} from "./types";

// ── Categories ───────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { id: "cat-1", name: "Raw Materials" },
  { id: "cat-2", name: "Finished Goods" },
  { id: "cat-3", name: "Components" },
  { id: "cat-4", name: "Packaging" },
];

// ── Warehouses + Locations ────────────────────────────────────
export const WAREHOUSES: Warehouse[] = [
  {
    id: "wh-1",
    name: "Warehouse 1",
    locations: [
      { id: "loc-1", warehouseId: "wh-1", name: "Main Store" },
      { id: "loc-2", warehouseId: "wh-1", name: "Rack A" },
      { id: "loc-3", warehouseId: "wh-1", name: "Rack B" },
    ],
  },
  {
    id: "wh-2",
    name: "Warehouse 2",
    locations: [
      { id: "loc-4", warehouseId: "wh-2", name: "Production Floor" },
      { id: "loc-5", warehouseId: "wh-2", name: "Storage Area" },
    ],
  },
];

// Flat list of all locations (convenience)
export const ALL_LOCATIONS: (Location & { warehouse: Warehouse })[] =
  WAREHOUSES.flatMap((wh) =>
    (wh.locations ?? []).map((loc) => ({ ...loc, warehouse: wh }))
  );

// ── Products ──────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    sku: "RM-STEEL-001",
    name: "Steel Rod",
    categoryId: "cat-1",
    category: CATEGORIES[0],
    unitOfMeasure: "kg",
    reorderThreshold: 50,
    totalStock: 100,
  },
  {
    id: "prod-2",
    sku: "FG-CHAIR-001",
    name: "Chair",
    categoryId: "cat-2",
    category: CATEGORIES[1],
    unitOfMeasure: "pcs",
    reorderThreshold: 10,
    totalStock: 35,
  },
  {
    id: "prod-3",
    sku: "FG-TABLE-001",
    name: "Table",
    categoryId: "cat-2",
    category: CATEGORIES[1],
    unitOfMeasure: "pcs",
    reorderThreshold: 5,
    totalStock: 8,
  },
  {
    id: "prod-4",
    sku: "RM-WOOD-001",
    name: "Wood Panel",
    categoryId: "cat-1",
    category: CATEGORIES[0],
    unitOfMeasure: "sheet",
    reorderThreshold: 20,
    totalStock: 4, // low stock
  },
  {
    id: "prod-5",
    sku: "PKG-BOX-001",
    name: "Packaging Box",
    categoryId: "cat-4",
    category: CATEGORIES[3],
    unitOfMeasure: "pcs",
    reorderThreshold: 100,
    totalStock: 0, // out of stock
  },
  {
    id: "prod-6",
    sku: "COMP-BOLT-001",
    name: "M8 Bolts (bag)",
    categoryId: "cat-3",
    category: CATEGORIES[2],
    unitOfMeasure: "bag",
    reorderThreshold: 15,
    totalStock: 60,
  },
];

// ── Stock levels ──────────────────────────────────────────────
export const STOCK: Stock[] = [
  { productId: "prod-1", locationId: "loc-1", quantity: 70 },
  { productId: "prod-1", locationId: "loc-4", quantity: 30 },
  { productId: "prod-2", locationId: "loc-1", quantity: 20 },
  { productId: "prod-2", locationId: "loc-2", quantity: 15 },
  { productId: "prod-3", locationId: "loc-1", quantity: 8 },
  { productId: "prod-4", locationId: "loc-3", quantity: 4 },
  { productId: "prod-5", locationId: "loc-2", quantity: 0 },
  { productId: "prod-6", locationId: "loc-2", quantity: 60 },
];

// ── Demo user ─────────────────────────────────────────────────
export const DEMO_USER: User = {
  id: "user-1",
  name: "Demo User",
  email: "demo@stocksense.app",
  role: "ADMIN",
  createdAt: new Date(2024, 0, 1).toISOString(),
};

// ── Receipts ──────────────────────────────────────────────────
export const RECEIPTS: Receipt[] = [
  {
    id: "rec-1",
    reference: "REC-2024-001",
    supplier: "SteelWorks Ltd.",
    status: "Done",
    items: [
      {
        id: "ri-1",
        receiptId: "rec-1",
        productId: "prod-1",
        product: PRODUCTS[0],
        locationId: "loc-1",
        location: ALL_LOCATIONS.find((l) => l.id === "loc-1"),
        quantity: 100,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "rec-2",
    reference: "REC-2024-002",
    supplier: "Furniture Factory",
    status: "Draft",
    items: [
      {
        id: "ri-2",
        receiptId: "rec-2",
        productId: "prod-2",
        product: PRODUCTS[1],
        locationId: "loc-1",
        location: ALL_LOCATIONS.find((l) => l.id === "loc-1"),
        quantity: 20,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "rec-3",
    reference: "REC-2024-003",
    supplier: "Packaging Co.",
    status: "Waiting",
    items: [
      {
        id: "ri-3",
        receiptId: "rec-3",
        productId: "prod-5",
        product: PRODUCTS[4],
        locationId: "loc-2",
        location: ALL_LOCATIONS.find((l) => l.id === "loc-2"),
        quantity: 500,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

// ── Deliveries ────────────────────────────────────────────────
export const DELIVERIES: Delivery[] = [
  {
    id: "del-1",
    reference: "DEL-2024-001",
    customer: "Acme Corp",
    status: "Done",
    items: [
      {
        id: "di-1",
        deliveryId: "del-1",
        productId: "prod-2",
        product: PRODUCTS[1],
        locationId: "loc-1",
        location: ALL_LOCATIONS.find((l) => l.id === "loc-1"),
        quantity: 5,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "del-2",
    reference: "DEL-2024-002",
    customer: "Beta Builders",
    status: "Draft",
    items: [
      {
        id: "di-2",
        deliveryId: "del-2",
        productId: "prod-3",
        product: PRODUCTS[2],
        locationId: "loc-1",
        location: ALL_LOCATIONS.find((l) => l.id === "loc-1"),
        quantity: 3,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

// ── Transfers ─────────────────────────────────────────────────
export const TRANSFERS: InternalTransfer[] = [
  {
    id: "tr-1",
    reference: "TRF-2024-001",
    status: "Done",
    items: [
      {
        id: "tri-1",
        transferId: "tr-1",
        productId: "prod-1",
        product: PRODUCTS[0],
        sourceLocationId: "loc-1",
        sourceLocation: ALL_LOCATIONS.find((l) => l.id === "loc-1"),
        destLocationId: "loc-4",
        destLocation: ALL_LOCATIONS.find((l) => l.id === "loc-4"),
        quantity: 30,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: "tr-2",
    reference: "TRF-2024-002",
    status: "Draft",
    items: [
      {
        id: "tri-2",
        transferId: "tr-2",
        productId: "prod-6",
        product: PRODUCTS[5],
        sourceLocationId: "loc-2",
        sourceLocation: ALL_LOCATIONS.find((l) => l.id === "loc-2"),
        destLocationId: "loc-5",
        destLocation: ALL_LOCATIONS.find((l) => l.id === "loc-5"),
        quantity: 20,
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

// ── Adjustments ───────────────────────────────────────────────
export const ADJUSTMENTS: StockAdjustment[] = [
  {
    id: "adj-1",
    reference: "ADJ-2024-001",
    productId: "prod-4",
    product: PRODUCTS[3],
    locationId: "loc-3",
    location: ALL_LOCATIONS.find((l) => l.id === "loc-3"),
    systemQuantity: 7,
    countedQuantity: 4,
    delta: -3,
    status: "Done",
    performedById: "user-1",
    performedBy: DEMO_USER,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// ── Stock Ledger ──────────────────────────────────────────────
export const LEDGER: StockLedgerEntry[] = [
  {
    id: "led-1",
    productId: "prod-1",
    product: PRODUCTS[0],
    operationType: "RECEIPT",
    quantity: 100,
    destLocationId: "loc-1",
    destLocation: ALL_LOCATIONS.find((l) => l.id === "loc-1"),
    referenceType: "Receipt",
    referenceId: "rec-1",
    performedById: "user-1",
    performedBy: DEMO_USER,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "led-2",
    productId: "prod-2",
    product: PRODUCTS[1],
    operationType: "DELIVERY",
    quantity: -5,
    sourceLocationId: "loc-1",
    sourceLocation: ALL_LOCATIONS.find((l) => l.id === "loc-1"),
    referenceType: "Delivery",
    referenceId: "del-1",
    performedById: "user-1",
    performedBy: DEMO_USER,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "led-3",
    productId: "prod-1",
    product: PRODUCTS[0],
    operationType: "TRANSFER",
    quantity: -30,
    sourceLocationId: "loc-1",
    sourceLocation: ALL_LOCATIONS.find((l) => l.id === "loc-1"),
    destLocationId: "loc-4",
    destLocation: ALL_LOCATIONS.find((l) => l.id === "loc-4"),
    referenceType: "Transfer",
    referenceId: "tr-1",
    performedById: "user-1",
    performedBy: DEMO_USER,
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: "led-4",
    productId: "prod-4",
    product: PRODUCTS[3],
    operationType: "ADJUSTMENT",
    quantity: -3,
    sourceLocationId: "loc-3",
    sourceLocation: ALL_LOCATIONS.find((l) => l.id === "loc-3"),
    referenceType: "Adjustment",
    referenceId: "adj-1",
    performedById: "user-1",
    performedBy: DEMO_USER,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

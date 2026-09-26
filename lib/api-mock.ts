// ============================================================
// StockSense — Mock API functions
//
// IMPORTANT: Every function here matches the EXACT name, signature,
// and return shape that the real backend Server Actions will expose.
// When the backend is ready, replace the body of each function with
// the real implementation (DB call, Prisma, etc.) — zero changes
// needed in any component file.
//
// All async functions simulate a realistic ~300-500ms network delay
// so the loading states in the UI are visually testable.
// ============================================================

import {
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
  DocumentStatus,
  Stock,
} from "./types";

// Simulate network delay
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ---- Seed data ----

const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Electronics" },
  { id: "cat-2", name: "Office Supplies" },
  { id: "cat-3", name: "Furniture" },
  { id: "cat-4", name: "Raw Materials" },
];

const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: "wh-1",
    name: "Main Warehouse",
    locations: [
      { id: "loc-1", warehouseId: "wh-1", name: "Rack A" },
      { id: "loc-2", warehouseId: "wh-1", name: "Rack B" },
      { id: "loc-3", warehouseId: "wh-1", name: "Main Store" },
    ],
  },
  {
    id: "wh-2",
    name: "Secondary Storage",
    locations: [
      { id: "loc-4", warehouseId: "wh-2", name: "Section 1" },
      { id: "loc-5", warehouseId: "wh-2", name: "Section 2" },
    ],
  },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    sku: "ELEC-001",
    name: "USB-C Hub",
    categoryId: "cat-1",
    category: MOCK_CATEGORIES[0],
    unitOfMeasure: "pcs",
    reorderThreshold: 10,
    totalStock: 45,
  },
  {
    id: "prod-2",
    sku: "ELEC-002",
    name: "Wireless Keyboard",
    categoryId: "cat-1",
    category: MOCK_CATEGORIES[0],
    unitOfMeasure: "pcs",
    reorderThreshold: 5,
    totalStock: 3, // low stock
  },
  {
    id: "prod-3",
    sku: "OFF-001",
    name: "Printer Paper (A4)",
    categoryId: "cat-2",
    category: MOCK_CATEGORIES[1],
    unitOfMeasure: "ream",
    reorderThreshold: 20,
    totalStock: 0, // out of stock
  },
  {
    id: "prod-4",
    sku: "OFF-002",
    name: "Ballpoint Pens (Box)",
    categoryId: "cat-2",
    category: MOCK_CATEGORIES[1],
    unitOfMeasure: "box",
    reorderThreshold: 10,
    totalStock: 25,
  },
  {
    id: "prod-5",
    sku: "FURN-001",
    name: "Office Chair",
    categoryId: "cat-3",
    category: MOCK_CATEGORIES[2],
    unitOfMeasure: "pcs",
    reorderThreshold: 2,
    totalStock: 8,
  },
  {
    id: "prod-6",
    sku: "RAW-001",
    name: "Aluminium Sheet",
    categoryId: "cat-4",
    category: MOCK_CATEGORIES[3],
    unitOfMeasure: "kg",
    reorderThreshold: 50,
    totalStock: 4, // low stock
  },
];

const MOCK_RECEIPTS: Receipt[] = [
  {
    id: "rec-1",
    reference: "REC-2024-001",
    supplier: "TechSupply Co.",
    status: "Done",
    items: [
      {
        id: "ri-1",
        receiptId: "rec-1",
        productId: "prod-1",
        product: MOCK_PRODUCTS[0],
        locationId: "loc-1",
        location: MOCK_WAREHOUSES[0].locations![0],
        quantity: 50,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "rec-2",
    reference: "REC-2024-002",
    supplier: "Office World",
    status: "Draft",
    items: [
      {
        id: "ri-2",
        receiptId: "rec-2",
        productId: "prod-3",
        product: MOCK_PRODUCTS[2],
        locationId: "loc-2",
        location: MOCK_WAREHOUSES[0].locations![1],
        quantity: 30,
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "rec-3",
    reference: "REC-2024-003",
    supplier: "Metal Works Ltd.",
    status: "Waiting",
    items: [
      {
        id: "ri-3",
        receiptId: "rec-3",
        productId: "prod-6",
        product: MOCK_PRODUCTS[5],
        locationId: "loc-3",
        location: MOCK_WAREHOUSES[0].locations![2],
        quantity: 100,
      },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "del-1",
    reference: "DEL-2024-001",
    customer: "Acme Corp",
    status: "Done",
    items: [
      {
        id: "di-1",
        deliveryId: "del-1",
        productId: "prod-1",
        product: MOCK_PRODUCTS[0],
        locationId: "loc-1",
        location: MOCK_WAREHOUSES[0].locations![0],
        quantity: 5,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "del-2",
    reference: "DEL-2024-002",
    customer: "Beta Industries",
    status: "Draft",
    items: [
      {
        id: "di-2",
        deliveryId: "del-2",
        productId: "prod-4",
        product: MOCK_PRODUCTS[3],
        locationId: "loc-2",
        location: MOCK_WAREHOUSES[0].locations![1],
        quantity: 10,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const MOCK_TRANSFERS: InternalTransfer[] = [
  {
    id: "tr-1",
    reference: "TRF-2024-001",
    status: "Done",
    items: [
      {
        id: "tri-1",
        transferId: "tr-1",
        productId: "prod-1",
        product: MOCK_PRODUCTS[0],
        sourceLocationId: "loc-1",
        sourceLocation: MOCK_WAREHOUSES[0].locations![0],
        destLocationId: "loc-4",
        destLocation: MOCK_WAREHOUSES[1].locations![0],
        quantity: 10,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "tr-2",
    reference: "TRF-2024-002",
    status: "Draft",
    items: [
      {
        id: "tri-2",
        transferId: "tr-2",
        productId: "prod-5",
        product: MOCK_PRODUCTS[4],
        sourceLocationId: "loc-3",
        sourceLocation: MOCK_WAREHOUSES[0].locations![2],
        destLocationId: "loc-5",
        destLocation: MOCK_WAREHOUSES[1].locations![1],
        quantity: 2,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const MOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: "adj-1",
    reference: "ADJ-2024-001",
    productId: "prod-2",
    product: MOCK_PRODUCTS[1],
    locationId: "loc-1",
    location: MOCK_WAREHOUSES[0].locations![0],
    systemQuantity: 5,
    countedQuantity: 3,
    delta: -2,
    status: "Done",
    performedById: "mock-user-1",
    performedBy: {
      id: "mock-user-1",
      name: "Demo User",
      email: "demo@stocksense.app",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_LEDGER: StockLedgerEntry[] = [
  {
    id: "led-1",
    productId: "prod-1",
    product: MOCK_PRODUCTS[0],
    operationType: "RECEIPT",
    quantity: 50,
    destLocationId: "loc-1",
    destLocation: MOCK_WAREHOUSES[0].locations![0],
    referenceType: "Receipt",
    referenceId: "rec-1",
    performedById: "mock-user-1",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "led-2",
    productId: "prod-1",
    product: MOCK_PRODUCTS[0],
    operationType: "DELIVERY",
    quantity: -5,
    sourceLocationId: "loc-1",
    sourceLocation: MOCK_WAREHOUSES[0].locations![0],
    referenceType: "Delivery",
    referenceId: "del-1",
    performedById: "mock-user-1",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "led-3",
    productId: "prod-1",
    product: MOCK_PRODUCTS[0],
    operationType: "TRANSFER",
    quantity: -10,
    sourceLocationId: "loc-1",
    sourceLocation: MOCK_WAREHOUSES[0].locations![0],
    destLocationId: "loc-4",
    destLocation: MOCK_WAREHOUSES[1].locations![0],
    referenceType: "Transfer",
    referenceId: "tr-1",
    performedById: "mock-user-1",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "led-4",
    productId: "prod-2",
    product: MOCK_PRODUCTS[1],
    operationType: "ADJUSTMENT",
    quantity: -2,
    sourceLocationId: "loc-1",
    sourceLocation: MOCK_WAREHOUSES[0].locations![0],
    referenceType: "Adjustment",
    referenceId: "adj-1",
    performedById: "mock-user-1",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_STOCK: Stock[] = [
  { productId: "prod-1", locationId: "loc-1", quantity: 35 },
  { productId: "prod-1", locationId: "loc-4", quantity: 10 },
  { productId: "prod-2", locationId: "loc-1", quantity: 3 },
  { productId: "prod-3", locationId: "loc-2", quantity: 0 },
  { productId: "prod-4", locationId: "loc-2", quantity: 25 },
  { productId: "prod-5", locationId: "loc-3", quantity: 8 },
  { productId: "prod-6", locationId: "loc-3", quantity: 4 },
];

// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboardKpis(
  _filters?: DashboardFilters
): Promise<DashboardKpis> {
  await delay();
  return {
    totalProductsInStock: MOCK_PRODUCTS.filter((p) => (p.totalStock ?? 0) > 0)
      .length,
    lowStockCount: MOCK_PRODUCTS.filter(
      (p) => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= p.reorderThreshold
    ).length,
    outOfStockCount: MOCK_PRODUCTS.filter((p) => (p.totalStock ?? 0) === 0)
      .length,
    pendingReceipts: MOCK_RECEIPTS.filter(
      (r) => r.status === "Draft" || r.status === "Waiting"
    ).length,
    pendingDeliveries: MOCK_DELIVERIES.filter(
      (d) => d.status === "Draft" || d.status === "Waiting"
    ).length,
    pendingTransfers: MOCK_TRANSFERS.filter(
      (t) => t.status === "Draft" || t.status === "Waiting"
    ).length,
  };
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  await delay();
  const activities: RecentActivity[] = [
    ...MOCK_RECEIPTS.map((r) => ({
      id: r.id,
      type: "Receipt" as const,
      reference: r.reference,
      status: r.status,
      createdAt: r.createdAt,
      description: `Receipt from ${r.supplier} (${r.items.length} item${r.items.length !== 1 ? "s" : ""})`,
    })),
    ...MOCK_DELIVERIES.map((d) => ({
      id: d.id,
      type: "Delivery" as const,
      reference: d.reference,
      status: d.status,
      createdAt: d.createdAt,
      description: `Delivery to ${d.customer} (${d.items.length} item${d.items.length !== 1 ? "s" : ""})`,
    })),
    ...MOCK_TRANSFERS.map((t) => ({
      id: t.id,
      type: "Transfer" as const,
      reference: t.reference,
      status: t.status,
      createdAt: t.createdAt,
      description: `Internal transfer (${t.items.length} item${t.items.length !== 1 ? "s" : ""})`,
    })),
    ...MOCK_ADJUSTMENTS.map((a) => ({
      id: a.id,
      type: "Adjustment" as const,
      reference: a.reference,
      status: a.status,
      createdAt: a.createdAt,
      description: `Stock adjustment for ${a.product?.name ?? a.productId}`,
    })),
  ];
  return activities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ============================================================
// PRODUCTS
// ============================================================

export async function getProducts(
  params?: ProductSearchParams
): Promise<PaginatedResult<Product>> {
  await delay();
  let results = [...MOCK_PRODUCTS];
  if (params?.search) {
    const q = params.search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }
  if (params?.category) {
    results = results.filter((p) => p.categoryId === params.category);
  }
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  return {
    data: results.slice(start, start + pageSize),
    total: results.length,
    page,
    pageSize,
  };
}

export async function getProduct(id: string): Promise<Product | null> {
  await delay();
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
}

export async function getProductStock(
  productId: string
): Promise<(Stock & { location: Location & { warehouse: Warehouse } })[]> {
  await delay();
  return MOCK_STOCK.filter((s) => s.productId === productId).map((s) => {
    const wh = MOCK_WAREHOUSES.find((w) =>
      w.locations?.some((l) => l.id === s.locationId)
    )!;
    const loc = wh.locations!.find((l) => l.id === s.locationId)!;
    return { ...s, location: { ...loc, warehouse: wh } };
  });
}

export async function createProduct(data: {
  sku: string;
  name: string;
  categoryId: string;
  unitOfMeasure: string;
  reorderThreshold: number;
}): Promise<Product> {
  await delay(600);
  // Check duplicate SKU
  if (MOCK_PRODUCTS.some((p) => p.sku === data.sku)) {
    throw new Error("SKU already exists.");
  }
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    ...data,
    category: MOCK_CATEGORIES.find((c) => c.id === data.categoryId),
    totalStock: 0,
  };
  MOCK_PRODUCTS.push(newProduct);
  return newProduct;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "totalStock">>
): Promise<Product> {
  await delay(600);
  const idx = MOCK_PRODUCTS.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Product not found.");
  if (data.sku && MOCK_PRODUCTS.some((p) => p.sku === data.sku && p.id !== id)) {
    throw new Error("SKU already exists.");
  }
  const updated = {
    ...MOCK_PRODUCTS[idx],
    ...data,
    category: data.categoryId
      ? MOCK_CATEGORIES.find((c) => c.id === data.categoryId)
      : MOCK_PRODUCTS[idx].category,
  };
  MOCK_PRODUCTS[idx] = updated;
  return updated;
}

// ============================================================
// WAREHOUSES
// ============================================================

export async function getWarehouses(): Promise<Warehouse[]> {
  await delay();
  return MOCK_WAREHOUSES;
}

export async function createWarehouse(data: {
  name: string;
}): Promise<Warehouse> {
  await delay(600);
  const newWh: Warehouse = {
    id: `wh-${Date.now()}`,
    name: data.name,
    locations: [],
  };
  MOCK_WAREHOUSES.push(newWh);
  return newWh;
}

export async function createLocation(
  warehouseId: string,
  data: { name: string }
): Promise<Location> {
  await delay(600);
  const wh = MOCK_WAREHOUSES.find((w) => w.id === warehouseId);
  if (!wh) throw new Error("Warehouse not found.");
  const newLoc: Location = {
    id: `loc-${Date.now()}`,
    warehouseId,
    name: data.name,
    warehouse: wh,
  };
  wh.locations = [...(wh.locations ?? []), newLoc];
  return newLoc;
}

export async function getAllLocations(): Promise<
  (Location & { warehouse: Warehouse })[]
> {
  await delay();
  return MOCK_WAREHOUSES.flatMap((wh) =>
    (wh.locations ?? []).map((loc) => ({ ...loc, warehouse: wh }))
  );
}

// ============================================================
// RECEIPTS
// ============================================================

export async function getReceipts(
  filters?: ReceiptFilters
): Promise<PaginatedResult<Receipt>> {
  await delay();
  let results = [...MOCK_RECEIPTS];
  if (filters?.status) {
    results = results.filter((r) => r.status === filters.status);
  }
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  return {
    data: results.slice(start, start + pageSize),
    total: results.length,
    page,
    pageSize,
  };
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  await delay();
  return MOCK_RECEIPTS.find((r) => r.id === id) ?? null;
}

export async function createReceipt(data: {
  supplier: string;
  reference: string;
  items: { productId: string; locationId: string; quantity: number }[];
}): Promise<Receipt> {
  await delay(600);
  const newReceipt: Receipt = {
    id: `rec-${Date.now()}`,
    reference: data.reference,
    supplier: data.supplier,
    status: "Draft",
    items: data.items.map((item, i) => ({
      id: `ri-${Date.now()}-${i}`,
      receiptId: `rec-${Date.now()}`,
      productId: item.productId,
      product: MOCK_PRODUCTS.find((p) => p.id === item.productId),
      locationId: item.locationId,
      location: MOCK_WAREHOUSES.flatMap((w) => w.locations ?? []).find(
        (l) => l.id === item.locationId
      ),
      quantity: item.quantity,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_RECEIPTS.unshift(newReceipt);
  return newReceipt;
}

export async function addReceiptItem(
  receiptId: string,
  item: { productId: string; locationId: string; quantity: number }
): Promise<ReceiptItem> {
  await delay(400);
  const receipt = MOCK_RECEIPTS.find((r) => r.id === receiptId);
  if (!receipt) throw new Error("Receipt not found.");
  const newItem: ReceiptItem = {
    id: `ri-${Date.now()}`,
    receiptId,
    productId: item.productId,
    product: MOCK_PRODUCTS.find((p) => p.id === item.productId),
    locationId: item.locationId,
    location: MOCK_WAREHOUSES.flatMap((w) => w.locations ?? []).find(
      (l) => l.id === item.locationId
    ),
    quantity: item.quantity,
  };
  receipt.items.push(newItem);
  return newItem;
}

export async function validateReceipt(id: string): Promise<Receipt> {
  await delay(600);
  const receipt = MOCK_RECEIPTS.find((r) => r.id === id);
  if (!receipt) throw new Error("Receipt not found.");
  if (receipt.status === "Done")
    throw new Error("Receipt is already validated.");
  if (receipt.status === "Canceled")
    throw new Error("Cannot validate a canceled receipt.");
  receipt.status = "Done";
  receipt.updatedAt = new Date().toISOString();
  // Update stock
  receipt.items.forEach((item) => {
    const stock = MOCK_STOCK.find(
      (s) => s.productId === item.productId && s.locationId === item.locationId
    );
    if (stock) {
      stock.quantity += item.quantity;
    } else {
      MOCK_STOCK.push({
        productId: item.productId,
        locationId: item.locationId,
        quantity: item.quantity,
      });
    }
    const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
    if (product) product.totalStock = (product.totalStock ?? 0) + item.quantity;
  });
  return receipt;
}

export async function cancelReceipt(id: string): Promise<Receipt> {
  await delay(600);
  const receipt = MOCK_RECEIPTS.find((r) => r.id === id);
  if (!receipt) throw new Error("Receipt not found.");
  if (receipt.status === "Done")
    throw new Error(
      "This receipt has already been validated. Canceling it would require a reversal adjustment — please contact your administrator."
    );
  receipt.status = "Canceled";
  receipt.updatedAt = new Date().toISOString();
  return receipt;
}

// ============================================================
// DELIVERIES
// ============================================================

export async function getDeliveries(
  filters?: DeliveryFilters
): Promise<PaginatedResult<Delivery>> {
  await delay();
  let results = [...MOCK_DELIVERIES];
  if (filters?.status) {
    results = results.filter((d) => d.status === filters.status);
  }
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  return {
    data: results.slice(start, start + pageSize),
    total: results.length,
    page,
    pageSize,
  };
}

export async function getDelivery(id: string): Promise<Delivery | null> {
  await delay();
  return MOCK_DELIVERIES.find((d) => d.id === id) ?? null;
}

export async function createDelivery(data: {
  customer: string;
  reference: string;
  items: { productId: string; locationId: string; quantity: number }[];
}): Promise<Delivery> {
  await delay(600);
  // Validate stock availability
  for (const item of data.items) {
    const stock = MOCK_STOCK.find(
      (s) => s.productId === item.productId && s.locationId === item.locationId
    );
    const available = stock?.quantity ?? 0;
    if (item.quantity > available) {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      throw new Error(
        `Insufficient stock for ${product?.name ?? item.productId}. Available: ${available}, requested: ${item.quantity}.`
      );
    }
  }
  const newDelivery: Delivery = {
    id: `del-${Date.now()}`,
    reference: data.reference,
    customer: data.customer,
    status: "Draft",
    items: data.items.map((item, i) => ({
      id: `di-${Date.now()}-${i}`,
      deliveryId: `del-${Date.now()}`,
      productId: item.productId,
      product: MOCK_PRODUCTS.find((p) => p.id === item.productId),
      locationId: item.locationId,
      location: MOCK_WAREHOUSES.flatMap((w) => w.locations ?? []).find(
        (l) => l.id === item.locationId
      ),
      quantity: item.quantity,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_DELIVERIES.unshift(newDelivery);
  return newDelivery;
}

export async function validateDelivery(id: string): Promise<Delivery> {
  await delay(600);
  const delivery = MOCK_DELIVERIES.find((d) => d.id === id);
  if (!delivery) throw new Error("Delivery not found.");
  if (delivery.status === "Done")
    throw new Error("Delivery is already validated.");
  if (delivery.status === "Canceled")
    throw new Error("Cannot validate a canceled delivery.");
  // Check stock at validation time
  for (const item of delivery.items) {
    const stock = MOCK_STOCK.find(
      (s) =>
        s.productId === item.productId && s.locationId === item.locationId
    );
    const available = stock?.quantity ?? 0;
    if (item.quantity > available) {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      throw new Error(
        `Insufficient stock. Available: ${available}, requested: ${item.quantity}.`
      );
    }
  }
  delivery.status = "Done";
  delivery.updatedAt = new Date().toISOString();
  // Deduct stock
  delivery.items.forEach((item) => {
    const stock = MOCK_STOCK.find(
      (s) => s.productId === item.productId && s.locationId === item.locationId
    );
    if (stock) stock.quantity -= item.quantity;
    const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
    if (product) product.totalStock = Math.max(0, (product.totalStock ?? 0) - item.quantity);
  });
  return delivery;
}

export async function cancelDelivery(id: string): Promise<Delivery> {
  await delay(600);
  const delivery = MOCK_DELIVERIES.find((d) => d.id === id);
  if (!delivery) throw new Error("Delivery not found.");
  if (delivery.status === "Done")
    throw new Error("Cannot cancel a completed delivery. Please create a return receipt.");
  delivery.status = "Canceled";
  delivery.updatedAt = new Date().toISOString();
  return delivery;
}

// ============================================================
// INTERNAL TRANSFERS
// ============================================================

export async function getTransfers(
  filters?: TransferFilters
): Promise<PaginatedResult<InternalTransfer>> {
  await delay();
  let results = [...MOCK_TRANSFERS];
  if (filters?.status) {
    results = results.filter((t) => t.status === filters.status);
  }
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  return {
    data: results.slice(start, start + pageSize),
    total: results.length,
    page,
    pageSize,
  };
}

export async function getTransfer(
  id: string
): Promise<InternalTransfer | null> {
  await delay();
  return MOCK_TRANSFERS.find((t) => t.id === id) ?? null;
}

export async function createTransfer(data: {
  items: {
    productId: string;
    sourceLocationId: string;
    destLocationId: string;
    quantity: number;
  }[];
}): Promise<InternalTransfer> {
  await delay(600);
  // Validate same-location rule and stock
  for (const item of data.items) {
    if (item.sourceLocationId === item.destLocationId) {
      throw new Error(
        "Source and destination locations cannot be the same."
      );
    }
    if (item.quantity <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }
    const stock = MOCK_STOCK.find(
      (s) =>
        s.productId === item.productId &&
        s.locationId === item.sourceLocationId
    );
    const available = stock?.quantity ?? 0;
    if (item.quantity > available) {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      throw new Error(
        `Insufficient stock for ${product?.name ?? item.productId}. Available: ${available}, requested: ${item.quantity}.`
      );
    }
  }
  const ref = `TRF-${new Date().getFullYear()}-${String(MOCK_TRANSFERS.length + 1).padStart(3, "0")}`;
  const newTransfer: InternalTransfer = {
    id: `tr-${Date.now()}`,
    reference: ref,
    status: "Draft",
    items: data.items.map((item, i) => {
      const allLocs = MOCK_WAREHOUSES.flatMap((w) => w.locations ?? []);
      return {
        id: `tri-${Date.now()}-${i}`,
        transferId: `tr-${Date.now()}`,
        productId: item.productId,
        product: MOCK_PRODUCTS.find((p) => p.id === item.productId),
        sourceLocationId: item.sourceLocationId,
        sourceLocation: allLocs.find((l) => l.id === item.sourceLocationId),
        destLocationId: item.destLocationId,
        destLocation: allLocs.find((l) => l.id === item.destLocationId),
        quantity: item.quantity,
      };
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_TRANSFERS.unshift(newTransfer);
  return newTransfer;
}

export async function validateTransfer(id: string): Promise<InternalTransfer> {
  await delay(600);
  const transfer = MOCK_TRANSFERS.find((t) => t.id === id);
  if (!transfer) throw new Error("Transfer not found.");
  if (transfer.status === "Done")
    throw new Error("Transfer is already validated.");
  if (transfer.status === "Canceled")
    throw new Error("Cannot validate a canceled transfer.");
  transfer.status = "Done";
  transfer.updatedAt = new Date().toISOString();
  // Move stock
  transfer.items.forEach((item) => {
    const srcStock = MOCK_STOCK.find(
      (s) =>
        s.productId === item.productId && s.locationId === item.sourceLocationId
    );
    if (srcStock) srcStock.quantity -= item.quantity;
    const dstStock = MOCK_STOCK.find(
      (s) =>
        s.productId === item.productId && s.locationId === item.destLocationId
    );
    if (dstStock) {
      dstStock.quantity += item.quantity;
    } else {
      MOCK_STOCK.push({
        productId: item.productId,
        locationId: item.destLocationId!,
        quantity: item.quantity,
      });
    }
  });
  return transfer;
}

// ============================================================
// STOCK ADJUSTMENTS
// ============================================================

export async function getAdjustments(
  filters?: AdjustmentFilters
): Promise<PaginatedResult<StockAdjustment>> {
  await delay();
  let results = [...MOCK_ADJUSTMENTS];
  if (filters?.status) {
    results = results.filter((a) => a.status === filters.status);
  }
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  return {
    data: results.slice(start, start + pageSize),
    total: results.length,
    page,
    pageSize,
  };
}

export async function getAdjustment(
  id: string
): Promise<StockAdjustment | null> {
  await delay();
  return MOCK_ADJUSTMENTS.find((a) => a.id === id) ?? null;
}

export async function getSystemQuantity(
  productId: string,
  locationId: string
): Promise<number> {
  await delay(200);
  return (
    MOCK_STOCK.find(
      (s) => s.productId === productId && s.locationId === locationId
    )?.quantity ?? 0
  );
}

export async function createAdjustment(data: {
  productId: string;
  locationId: string;
  countedQuantity: number;
}): Promise<StockAdjustment> {
  await delay(600);
  if (data.countedQuantity < 0)
    throw new Error("Counted quantity cannot be negative.");
  const systemQty =
    MOCK_STOCK.find(
      (s) =>
        s.productId === data.productId && s.locationId === data.locationId
    )?.quantity ?? 0;
  const delta = data.countedQuantity - systemQty;
  const ref = `ADJ-${new Date().getFullYear()}-${String(MOCK_ADJUSTMENTS.length + 1).padStart(3, "0")}`;
  const newAdj: StockAdjustment = {
    id: `adj-${Date.now()}`,
    reference: ref,
    productId: data.productId,
    product: MOCK_PRODUCTS.find((p) => p.id === data.productId),
    locationId: data.locationId,
    location: MOCK_WAREHOUSES.flatMap((w) => w.locations ?? []).find(
      (l) => l.id === data.locationId
    ),
    systemQuantity: systemQty,
    countedQuantity: data.countedQuantity,
    delta,
    status: "Draft",
    performedById: "mock-user-1",
    performedBy: {
      id: "mock-user-1",
      name: "Demo User",
      email: "demo@stocksense.app",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
  };
  MOCK_ADJUSTMENTS.unshift(newAdj);
  return newAdj;
}

export async function validateAdjustment(
  id: string
): Promise<StockAdjustment> {
  await delay(600);
  const adj = MOCK_ADJUSTMENTS.find((a) => a.id === id);
  if (!adj) throw new Error("Adjustment not found.");
  if (adj.status === "Done")
    throw new Error("Adjustment is already validated.");
  adj.status = "Done";
  // Apply stock change
  const stock = MOCK_STOCK.find(
    (s) => s.productId === adj.productId && s.locationId === adj.locationId
  );
  if (stock) {
    stock.quantity = adj.countedQuantity;
  } else {
    MOCK_STOCK.push({
      productId: adj.productId,
      locationId: adj.locationId,
      quantity: adj.countedQuantity,
    });
  }
  const product = MOCK_PRODUCTS.find((p) => p.id === adj.productId);
  if (product) product.totalStock = adj.countedQuantity;
  return adj;
}

// ============================================================
// STOCK LEDGER
// ============================================================

export async function getStockLedger(
  filters?: LedgerFilters
): Promise<PaginatedResult<StockLedgerEntry>> {
  await delay();
  let results = [...MOCK_LEDGER];
  if (filters?.productId) {
    results = results.filter((e) => e.productId === filters.productId);
  }
  if (filters?.locationId) {
    results = results.filter(
      (e) =>
        e.sourceLocationId === filters.locationId ||
        e.destLocationId === filters.locationId
    );
  }
  if (filters?.operationType) {
    results = results.filter((e) => e.operationType === filters.operationType);
  }
  if (filters?.dateFrom) {
    results = results.filter(
      (e) => new Date(e.createdAt) >= new Date(filters.dateFrom!)
    );
  }
  if (filters?.dateTo) {
    results = results.filter(
      (e) => new Date(e.createdAt) <= new Date(filters.dateTo!)
    );
  }
  results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  return {
    data: results.slice(start, start + pageSize),
    total: results.length,
    page,
    pageSize,
  };
}

// ============================================================
// CATEGORIES
// ============================================================

export async function getCategories(): Promise<Category[]> {
  await delay();
  return MOCK_CATEGORIES;
}

export async function createCategory(data: {
  name: string;
}): Promise<Category> {
  await delay(600);
  if (MOCK_CATEGORIES.some((c) => c.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error("A category with this name already exists.");
  }
  const newCat: Category = { id: `cat-${Date.now()}`, name: data.name };
  MOCK_CATEGORIES.push(newCat);
  return newCat;
}

export async function updateCategory(
  id: string,
  data: { name: string }
): Promise<Category> {
  await delay(600);
  const cat = MOCK_CATEGORIES.find((c) => c.id === id);
  if (!cat) throw new Error("Category not found.");
  cat.name = data.name;
  return cat;
}

// ============================================================
// AUTH
// ============================================================

export async function signUp(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean }> {
  await delay(800);
  // Mock: always succeeds unless email is already "used"
  if (data.email === "taken@example.com") {
    throw new Error("An account with this email already exists.");
  }
  return { success: true };
}

export async function requestPasswordResetOtp(
  email: string
): Promise<{ success: boolean }> {
  await delay(800);
  // Mock: always pretend an OTP was sent
  return { success: true };
}

export async function verifyOtpAndResetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean }> {
  await delay(800);
  // Mock: OTP "123456" always works
  if (otp !== "123456") {
    throw new Error(
      "Invalid or expired OTP. Please check the code and try again."
    );
  }
  return { success: true };
}

export async function updateProfile(data: {
  name: string;
  email: string;
}): Promise<{ success: boolean }> {
  await delay(600);
  return { success: true };
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  await delay(600);
  if (data.currentPassword === data.newPassword) {
    throw new Error("New password must be different from your current password.");
  }
  return { success: true };
}

// prisma/seed.ts
// Idempotent seed script for StockSense.
// Run with:  npx prisma db seed
// (or:        npx tsx prisma/seed.ts)
//
// Based on the existing mock data so the UI looks populated immediately.

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(p: string) {
  return crypto.createHash("sha256").update(p).digest("hex");
}

async function main() {
  console.log("🌱 Seeding StockSense database…");

  // ---- Users ----
  const admin = await prisma.user.upsert({
    where: { email: "admin@stocksense.app" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@stocksense.app",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
    },
  });
  console.log("✅ Users seeded");

  // ---- Categories ----
  const catElec = await prisma.category.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics" },
  });
  const catOffice = await prisma.category.upsert({
    where: { name: "Office Supplies" },
    update: {},
    create: { name: "Office Supplies" },
  });
  const catFurniture = await prisma.category.upsert({
    where: { name: "Furniture" },
    update: {},
    create: { name: "Furniture" },
  });
  const catRaw = await prisma.category.upsert({
    where: { name: "Raw Materials" },
    update: {},
    create: { name: "Raw Materials" },
  });
  console.log("✅ Categories seeded");

  // ---- Warehouses ----
  const wh1 = await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: {},
    create: { name: "Main Warehouse", code: "MAIN", address: "123 Main St" },
  });
  const wh2 = await prisma.warehouse.upsert({
    where: { code: "SEC" },
    update: {},
    create: { name: "Secondary Storage", code: "SEC", address: "456 Storage Ave" },
  });
  console.log("✅ Warehouses seeded");

  // ---- Locations ----
  async function upsertLocation(warehouseId: string, code: string, name: string) {
    const existing = await prisma.location.findUnique({
      where: { warehouseId_code: { warehouseId, code } },
    });
    if (existing) return existing;
    return prisma.location.create({ data: { warehouseId, code, name } });
  }

  const locA = await upsertLocation(wh1.id, "RACK-A", "Rack A");
  const locB = await upsertLocation(wh1.id, "RACK-B", "Rack B");
  const locMain = await upsertLocation(wh1.id, "MAIN-STORE", "Main Store");
  const locSec1 = await upsertLocation(wh2.id, "SEC-1", "Section 1");
  const locSec2 = await upsertLocation(wh2.id, "SEC-2", "Section 2");
  console.log("✅ Locations seeded");

  // ---- Products ----
  async function upsertProduct(data: {
    sku: string;
    name: string;
    categoryId: string;
    unit: string;
    reorderThreshold: number;
  }) {
    return prisma.product.upsert({
      where: { sku: data.sku },
      update: {},
      create: data,
    });
  }

  const prodUsbHub = await upsertProduct({ sku: "ELEC-001", name: "USB-C Hub", categoryId: catElec.id, unit: "pcs", reorderThreshold: 10 });
  const prodKeyboard = await upsertProduct({ sku: "ELEC-002", name: "Wireless Keyboard", categoryId: catElec.id, unit: "pcs", reorderThreshold: 5 });
  const prodPaper = await upsertProduct({ sku: "OFF-001", name: "Printer Paper (A4)", categoryId: catOffice.id, unit: "ream", reorderThreshold: 20 });
  const prodPens = await upsertProduct({ sku: "OFF-002", name: "Ballpoint Pens (Box)", categoryId: catOffice.id, unit: "box", reorderThreshold: 10 });
  const prodChair = await upsertProduct({ sku: "FURN-001", name: "Office Chair", categoryId: catFurniture.id, unit: "pcs", reorderThreshold: 2 });
  const prodAlum = await upsertProduct({ sku: "RAW-001", name: "Aluminium Sheet", categoryId: catRaw.id, unit: "kg", reorderThreshold: 50 });
  console.log("✅ Products seeded");

  // ---- Initial Stock ----
  async function upsertStock(productId: string, locationId: string, quantity: number) {
    return prisma.stock.upsert({
      where: { productId_locationId: { productId, locationId } },
      update: {},
      create: { productId, locationId, quantity },
    });
  }

  await upsertStock(prodUsbHub.id, locA.id, 35);
  await upsertStock(prodUsbHub.id, locSec1.id, 10);
  await upsertStock(prodKeyboard.id, locA.id, 3);
  await upsertStock(prodPaper.id, locB.id, 0);
  await upsertStock(prodPens.id, locB.id, 25);
  await upsertStock(prodChair.id, locMain.id, 8);
  await upsertStock(prodAlum.id, locMain.id, 4);
  console.log("✅ Stock seeded");

  // ---- Receipts ----
  const existingReceipt1 = await prisma.receipt.findUnique({ where: { referenceNumber: "REC-2024-001" } });
  if (!existingReceipt1) {
    const rec1 = await prisma.receipt.create({
      data: {
        referenceNumber: "REC-2024-001",
        supplierName: "TechSupply Co.",
        destinationLocationId: locA.id,
        createdById: admin.id,
        status: "CONFIRMED",
        receivedAt: new Date(Date.now() - 86400000 * 2),
        items: { create: [{ productId: prodUsbHub.id, quantity: 50 }] },
      },
    });
    // Ledger entry for confirmed receipt
    await prisma.stockLedger.create({
      data: {
        productId: prodUsbHub.id,
        locationId: locA.id,
        operationType: "RECEIPT",
        quantityChange: 50,
        quantityBefore: 0,
        quantityAfter: 50,
        referenceType: "Receipt",
        referenceId: rec1.id,
        performedById: admin.id,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    });
  }

  const existingReceipt2 = await prisma.receipt.findUnique({ where: { referenceNumber: "REC-2024-002" } });
  if (!existingReceipt2) {
    await prisma.receipt.create({
      data: {
        referenceNumber: "REC-2024-002",
        supplierName: "Office World",
        destinationLocationId: locB.id,
        createdById: admin.id,
        status: "DRAFT",
        items: { create: [{ productId: prodPaper.id, quantity: 30 }] },
      },
    });
  }
  console.log("✅ Receipts seeded");

  // ---- Deliveries ----
  const existingDel1 = await prisma.delivery.findUnique({ where: { referenceNumber: "DEL-2024-001" } });
  if (!existingDel1) {
    const del1 = await prisma.delivery.create({
      data: {
        referenceNumber: "DEL-2024-001",
        customerName: "Acme Corp",
        sourceLocationId: locA.id,
        createdById: admin.id,
        status: "CONFIRMED",
        deliveredAt: new Date(Date.now() - 86400000),
        items: { create: [{ productId: prodUsbHub.id, quantity: 5 }] },
      },
    });
    await prisma.stockLedger.create({
      data: {
        productId: prodUsbHub.id,
        locationId: locA.id,
        operationType: "DELIVERY",
        quantityChange: -5,
        quantityBefore: 50,
        quantityAfter: 45,
        referenceType: "Delivery",
        referenceId: del1.id,
        performedById: admin.id,
        createdAt: new Date(Date.now() - 86400000),
      },
    });
  }

  const existingDel2 = await prisma.delivery.findUnique({ where: { referenceNumber: "DEL-2024-002" } });
  if (!existingDel2) {
    await prisma.delivery.create({
      data: {
        referenceNumber: "DEL-2024-002",
        customerName: "Beta Industries",
        sourceLocationId: locB.id,
        createdById: admin.id,
        status: "DRAFT",
        items: { create: [{ productId: prodPens.id, quantity: 10 }] },
      },
    });
  }
  console.log("✅ Deliveries seeded");

  // ---- Transfers ----
  const existingTrf1 = await prisma.transfer.findUnique({ where: { referenceNumber: "TRF-2024-001" } });
  if (!existingTrf1) {
    const trf1 = await prisma.transfer.create({
      data: {
        referenceNumber: "TRF-2024-001",
        sourceLocationId: locA.id,
        destinationLocationId: locSec1.id,
        createdById: admin.id,
        status: "CONFIRMED",
        transferredAt: new Date(Date.now() - 86400000 * 4),
        items: { create: [{ productId: prodUsbHub.id, quantity: 10 }] },
      },
    });
    await prisma.stockLedger.createMany({
      data: [
        {
          productId: prodUsbHub.id,
          locationId: locA.id,
          operationType: "TRANSFER_OUT",
          quantityChange: -10,
          quantityBefore: 45,
          quantityAfter: 35,
          referenceType: "Transfer",
          referenceId: trf1.id,
          performedById: admin.id,
          createdAt: new Date(Date.now() - 86400000 * 4),
        },
        {
          productId: prodUsbHub.id,
          locationId: locSec1.id,
          operationType: "TRANSFER_IN",
          quantityChange: 10,
          quantityBefore: 0,
          quantityAfter: 10,
          referenceType: "Transfer",
          referenceId: trf1.id,
          performedById: admin.id,
          createdAt: new Date(Date.now() - 86400000 * 4),
        },
      ],
    });
  }
  console.log("✅ Transfers seeded");

  // ---- Adjustments ----
  const existingAdj1 = await prisma.adjustment.findUnique({ where: { referenceNumber: "ADJ-2024-001" } });
  if (!existingAdj1) {
    const adj1 = await prisma.adjustment.create({
      data: {
        referenceNumber: "ADJ-2024-001",
        locationId: locA.id,
        reason: "Physical count discrepancy",
        createdById: admin.id,
        status: "CONFIRMED",
        items: { create: [{ productId: prodKeyboard.id, quantity: 2, type: "DECREASE" }] },
      },
    });
    await prisma.stockLedger.create({
      data: {
        productId: prodKeyboard.id,
        locationId: locA.id,
        operationType: "ADJUSTMENT_OUT",
        quantityChange: -2,
        quantityBefore: 5,
        quantityAfter: 3,
        referenceType: "Adjustment",
        referenceId: adj1.id,
        performedById: admin.id,
        createdAt: new Date(Date.now() - 86400000),
      },
    });
  }
  console.log("✅ Adjustments seeded");

  console.log("\n🎉 Seed complete!");
  console.log("  Admin login: admin@stocksense.app / admin123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

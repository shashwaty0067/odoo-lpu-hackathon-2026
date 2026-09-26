// app/api/dashboard/route.ts
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-helpers";
import type { DashboardKpis } from "@/lib/types";

export async function GET() {
  try {
    // Get all products with their stock totals
    const productsWithStock = await prisma.product.findMany({
      where: { isActive: true },
      include: { stocks: true },
      select: { id: true, reorderThreshold: true, stocks: { select: { quantity: true } } },
    });

    const stockTotals = productsWithStock.map((p) => ({
      id: p.id,
      reorderThreshold: p.reorderThreshold,
      totalStock: p.stocks.reduce((sum, s) => sum + s.quantity, 0),
    }));

    const totalProductsInStock = stockTotals.filter((p) => p.totalStock > 0).length;
    const lowStockCount = stockTotals.filter(
      (p) => p.totalStock > 0 && p.totalStock <= p.reorderThreshold
    ).length;
    const outOfStockCount = stockTotals.filter((p) => p.totalStock === 0).length;

    const [pendingReceipts, pendingDeliveries, pendingTransfers] = await Promise.all([
      prisma.receipt.count({ where: { status: "DRAFT" } }),
      prisma.delivery.count({ where: { status: "DRAFT" } }),
      prisma.transfer.count({ where: { status: "DRAFT" } }),
    ]);

    const kpis: DashboardKpis = {
      totalProductsInStock,
      lowStockCount,
      outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
    };

    return apiSuccess(kpis);
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch dashboard data", "SERVER_ERROR", 500);
  }
}

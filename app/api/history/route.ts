// app/api/history/route.ts
// Unified activity history view across all document types.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-helpers";
import { toFrontendStatus } from "@/lib/mappers";
import type { RecentActivity } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const type = sp.get("type") ?? undefined;     // Receipt | Delivery | Transfer | Adjustment
    const status = sp.get("status") ?? undefined; // Draft | Done | Canceled
    const dateFrom = sp.get("dateFrom") ?? undefined;
    const dateTo = sp.get("dateTo") ?? undefined;
    const reference = sp.get("reference") ?? undefined;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(sp.get("pageSize") ?? "50", 10)));

    let prismaStatus: "DRAFT" | "CONFIRMED" | "CANCELLED" | undefined;
    if (status === "Draft") prismaStatus = "DRAFT";
    else if (status === "Done") prismaStatus = "CONFIRMED";
    else if (status === "Canceled") prismaStatus = "CANCELLED";

    const dateFilter = dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {};

    const refFilter = reference
      ? { referenceNumber: { contains: reference, mode: "insensitive" as const } }
      : {};

    const activities: RecentActivity[] = [];

    if (!type || type === "Receipt") {
      const receipts = await prisma.receipt.findMany({
        where: {
          ...(prismaStatus ? { status: prismaStatus } : {}),
          ...dateFilter,
          ...refFilter,
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      for (const r of receipts) {
        activities.push({
          id: r.id,
          type: "Receipt",
          reference: r.referenceNumber,
          status: toFrontendStatus(r.status),
          createdAt: r.createdAt.toISOString(),
          description: `Receipt from ${r.supplierName ?? "Unknown"} (${r.items.length} item${r.items.length !== 1 ? "s" : ""})`,
        });
      }
    }

    if (!type || type === "Delivery") {
      const deliveries = await prisma.delivery.findMany({
        where: {
          ...(prismaStatus ? { status: prismaStatus } : {}),
          ...dateFilter,
          ...refFilter,
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      for (const d of deliveries) {
        activities.push({
          id: d.id,
          type: "Delivery",
          reference: d.referenceNumber,
          status: toFrontendStatus(d.status),
          createdAt: d.createdAt.toISOString(),
          description: `Delivery to ${d.customerName ?? "Unknown"} (${d.items.length} item${d.items.length !== 1 ? "s" : ""})`,
        });
      }
    }

    if (!type || type === "Transfer") {
      const transfers = await prisma.transfer.findMany({
        where: {
          ...(prismaStatus ? { status: prismaStatus } : {}),
          ...dateFilter,
          ...refFilter,
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      for (const t of transfers) {
        activities.push({
          id: t.id,
          type: "Transfer",
          reference: t.referenceNumber,
          status: toFrontendStatus(t.status),
          createdAt: t.createdAt.toISOString(),
          description: `Internal transfer (${t.items.length} item${t.items.length !== 1 ? "s" : ""})`,
        });
      }
    }

    if (!type || type === "Adjustment") {
      const adjustments = await prisma.adjustment.findMany({
        where: {
          ...(prismaStatus ? { status: prismaStatus } : {}),
          ...dateFilter,
          ...refFilter,
        },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      });
      for (const a of adjustments) {
        const productName = a.items[0]?.product?.name ?? "Unknown product";
        activities.push({
          id: a.id,
          type: "Adjustment",
          reference: a.referenceNumber,
          status: toFrontendStatus(a.status),
          createdAt: a.createdAt.toISOString(),
          description: `Stock adjustment for ${productName}`,
        });
      }
    }

    // Sort all combined results newest first
    activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const start = (page - 1) * pageSize;
    const paged = activities.slice(start, start + pageSize);

    return apiSuccess({ data: paged, total: activities.length, page, pageSize });
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch history", "SERVER_ERROR", 500);
  }
}

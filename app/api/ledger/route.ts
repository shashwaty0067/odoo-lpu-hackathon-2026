// app/api/ledger/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapLedgerEntry } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";
import type { LedgerOperationType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const productId = sp.get("productId") ?? undefined;
    const locationId = sp.get("locationId") ?? undefined;
    const operationType = sp.get("operationType") ?? undefined;
    const dateFrom = sp.get("dateFrom") ?? undefined;
    const dateTo = sp.get("dateTo") ?? undefined;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20", 10)));

    // Map frontend operationType to DB (may need multiple DB types)
    let dbOperationTypes: LedgerOperationType[] | undefined;
    if (operationType === "RECEIPT") dbOperationTypes = ["RECEIPT"];
    else if (operationType === "DELIVERY") dbOperationTypes = ["DELIVERY"];
    else if (operationType === "TRANSFER") dbOperationTypes = ["TRANSFER_IN", "TRANSFER_OUT"];
    else if (operationType === "ADJUSTMENT") dbOperationTypes = ["ADJUSTMENT_IN", "ADJUSTMENT_OUT"];

    const where = {
      ...(productId ? { productId } : {}),
      ...(locationId ? { locationId } : {}),
      ...(dbOperationTypes ? { operationType: { in: dbOperationTypes } } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
    };

    const [total, entries] = await Promise.all([
      prisma.stockLedger.count({ where }),
      prisma.stockLedger.findMany({
        where,
        include: {
          product: { include: { category: true, stocks: true } },
          location: { include: { warehouse: true } },
          performedBy: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return apiSuccess({ data: entries.map(mapLedgerEntry), total, page, pageSize });
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch ledger", "SERVER_ERROR", 500);
  }
}

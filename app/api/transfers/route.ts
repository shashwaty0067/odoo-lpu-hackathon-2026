// app/api/transfers/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapTransfer } from "@/lib/mappers";
import { apiError, apiSuccess, getSystemUserId } from "@/lib/api-helpers";

const transferInclude = {
  items: { include: { product: { include: { category: true, stocks: true } } } },
  sourceLocation: { include: { warehouse: true } },
  destinationLocation: { include: { warehouse: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const status = sp.get("status") ?? undefined;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20", 10)));

    let prismaStatus: "DRAFT" | "CONFIRMED" | "CANCELLED" | undefined;
    if (status === "Draft") prismaStatus = "DRAFT";
    else if (status === "Done") prismaStatus = "CONFIRMED";
    else if (status === "Canceled") prismaStatus = "CANCELLED";

    const where = prismaStatus ? { status: prismaStatus } : {};

    const [total, transfers] = await Promise.all([
      prisma.transfer.count({ where }),
      prisma.transfer.findMany({
        where,
        include: transferInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return apiSuccess({ data: transfers.map(mapTransfer), total, page, pageSize });
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch transfers", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, sourceLocationId, destLocationId, items } = body;

    if (!reference?.trim()) return apiError("Reference is required", "VALIDATION_ERROR", 400);
    if (!sourceLocationId) return apiError("Source location is required", "VALIDATION_ERROR", 400);
    if (!destLocationId) return apiError("Destination location is required", "VALIDATION_ERROR", 400);
    if (sourceLocationId === destLocationId)
      return apiError("Source and destination cannot be the same", "VALIDATION_ERROR", 400);
    if (!Array.isArray(items) || items.length === 0)
      return apiError("At least one item is required", "VALIDATION_ERROR", 400);

    for (const item of items) {
      if (!item.productId) return apiError("productId required on each item", "VALIDATION_ERROR", 400);
      if (!item.quantity || Number(item.quantity) <= 0)
        return apiError("quantity must be > 0 on each item", "VALIDATION_ERROR", 400);
    }

    const [srcLoc, dstLoc] = await Promise.all([
      prisma.location.findUnique({ where: { id: sourceLocationId } }),
      prisma.location.findUnique({ where: { id: destLocationId } }),
    ]);
    if (!srcLoc) return apiError("Source location not found", "NOT_FOUND", 404);
    if (!dstLoc) return apiError("Destination location not found", "NOT_FOUND", 404);

    const refExists = await prisma.transfer.findUnique({ where: { referenceNumber: reference.trim() } });
    if (refExists) return apiError("Reference already exists", "DUPLICATE_REF", 409);

    const userId = await getSystemUserId(prisma);
    if (!userId) return apiError("No users found in database. Please seed the database first.", "NO_USER", 400);

    const transfer = await prisma.transfer.create({
      data: {
        referenceNumber: reference.trim(),
        sourceLocationId,
        destinationLocationId: destLocationId,
        createdById: userId,
        status: "DRAFT",
        items: {
          create: items.map((item: { productId: string; quantity: number }) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
          })),
        },
      },
      include: transferInclude,
    });
    return apiSuccess(mapTransfer(transfer), 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create transfer", "SERVER_ERROR", 500);
  }
}

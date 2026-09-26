// app/api/adjustments/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapAdjustment } from "@/lib/mappers";
import { apiError, apiSuccess, getSystemUserId } from "@/lib/api-helpers";

const adjustmentInclude = {
  items: { include: { product: { include: { category: true, stocks: true } } } },
  location: { include: { warehouse: true } },
  createdBy: true,
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

    const [total, adjustments] = await Promise.all([
      prisma.adjustment.count({ where }),
      prisma.adjustment.findMany({
        where,
        include: adjustmentInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return apiSuccess({ data: adjustments.map(mapAdjustment), total, page, pageSize });
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch adjustments", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, locationId, productId, countedQuantity, reason } = body;

    if (!reference?.trim()) return apiError("Reference is required", "VALIDATION_ERROR", 400);
    if (!locationId) return apiError("Location is required", "VALIDATION_ERROR", 400);
    if (!productId) return apiError("Product is required", "VALIDATION_ERROR", 400);
    if (countedQuantity === undefined || countedQuantity === null)
      return apiError("Counted quantity is required", "VALIDATION_ERROR", 400);
    if (Number(countedQuantity) < 0)
      return apiError("Counted quantity cannot be negative", "VALIDATION_ERROR", 400);

    const locExists = await prisma.location.findUnique({ where: { id: locationId } });
    if (!locExists) return apiError("Location not found", "NOT_FOUND", 404);

    const productExists = await prisma.product.findUnique({ where: { id: productId } });
    if (!productExists) return apiError("Product not found", "NOT_FOUND", 404);

    const refExists = await prisma.adjustment.findUnique({ where: { referenceNumber: reference.trim() } });
    if (refExists) return apiError("Reference already exists", "DUPLICATE_REF", 409);

    // Get current system quantity
    const currentStock = await prisma.stock.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });
    const systemQty = currentStock?.quantity ?? 0;
    const counted = Number(countedQuantity);
    const delta = counted - systemQty;
    const type = delta >= 0 ? "INCREASE" : "DECREASE";
    const absQty = Math.abs(delta);

    const userId = await getSystemUserId(prisma);
    if (!userId) return apiError("No users found in database. Please seed the database first.", "NO_USER", 400);

    const adjustment = await prisma.adjustment.create({
      data: {
        referenceNumber: reference.trim(),
        locationId,
        reason: reason?.trim() ?? null,
        createdById: userId,
        status: "DRAFT",
        items: {
          create: [{ productId, quantity: absQty || 0, type }],
        },
      },
      include: adjustmentInclude,
    });

    // Build a richer mapped response that includes systemQty and countedQty
    const mapped = mapAdjustment(adjustment);
    mapped.systemQuantity = systemQty;
    mapped.countedQuantity = counted;
    mapped.delta = delta;

    return apiSuccess(mapped, 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create adjustment", "SERVER_ERROR", 500);
  }
}

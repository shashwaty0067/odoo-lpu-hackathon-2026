// app/api/deliveries/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapDelivery } from "@/lib/mappers";
import { apiError, apiSuccess, getSystemUserId } from "@/lib/api-helpers";

const deliveryInclude = {
  items: { include: { product: { include: { category: true, stocks: true } } } },
  sourceLocation: { include: { warehouse: true } },
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

    const [total, deliveries] = await Promise.all([
      prisma.delivery.count({ where }),
      prisma.delivery.findMany({
        where,
        include: deliveryInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return apiSuccess({ data: deliveries.map(mapDelivery), total, page, pageSize });
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch deliveries", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer, reference, locationId, items } = body;

    if (!reference?.trim()) return apiError("Reference is required", "VALIDATION_ERROR", 400);
    if (!locationId) return apiError("Source location is required", "VALIDATION_ERROR", 400);
    if (!Array.isArray(items) || items.length === 0)
      return apiError("At least one item is required", "VALIDATION_ERROR", 400);

    for (const item of items) {
      if (!item.productId) return apiError("productId required on each item", "VALIDATION_ERROR", 400);
      if (!item.quantity || Number(item.quantity) <= 0)
        return apiError("quantity must be > 0 on each item", "VALIDATION_ERROR", 400);
    }

    const locExists = await prisma.location.findUnique({ where: { id: locationId } });
    if (!locExists) return apiError("Source location not found", "NOT_FOUND", 404);

    const refExists = await prisma.delivery.findUnique({ where: { referenceNumber: reference.trim() } });
    if (refExists) return apiError("Reference already exists", "DUPLICATE_REF", 409);

    const userId = await getSystemUserId(prisma);
    if (!userId) return apiError("No users found in database. Please seed the database first.", "NO_USER", 400);

    const delivery = await prisma.delivery.create({
      data: {
        referenceNumber: reference.trim(),
        customerName: customer?.trim() ?? null,
        sourceLocationId: locationId,
        createdById: userId,
        status: "DRAFT",
        items: {
          create: items.map((item: { productId: string; quantity: number }) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
          })),
        },
      },
      include: deliveryInclude,
    });
    return apiSuccess(mapDelivery(delivery), 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create delivery", "SERVER_ERROR", 500);
  }
}

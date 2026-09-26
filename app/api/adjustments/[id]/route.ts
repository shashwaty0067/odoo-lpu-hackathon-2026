// app/api/adjustments/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapAdjustment } from "@/lib/mappers";
import { apiError, apiSuccess, getSystemUserId } from "@/lib/api-helpers";

const adjustmentInclude = {
  items: { include: { product: { include: { category: true, stocks: true } } } },
  location: { include: { warehouse: true } },
  createdBy: true,
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adj = await prisma.adjustment.findUnique({ where: { id }, include: adjustmentInclude });
    if (!adj) return apiError("Adjustment not found", "NOT_FOUND", 404);
    return apiSuccess(mapAdjustment(adj));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch adjustment", "SERVER_ERROR", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const adj = await prisma.adjustment.findUnique({ where: { id }, include: adjustmentInclude });
    if (!adj) return apiError("Adjustment not found", "NOT_FOUND", 404);

    // ---- VALIDATE / CONFIRM ----
    if (action === "validate" || action === "confirm") {
      if (adj.status !== "DRAFT")
        return apiError(
          adj.status === "CONFIRMED" ? "Adjustment is already validated" : "Cannot validate a cancelled adjustment",
          "INVALID_STATUS",
          409
        );
      if (adj.items.length === 0)
        return apiError("Adjustment has no items", "VALIDATION_ERROR", 400);

      const userId = await getSystemUserId(prisma);

      const updated = await prisma.$transaction(async (tx) => {
        for (const item of adj.items) {
          const existingStock = await tx.stock.findUnique({
            where: { productId_locationId: { productId: item.productId, locationId: adj.locationId } },
          });
          const qtyBefore = existingStock?.quantity ?? 0;
          // For INCREASE: add quantity; for DECREASE: subtract quantity
          const qtyAfter =
            item.type === "INCREASE" ? qtyBefore + item.quantity : Math.max(0, qtyBefore - item.quantity);
          const quantityChange = qtyAfter - qtyBefore;
          const opType = quantityChange >= 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";

          await tx.stock.upsert({
            where: { productId_locationId: { productId: item.productId, locationId: adj.locationId } },
            create: { productId: item.productId, locationId: adj.locationId, quantity: qtyAfter },
            update: { quantity: qtyAfter },
          });

          await tx.stockLedger.create({
            data: {
              productId: item.productId,
              locationId: adj.locationId,
              operationType: opType,
              quantityChange: quantityChange,
              quantityBefore: qtyBefore,
              quantityAfter: qtyAfter,
              referenceType: "Adjustment",
              referenceId: adj.id,
              performedById: userId,
            },
          });
        }

        return tx.adjustment.update({
          where: { id },
          data: { status: "CONFIRMED" },
          include: adjustmentInclude,
        });
      });

      return apiSuccess(mapAdjustment(updated));
    }

    // ---- CANCEL ----
    if (action === "cancel") {
      if (adj.status === "CONFIRMED")
        return apiError("Cannot cancel a confirmed adjustment", "ALREADY_CONFIRMED", 409);
      const updated = await prisma.adjustment.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: adjustmentInclude,
      });
      return apiSuccess(mapAdjustment(updated));
    }

    return apiError("Invalid action", "VALIDATION_ERROR", 400);
  } catch (e) {
    console.error(e);
    return apiError("Failed to update adjustment", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adj = await prisma.adjustment.findUnique({ where: { id } });
    if (!adj) return apiError("Adjustment not found", "NOT_FOUND", 404);
    if (adj.status === "CONFIRMED")
      return apiError("Cannot delete a confirmed adjustment", "INVALID_STATUS", 409);
    await prisma.adjustment.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (e) {
    console.error(e);
    return apiError("Failed to delete adjustment", "SERVER_ERROR", 500);
  }
}

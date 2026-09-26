// app/api/deliveries/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapDelivery } from "@/lib/mappers";
import { apiError, apiSuccess, getSystemUserId } from "@/lib/api-helpers";

const deliveryInclude = {
  items: { include: { product: { include: { category: true, stocks: true } } } },
  sourceLocation: { include: { warehouse: true } },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const delivery = await prisma.delivery.findUnique({ where: { id }, include: deliveryInclude });
    if (!delivery) return apiError("Delivery not found", "NOT_FOUND", 404);
    return apiSuccess(mapDelivery(delivery));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch delivery", "SERVER_ERROR", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, customer, reference } = body;

    const delivery = await prisma.delivery.findUnique({ where: { id }, include: deliveryInclude });
    if (!delivery) return apiError("Delivery not found", "NOT_FOUND", 404);

    // ---- VALIDATE / CONFIRM ----
    if (action === "validate" || action === "confirm") {
      if (delivery.status !== "DRAFT") {
        return apiError(
          delivery.status === "CONFIRMED"
            ? "Delivery is already validated"
            : "Cannot validate a cancelled delivery",
          "INVALID_STATUS",
          409
        );
      }
      if (delivery.items.length === 0)
        return apiError("Delivery has no items", "VALIDATION_ERROR", 400);

      // Check stock availability BEFORE starting transaction
      for (const item of delivery.items) {
        const stock = await prisma.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: delivery.sourceLocationId,
            },
          },
        });
        const available = stock?.quantity ?? 0;
        if (item.quantity > available) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          return apiError(
            `Insufficient stock for ${product?.name ?? item.productId}. Available: ${available}, requested: ${item.quantity}.`,
            "INSUFFICIENT_STOCK",
            409
          );
        }
      }

      const userId = await getSystemUserId(prisma);

      const updated = await prisma.$transaction(async (tx) => {
        for (const item of delivery.items) {
          const existing = await tx.stock.findUnique({
            where: { productId_locationId: { productId: item.productId, locationId: delivery.sourceLocationId } },
          });
          const qtyBefore = existing?.quantity ?? 0;
          const qtyAfter = qtyBefore - item.quantity;

          if (qtyAfter < 0) throw new Error(`INSUFFICIENT_STOCK:${item.productId}`);

          await tx.stock.update({
            where: { productId_locationId: { productId: item.productId, locationId: delivery.sourceLocationId } },
            data: { quantity: qtyAfter },
          });

          await tx.stockLedger.create({
            data: {
              productId: item.productId,
              locationId: delivery.sourceLocationId,
              operationType: "DELIVERY",
              quantityChange: -item.quantity,
              quantityBefore: qtyBefore,
              quantityAfter: qtyAfter,
              referenceType: "Delivery",
              referenceId: delivery.id,
              performedById: userId,
            },
          });
        }

        return tx.delivery.update({
          where: { id },
          data: { status: "CONFIRMED", deliveredAt: new Date() },
          include: deliveryInclude,
        });
      });

      return apiSuccess(mapDelivery(updated));
    }

    // ---- CANCEL ----
    if (action === "cancel") {
      if (delivery.status === "CONFIRMED")
        return apiError(
          "Cannot cancel a completed delivery. Please create a return receipt.",
          "ALREADY_CONFIRMED",
          409
        );
      const updated = await prisma.delivery.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: deliveryInclude,
      });
      return apiSuccess(mapDelivery(updated));
    }

    // ---- Field update (Draft only) ----
    if (delivery.status !== "DRAFT")
      return apiError("Only draft deliveries can be modified", "INVALID_STATUS", 409);

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        ...(customer !== undefined ? { customerName: customer?.trim() ?? null } : {}),
        ...(reference ? { referenceNumber: reference.trim() } : {}),
      },
      include: deliveryInclude,
    });
    return apiSuccess(mapDelivery(updated));
  } catch (e) {
    console.error(e);
    return apiError("Failed to update delivery", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) return apiError("Delivery not found", "NOT_FOUND", 404);
    if (delivery.status === "CONFIRMED")
      return apiError("Cannot delete a confirmed delivery", "INVALID_STATUS", 409);
    await prisma.delivery.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (e) {
    console.error(e);
    return apiError("Failed to delete delivery", "SERVER_ERROR", 500);
  }
}

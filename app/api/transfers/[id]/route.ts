// app/api/transfers/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapTransfer } from "@/lib/mappers";
import { apiError, apiSuccess, getSystemUserId } from "@/lib/api-helpers";

const transferInclude = {
  items: { include: { product: { include: { category: true, stocks: true } } } },
  sourceLocation: { include: { warehouse: true } },
  destinationLocation: { include: { warehouse: true } },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transfer = await prisma.transfer.findUnique({ where: { id }, include: transferInclude });
    if (!transfer) return apiError("Transfer not found", "NOT_FOUND", 404);
    return apiSuccess(mapTransfer(transfer));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch transfer", "SERVER_ERROR", 500);
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

    const transfer = await prisma.transfer.findUnique({ where: { id }, include: transferInclude });
    if (!transfer) return apiError("Transfer not found", "NOT_FOUND", 404);

    // ---- VALIDATE / CONFIRM ----
    if (action === "validate" || action === "confirm") {
      if (transfer.status !== "DRAFT") {
        return apiError(
          transfer.status === "CONFIRMED"
            ? "Transfer is already validated"
            : "Cannot validate a cancelled transfer",
          "INVALID_STATUS",
          409
        );
      }
      if (transfer.items.length === 0)
        return apiError("Transfer has no items", "VALIDATION_ERROR", 400);

      // Pre-check stock availability
      for (const item of transfer.items) {
        const stock = await prisma.stock.findUnique({
          where: { productId_locationId: { productId: item.productId, locationId: transfer.sourceLocationId } },
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
        for (const item of transfer.items) {
          // Source stock decrease
          const srcStock = await tx.stock.findUnique({
            where: { productId_locationId: { productId: item.productId, locationId: transfer.sourceLocationId } },
          });
          const srcBefore = srcStock?.quantity ?? 0;
          const srcAfter = srcBefore - item.quantity;
          if (srcAfter < 0) throw new Error(`INSUFFICIENT_STOCK:${item.productId}`);

          await tx.stock.update({
            where: { productId_locationId: { productId: item.productId, locationId: transfer.sourceLocationId } },
            data: { quantity: srcAfter },
          });

          // Source ledger entry
          await tx.stockLedger.create({
            data: {
              productId: item.productId,
              locationId: transfer.sourceLocationId,
              operationType: "TRANSFER_OUT",
              quantityChange: -item.quantity,
              quantityBefore: srcBefore,
              quantityAfter: srcAfter,
              referenceType: "Transfer",
              referenceId: transfer.id,
              performedById: userId,
            },
          });

          // Destination stock increase
          const dstStock = await tx.stock.findUnique({
            where: { productId_locationId: { productId: item.productId, locationId: transfer.destinationLocationId } },
          });
          const dstBefore = dstStock?.quantity ?? 0;
          const dstAfter = dstBefore + item.quantity;

          await tx.stock.upsert({
            where: { productId_locationId: { productId: item.productId, locationId: transfer.destinationLocationId } },
            create: { productId: item.productId, locationId: transfer.destinationLocationId, quantity: dstAfter },
            update: { quantity: dstAfter },
          });

          // Destination ledger entry
          await tx.stockLedger.create({
            data: {
              productId: item.productId,
              locationId: transfer.destinationLocationId,
              operationType: "TRANSFER_IN",
              quantityChange: item.quantity,
              quantityBefore: dstBefore,
              quantityAfter: dstAfter,
              referenceType: "Transfer",
              referenceId: transfer.id,
              performedById: userId,
            },
          });
        }

        return tx.transfer.update({
          where: { id },
          data: { status: "CONFIRMED", transferredAt: new Date() },
          include: transferInclude,
        });
      });

      return apiSuccess(mapTransfer(updated));
    }

    // ---- CANCEL ----
    if (action === "cancel") {
      if (transfer.status === "CONFIRMED")
        return apiError("Cannot cancel a completed transfer", "ALREADY_CONFIRMED", 409);
      const updated = await prisma.transfer.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: transferInclude,
      });
      return apiSuccess(mapTransfer(updated));
    }

    return apiError("Invalid action", "VALIDATION_ERROR", 400);
  } catch (e) {
    console.error(e);
    return apiError("Failed to update transfer", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transfer = await prisma.transfer.findUnique({ where: { id } });
    if (!transfer) return apiError("Transfer not found", "NOT_FOUND", 404);
    if (transfer.status === "CONFIRMED")
      return apiError("Cannot delete a confirmed transfer", "INVALID_STATUS", 409);
    await prisma.transfer.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (e) {
    console.error(e);
    return apiError("Failed to delete transfer", "SERVER_ERROR", 500);
  }
}

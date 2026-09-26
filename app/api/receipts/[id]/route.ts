// app/api/receipts/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapReceipt } from "@/lib/mappers";
import { apiError, apiSuccess, getSystemUserId } from "@/lib/api-helpers";

const receiptInclude = {
  items: { include: { product: { include: { category: true, stocks: true } } } },
  destinationLocation: { include: { warehouse: true } },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receipt = await prisma.receipt.findUnique({ where: { id }, include: receiptInclude });
    if (!receipt) return apiError("Receipt not found", "NOT_FOUND", 404);
    return apiSuccess(mapReceipt(receipt));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch receipt", "SERVER_ERROR", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, supplier, reference } = body;

    const receipt = await prisma.receipt.findUnique({ where: { id }, include: receiptInclude });
    if (!receipt) return apiError("Receipt not found", "NOT_FOUND", 404);

    // ---- VALIDATE / CONFIRM action (marks receipt as Done) ----
    if (action === "validate" || action === "confirm") {
      if (receipt.status !== "DRAFT") {
        return apiError(
          receipt.status === "CONFIRMED"
            ? "Receipt is already validated"
            : "Cannot validate a cancelled receipt",
          "INVALID_STATUS",
          409
        );
      }
      if (receipt.items.length === 0)
        return apiError("Receipt has no items", "VALIDATION_ERROR", 400);

      const userId = await getSystemUserId(prisma);

      // Atomic transaction: update stock + ledger + status
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of receipt.items) {
          // Upsert stock
          const existing = await tx.stock.findUnique({
            where: { productId_locationId: { productId: item.productId, locationId: receipt.destinationLocationId } },
          });
          const qtyBefore = existing?.quantity ?? 0;
          const qtyAfter = qtyBefore + item.quantity;

          await tx.stock.upsert({
            where: { productId_locationId: { productId: item.productId, locationId: receipt.destinationLocationId } },
            create: { productId: item.productId, locationId: receipt.destinationLocationId, quantity: qtyAfter },
            update: { quantity: qtyAfter },
          });

          // Ledger entry
          await tx.stockLedger.create({
            data: {
              productId: item.productId,
              locationId: receipt.destinationLocationId,
              operationType: "RECEIPT",
              quantityChange: item.quantity,
              quantityBefore: qtyBefore,
              quantityAfter: qtyAfter,
              referenceType: "Receipt",
              referenceId: receipt.id,
              performedById: userId,
            },
          });
        }

        return tx.receipt.update({
          where: { id },
          data: { status: "CONFIRMED", receivedAt: new Date() },
          include: receiptInclude,
        });
      });

      return apiSuccess(mapReceipt(updated));
    }

    // ---- CANCEL action ----
    if (action === "cancel") {
      if (receipt.status === "CONFIRMED")
        return apiError(
          "This receipt has already been validated. Cancelling it requires a reversal adjustment — please contact your administrator.",
          "ALREADY_CONFIRMED",
          409
        );
      const updated = await prisma.receipt.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: receiptInclude,
      });
      return apiSuccess(mapReceipt(updated));
    }

    // ---- Field updates (Draft only) ----
    if (receipt.status !== "DRAFT")
      return apiError("Only draft receipts can be modified", "INVALID_STATUS", 409);

    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        ...(supplier !== undefined ? { supplierName: supplier?.trim() ?? null } : {}),
        ...(reference ? { referenceNumber: reference.trim() } : {}),
      },
      include: receiptInclude,
    });
    return apiSuccess(mapReceipt(updated));
  } catch (e) {
    console.error(e);
    return apiError("Failed to update receipt", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) return apiError("Receipt not found", "NOT_FOUND", 404);
    if (receipt.status === "CONFIRMED")
      return apiError("Cannot delete a confirmed receipt", "INVALID_STATUS", 409);
    await prisma.receipt.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (e) {
    console.error(e);
    return apiError("Failed to delete receipt", "SERVER_ERROR", 500);
  }
}

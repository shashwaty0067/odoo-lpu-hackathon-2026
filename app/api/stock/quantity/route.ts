// app/api/stock/quantity/route.ts
// Returns the current system quantity for a specific product+location pair.
// Used by the new adjustment page to pre-fill the system quantity.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const productId = sp.get("productId");
    const locationId = sp.get("locationId");

    if (!productId || !locationId) {
      return apiError("productId and locationId are required", "VALIDATION_ERROR", 400);
    }

    const stock = await prisma.stock.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });
    return apiSuccess({ quantity: stock?.quantity ?? 0 });
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch quantity", "SERVER_ERROR", 500);
  }
}

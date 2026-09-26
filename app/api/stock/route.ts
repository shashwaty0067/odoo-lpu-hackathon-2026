// app/api/stock/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapStock } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const productId = sp.get("productId") ?? undefined;
    const locationId = sp.get("locationId") ?? undefined;
    const warehouseId = sp.get("warehouseId") ?? undefined;
    const search = sp.get("search") ?? undefined;

    const stock = await prisma.stock.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(locationId ? { locationId } : {}),
        ...(warehouseId ? { location: { warehouseId } } : {}),
        ...(search
          ? {
              OR: [
                { product: { name: { contains: search, mode: "insensitive" } } },
                { product: { sku: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        location: { include: { warehouse: true } },
      },
      orderBy: [{ location: { warehouse: { name: "asc" } } }, { location: { name: "asc" } }],
    });
    return apiSuccess(stock.map(mapStock));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch stock", "SERVER_ERROR", 500);
  }
}

// app/api/locations/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapLocation } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const warehouseId = sp.get("warehouseId") ?? undefined;

    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: { warehouse: true },
      orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
    });
    return apiSuccess(locations.map(mapLocation));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch locations", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { warehouseId, name, code } = body;

    if (!warehouseId) return apiError("warehouseId is required", "VALIDATION_ERROR", 400);
    if (!name?.trim()) return apiError("Name is required", "VALIDATION_ERROR", 400);
    if (!code?.trim()) return apiError("Code is required", "VALIDATION_ERROR", 400);

    const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!wh) return apiError("Warehouse not found", "NOT_FOUND", 404);

    const existing = await prisma.location.findUnique({
      where: { warehouseId_code: { warehouseId, code: code.trim() } },
    });
    if (existing) return apiError("Location code already exists in this warehouse", "DUPLICATE_CODE", 409);

    const location = await prisma.location.create({
      data: { warehouseId, name: name.trim(), code: code.trim() },
      include: { warehouse: true },
    });
    return apiSuccess(mapLocation(location), 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create location", "SERVER_ERROR", 500);
  }
}

// app/api/warehouses/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapWarehouse } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wh = await prisma.warehouse.findUnique({
      where: { id },
      include: { locations: { where: { isActive: true }, orderBy: { name: "asc" } } },
    });
    if (!wh) return apiError("Warehouse not found", "NOT_FOUND", 404);
    return apiSuccess(mapWarehouse(wh));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch warehouse", "SERVER_ERROR", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, address } = body;
    const wh = await prisma.warehouse.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(address !== undefined ? { address: address?.trim() } : {}),
      },
      include: { locations: { where: { isActive: true } } },
    });
    return apiSuccess(mapWarehouse(wh));
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Warehouse not found", "NOT_FOUND", 404);
    }
    console.error(e);
    return apiError("Failed to update warehouse", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.warehouse.update({ where: { id }, data: { isActive: false } });
    return apiSuccess({ success: true });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Warehouse not found", "NOT_FOUND", 404);
    }
    console.error(e);
    return apiError("Failed to delete warehouse", "SERVER_ERROR", 500);
  }
}

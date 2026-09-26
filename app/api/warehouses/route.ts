// app/api/warehouses/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapWarehouse } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: { locations: { where: { isActive: true }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });
    return apiSuccess(warehouses.map(mapWarehouse));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch warehouses", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, address } = body;
    if (!name?.trim()) return apiError("Name is required", "VALIDATION_ERROR", 400);
    if (!code?.trim()) return apiError("Code is required", "VALIDATION_ERROR", 400);

    const existing = await prisma.warehouse.findUnique({ where: { code: code.trim() } });
    if (existing) return apiError("Warehouse code already exists", "DUPLICATE_CODE", 409);

    const warehouse = await prisma.warehouse.create({
      data: { name: name.trim(), code: code.trim(), address: address?.trim() },
      include: { locations: true },
    });
    return apiSuccess(mapWarehouse(warehouse), 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create warehouse", "SERVER_ERROR", 500);
  }
}

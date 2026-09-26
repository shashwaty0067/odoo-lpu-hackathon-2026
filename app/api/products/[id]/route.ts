// app/api/products/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapProduct } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, stocks: { include: { location: { include: { warehouse: true } } } } },
    });
    if (!product) return apiError("Product not found", "NOT_FOUND", 404);
    return apiSuccess(mapProduct(product));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch product", "SERVER_ERROR", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sku, name, categoryId, unitOfMeasure, reorderThreshold } = body;

    if (sku) {
      const dup = await prisma.product.findFirst({ where: { sku: sku.trim(), NOT: { id } } });
      if (dup) return apiError("SKU already exists", "DUPLICATE_SKU", 409);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(sku ? { sku: sku.trim() } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(unitOfMeasure ? { unit: unitOfMeasure.trim() } : {}),
        ...(reorderThreshold !== undefined ? { reorderThreshold: Number(reorderThreshold) } : {}),
      },
      include: { category: true, stocks: true },
    });
    return apiSuccess(mapProduct(product));
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Product not found", "NOT_FOUND", 404);
    }
    console.error(e);
    return apiError("Failed to update product", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Soft delete
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return apiSuccess({ success: true });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Product not found", "NOT_FOUND", 404);
    }
    console.error(e);
    return apiError("Failed to delete product", "SERVER_ERROR", 500);
  }
}

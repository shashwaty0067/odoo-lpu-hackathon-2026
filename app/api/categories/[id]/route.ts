// app/api/categories/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapCategory } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return apiError("Category name is required", "VALIDATION_ERROR", 400);
    }
    const existing = await prisma.category.findFirst({
      where: { name: { equals: name.trim(), mode: "insensitive" }, NOT: { id } },
    });
    if (existing) {
      return apiError("A category with this name already exists", "DUPLICATE_NAME", 409);
    }
    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });
    return apiSuccess(mapCategory(category));
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Category not found", "NOT_FOUND", 404);
    }
    console.error(e);
    return apiError("Failed to update category", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Category not found", "NOT_FOUND", 404);
    }
    console.error(e);
    return apiError("Failed to delete category", "SERVER_ERROR", 500);
  }
}

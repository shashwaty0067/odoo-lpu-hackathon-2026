// app/api/categories/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapCategory } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return apiSuccess(categories.map(mapCategory));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch categories", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return apiError("Category name is required", "VALIDATION_ERROR", 400);
    }
    const existing = await prisma.category.findFirst({
      where: { name: { equals: name.trim(), mode: "insensitive" } },
    });
    if (existing) {
      return apiError("A category with this name already exists", "DUPLICATE_NAME", 409);
    }
    const category = await prisma.category.create({
      data: { name: name.trim() },
    });
    return apiSuccess(mapCategory(category), 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create category", "SERVER_ERROR", 500);
  }
}

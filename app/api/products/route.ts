// app/api/products/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapProduct } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const search = sp.get("search") ?? undefined;
    const category = sp.get("category") ?? undefined;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20", 10)));

    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { sku: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(category ? { categoryId: category } : {}),
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: true, stocks: true },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return apiSuccess({
      data: products.map(mapProduct),
      total,
      page,
      pageSize,
    });
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch products", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku, name, categoryId, unitOfMeasure, reorderThreshold } = body;

    if (!sku?.trim()) return apiError("SKU is required", "VALIDATION_ERROR", 400);
    if (!name?.trim()) return apiError("Name is required", "VALIDATION_ERROR", 400);
    if (!categoryId) return apiError("Category is required", "VALIDATION_ERROR", 400);
    if (!unitOfMeasure?.trim()) return apiError("Unit of measure is required", "VALIDATION_ERROR", 400);

    const existing = await prisma.product.findUnique({ where: { sku: sku.trim() } });
    if (existing) return apiError("SKU already exists", "DUPLICATE_SKU", 409);

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return apiError("Category not found", "NOT_FOUND", 404);

    const product = await prisma.product.create({
      data: {
        sku: sku.trim(),
        name: name.trim(),
        categoryId,
        unit: unitOfMeasure.trim(),   // frontend: unitOfMeasure → DB: unit
        reorderThreshold: Number(reorderThreshold ?? 0),
      },
      include: { category: true, stocks: true },
    });

    return apiSuccess(mapProduct(product), 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create product", "SERVER_ERROR", 500);
  }
}

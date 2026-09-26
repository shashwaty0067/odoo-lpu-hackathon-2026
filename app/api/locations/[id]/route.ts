// app/api/locations/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapLocation } from "@/lib/mappers";
import { apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loc = await prisma.location.findUnique({
      where: { id },
      include: { warehouse: true },
    });
    if (!loc) return apiError("Location not found", "NOT_FOUND", 404);
    return apiSuccess(mapLocation(loc));
  } catch (e) {
    console.error(e);
    return apiError("Failed to fetch location", "SERVER_ERROR", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;
    const loc = await prisma.location.update({
      where: { id },
      data: { ...(name ? { name: name.trim() } : {}) },
      include: { warehouse: true },
    });
    return apiSuccess(mapLocation(loc));
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Location not found", "NOT_FOUND", 404);
    }
    console.error(e);
    return apiError("Failed to update location", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.location.update({ where: { id }, data: { isActive: false } });
    return apiSuccess({ success: true });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Location not found", "NOT_FOUND", 404);
    }
    console.error(e);
    return apiError("Failed to delete location", "SERVER_ERROR", 500);
  }
}

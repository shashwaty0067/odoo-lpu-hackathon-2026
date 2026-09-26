// app/api/auth/signup/route.ts
// Handles new user registration. Hashes the password before storing.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-helpers";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name?.trim()) return apiError("Name is required", "VALIDATION_ERROR", 400);
    if (!email?.trim()) return apiError("Email is required", "VALIDATION_ERROR", 400);
    if (!password || password.length < 6)
      return apiError("Password must be at least 6 characters", "VALIDATION_ERROR", 400);

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) return apiError("An account with this email already exists", "DUPLICATE_EMAIL", 409);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        role: "STAFF",
      },
    });

    return apiSuccess({ success: true }, 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create account", "SERVER_ERROR", 500);
  }
}

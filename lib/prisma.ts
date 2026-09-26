// lib/prisma.ts
// Singleton Prisma Client for the StockSense app.
// Next.js dev mode hot-reload creates new module instances, so we
// store the client on globalThis to avoid "too many clients" warnings.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

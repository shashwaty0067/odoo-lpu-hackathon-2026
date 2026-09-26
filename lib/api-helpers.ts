// lib/api-helpers.ts
// Shared helpers for Next.js App Router route handlers.

export function apiError(message: string, code: string, status: number) {
  return Response.json({ message, code }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

/** Extracts a system user id for ledger entries.
 *  In a real app this would come from the session.
 *  We fall back to a stored system user to avoid null violations.
 */
export async function getSystemUserId(prisma: import("@prisma/client").PrismaClient): Promise<string | null> {
  const user = await prisma.user.findFirst({ select: { id: true } });
  return user?.id ?? null;
}

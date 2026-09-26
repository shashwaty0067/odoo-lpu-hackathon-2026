// ============================================================
// StockSense — Auth helper stubs
// These are placeholders that mirror the shape of Auth.js v5
// (NextAuth). When the real Auth.js backend is wired up, the
// teammate needs only to replace these exports with the real ones
// from their `auth.ts` config (e.g. `export { auth } from './auth'`).
// ============================================================

import { User } from "./types";

// Shape of the session returned by useSession() / auth()
export interface Session {
  user: Pick<User, "id" | "name" | "email" | "role">;
  expires: string;
}

// Server-side session helper — used in Server Components / Server Actions
// Replace with `import { auth } from "@/auth"` when Auth.js is configured
export async function getServerSession(): Promise<Session | null> {
  // Mock: always return a logged-in admin session so UI is explorable
  // Remove this mock and import the real `auth()` from Auth.js
  return {
    user: {
      id: "mock-user-1",
      name: "Demo User",
      email: "demo@stocksense.app",
      role: "ADMIN",
    },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };
}

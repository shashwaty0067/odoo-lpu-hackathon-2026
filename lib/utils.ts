// ============================================================
// lib/utils.ts — shared utility helpers
// ============================================================

/**
 * Format a date string into a short human-readable string.
 * e.g. "Sep 26, 2024 · 11:30 AM"
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date-only string.
 * e.g. "Sep 26, 2024"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Return a signed quantity string, e.g. "+50" or "-10" or "0".
 */
export function signedQty(qty: number): string {
  if (qty > 0) return `+${qty}`;
  return String(qty);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a simple reference code with a prefix and timestamp suffix.
 * e.g. generateRef("REC") → "REC-2024-0042"
 */
export function generateRef(prefix: string): string {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-4);
  return `${prefix}-${year}-${suffix}`;
}

/**
 * Truncate a long string with ellipsis.
 */
export function truncate(str: string, maxLen = 40): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

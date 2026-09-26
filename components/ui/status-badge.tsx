// ============================================================
// StatusBadge — single shared component for document statuses.
// Used on every list page / detail page; keeps styling in one place.
// ============================================================

import { DocumentStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

const STATUS_STYLES: Record<DocumentStatus, string> = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Waiting: "bg-blue-50 text-blue-700 border-blue-200",
  Ready: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Canceled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_DOTS: Record<DocumentStatus, string> = {
  Draft: "bg-slate-400",
  Waiting: "bg-blue-500",
  Ready: "bg-indigo-500",
  Done: "bg-emerald-500",
  Canceled: "bg-red-500",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status]}`} />
      {status}
    </span>
  );
}

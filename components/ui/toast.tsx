"use client";

// ============================================================
// Toast notification system
// A minimal, self-contained toast stack — no external library.
// Usage:
//   const { toast } = useToast();
//   toast({ message: "Saved!", type: "success" });
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (opts: { message: string; type?: ToastType }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    ({ message, type = "info" }: { message: string; type?: ToastType }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      // Auto-dismiss after 4 s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack rendered at bottom-right */}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
}) {
  const colors: Record<ToastType, string> = {
    success: "bg-emerald-600 border-emerald-500",
    error: "bg-red-600 border-red-500",
    warning: "bg-amber-500 border-amber-400",
    info: "bg-slate-700 border-slate-600",
  };
  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm px-4 py-3 rounded-lg border text-white shadow-xl text-sm animate-slide-in ${colors[toast.type]}`}
      role="alert"
    >
      <span className="font-bold text-base leading-none mt-0.5">
        {icons[toast.type]}
      </span>
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity font-bold text-base leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

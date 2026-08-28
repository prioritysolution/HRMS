"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error";

type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastInput = {
  title: string;
  message?: string;
};

type ToastContextValue = {
  success: (input: ToastInput | string) => void;
  error: (input: ToastInput | string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4200;

function normalizeInput(input: ToastInput | string): ToastInput {
  return typeof input === "string" ? { title: input } : input;
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), TOAST_DURATION);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = toast.type === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn("toast-card", toast.type === "success" ? "toast-success" : "toast-error")}
      role="status"
      aria-live="polite"
    >
      <div className={cn("toast-icon-wrap", toast.type === "success" ? "is-success" : "is-error")}>
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <div className="toast-content">
        <p className="toast-title">{toast.title}</p>
        {toast.message && <p className="toast-message">{toast.message}</p>}
      </div>
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={16} />
      </button>
      <span className="toast-progress" aria-hidden="true" />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((type: ToastType, input: ToastInput | string) => {
    const payload = normalizeInput(input);
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setToasts((prev) => [...prev, { id, type, ...payload }]);
  }, []);

  const value = useMemo(
    () => ({
      success: (input: ToastInput | string) => push("success", input),
      error: (input: ToastInput | string) => push("error", input),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

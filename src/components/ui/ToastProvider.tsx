"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Headset, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastInput = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = {
  success: (input: ToastInput | string) => void;
  error: (input: ToastInput | string) => void;
  show: (input: ToastInput) => void;
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
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.onAction ? 8000 : TOAST_DURATION);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = toast.type === "success" ? CheckCircle2 : toast.type === "info" ? Headset : AlertCircle;
  const tone = toast.type === "success" ? "is-success" : toast.type === "info" ? "is-info" : "is-error";
  const cardTone = toast.type === "success" ? "toast-success" : toast.type === "info" ? "toast-info" : "toast-error";

  return (
    <div
      className={cn("toast-card", cardTone)}
      role="status"
      aria-live="polite"
    >
      <div className={cn("toast-icon-wrap", tone)}>
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <div className="toast-content">
        <p className="toast-title">{toast.title}</p>
        {toast.message && <p className="toast-message">{toast.message}</p>}
        {toast.actionLabel && toast.onAction ? (
          <button
            type="button"
            className="btn btn-primary btn-sm mt-2"
            onClick={() => {
              toast.onAction?.();
              onDismiss(toast.id);
            }}
          >
            {toast.actionLabel}
          </button>
        ) : null}
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
      show: (input: ToastInput) => push("info", input),
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

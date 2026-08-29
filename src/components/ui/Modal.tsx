"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
  hideHeader?: boolean;
  footerClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "lg",
  hideHeader = false,
  footerClassName,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button type="button" className="modal-backdrop" aria-label="Close modal" onClick={onClose} />
      <div className={cn("modal-dialog", sizes[size])}>
        <div className="modal-content animate-modal-in">
          {!hideHeader && (
            <>
              <div className="modal-header">
                <div>
                  <h2 id="modal-title" className="modal-title">
                    {title}
                  </h2>
                  {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                </div>
                <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <hr className="modal-divider" />
            </>
          )}
          <div className="modal-body">{children}</div>
          {footer && <div className={cn("modal-footer", footerClassName)}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}

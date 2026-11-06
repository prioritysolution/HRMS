"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
  hideHeader?: boolean;
  footerClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
};

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
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
  icon,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    // Helper to find any scrollable element inside the modal (e.g. modal-body or a dropdown list)
    const findScrollableAncestor = (target: HTMLElement | null): HTMLElement | null => {
      let curr = target;
      while (curr && !curr.classList.contains("modal-root")) {
        if (curr.scrollHeight > curr.clientHeight) {
          const style = window.getComputedStyle(curr);
          const overflowY = style.overflowY;
          if (overflowY === "auto" || overflowY === "scroll") {
            return curr;
          }
        }
        curr = curr.parentElement;
      }
      return null;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Prevent background page jumping from Space, PageUp, PageDown, Home, End if focus is outside inputs
      if (["Space", " ", "PageUp", "PageDown", "End", "Home"].includes(e.key)) {
        const target = e.target as HTMLElement | null;
        const isFormInput = target && (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        );
        if (!isFormInput && !target?.closest(".modal-dialog")) {
          e.preventDefault();
        }
      }
    };

    // Lock background scroll without removing the side scrollbar (preventing layout shift / flicker)
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollContainer = findScrollableAncestor(target);

      if (!scrollContainer) {
        e.preventDefault();
        return;
      }

      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;
      const isAtTop = scrollContainer.scrollTop <= 0;
      const isAtBottom =
        Math.ceil(scrollContainer.scrollTop + scrollContainer.clientHeight) >=
        scrollContainer.scrollHeight;

      if ((isScrollingUp && isAtTop) || (isScrollingDown && isAtBottom)) {
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollContainer = findScrollableAncestor(target);
      if (!scrollContainer) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button type="button" className="modal-backdrop" aria-label="Close modal" onClick={onClose} />
      <div className={cn("modal-dialog", sizes[size])}>
        <div className="modal-content animate-modal-in">
          {!hideHeader && (
            <div className="modal-header">
              <div className="modal-header-content">
                {icon ? (
                  <div className="modal-header-icon" aria-hidden="true">
                    {icon}
                  </div>
                ) : null}
                <div className="modal-header-text">
                  <h2 id="modal-title" className="modal-title">
                    {title}
                  </h2>
                  {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={onClose}
                aria-label="Close dialog"
                title="Close"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>
          )}
          <div className="modal-body">{children}</div>
          {footer && <div className={cn("modal-footer", footerClassName)}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}

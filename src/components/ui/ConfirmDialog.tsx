"use client";

import { CircleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "danger" | "default" | "success";
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  variant = "default",
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const confirmButtonClass =
    variant === "danger"
      ? "btn btn-danger confirm-dialog-btn"
      : variant === "success"
        ? "btn btn-success confirm-dialog-btn"
        : "btn btn-primary confirm-dialog-btn";

  const iconClass =
    variant === "danger"
      ? "confirm-dialog-icon is-danger"
      : variant === "success"
        ? "confirm-dialog-icon is-success"
        : "confirm-dialog-icon";

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      size="sm"
      hideHeader
      footerClassName="confirm-dialog-footer"
      footer={
        <>
          <button
            type="button"
            className="btn btn-light confirm-dialog-btn"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmButtonClass}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-dialog-body">
        <div className={iconClass}>
          <CircleAlert size={22} strokeWidth={2.25} />
        </div>
        <h2 id="modal-title" className="confirm-dialog-title">
          {title}
        </h2>
        <div className="confirm-dialog-message">
          {message.split("\n").map((line, index) => (
            <p key={`${index}-${line}`} className="confirm-dialog-message-line">
              {line}
            </p>
          ))}
        </div>
      </div>
    </Modal>
  );
}

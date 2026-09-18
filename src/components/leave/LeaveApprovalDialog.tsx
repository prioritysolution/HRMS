"use client";

import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

type LeaveApprovalDialogProps = {
  open: boolean;
  status: "Approved" | "Rejected";
  applicationLabel: string;
  onClose: () => void;
  onConfirm: (remarks: string) => void | Promise<void>;
};

export function LeaveApprovalDialog({
  open,
  status,
  applicationLabel,
  onClose,
  onConfirm,
}: LeaveApprovalDialogProps) {
  const { t } = useI18n();
  const isReject = status === "Rejected";
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRemarks("");
    setError("");
    setLoading(false);
  }, [open, status, applicationLabel]);

  const handleConfirm = async () => {
    const note = remarks.trim();
    if (isReject && !note) {
      setError(t("leave.approvalDialog.rejectRequired"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onConfirm(note);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("leave.approvalDialog.updateFailed"),
      );
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={
        isReject
          ? t("leave.approvalDialog.rejectTitle")
          : t("leave.approvalDialog.approveTitle")
      }
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
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={cn(
              "confirm-dialog-btn",
              isReject ? "btn btn-danger" : "btn btn-success",
            )}
            onClick={() => void handleConfirm()}
            disabled={loading}
          >
            {loading
              ? t("common.pleaseWait")
              : isReject
                ? t("hrms.ui.reject")
                : t("hrms.ui.approve")}
          </button>
        </>
      }
    >
      <div className="confirm-dialog-body">
        <div className={cn("confirm-dialog-icon", isReject ? "is-danger" : "is-success")}>
          <CircleAlert size={22} strokeWidth={2.25} />
        </div>
        <h2 id="modal-title" className="confirm-dialog-title">
          {isReject
            ? t("leave.approvalDialog.rejectHeading")
            : t("leave.approvalDialog.approveHeading")}
        </h2>
        <p className="confirm-dialog-message">
          {isReject
            ? t("leave.approvalDialog.rejectMessage", { name: applicationLabel })
            : t("leave.approvalDialog.approveMessage", { name: applicationLabel })}
        </p>

        <div className={cn("form-field u-width-full text-start mt-3", error && "is-invalid")}>
          <FormFieldLabel
            htmlFor="leave-approval-remarks"
            label={
              isReject
                ? t("leave.approvalDialog.rejectionReason")
                : t("leave.approvalDialog.remarks")
            }
            required={isReject}
          />
          <textarea
            id="leave-approval-remarks"
            className="form-control"
            rows={3}
            maxLength={500}
            value={remarks}
            placeholder={
              isReject
                ? t("leave.approvalDialog.rejectPlaceholder")
                : t("leave.approvalDialog.approvePlaceholder")
            }
            onChange={(event) => {
              setRemarks(event.target.value);
              if (error) setError("");
            }}
            disabled={loading}
          />
          {error ? (
            <p className="form-field-error" role="alert">
              {error}
            </p>
          ) : (
            <p className="form-text text-muted mb-0">{t("leave.approvalDialog.maxChars")}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

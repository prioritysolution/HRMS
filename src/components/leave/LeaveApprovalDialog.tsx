"use client";

import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
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
      setError("Rejection reason is required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onConfirm(note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update leave application.");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={isReject ? "Reject leave request" : "Approve leave request"}
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
            Cancel
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
            {loading ? "Please wait..." : isReject ? "Reject" : "Approve"}
          </button>
        </>
      }
    >
      <div className="confirm-dialog-body">
        <div className={cn("confirm-dialog-icon", isReject ? "is-danger" : "is-success")}>
          <CircleAlert size={22} strokeWidth={2.25} />
        </div>
        <h2 id="modal-title" className="confirm-dialog-title">
          {isReject ? "Reject this leave request?" : "Approve this leave request?"}
        </h2>
        <p className="confirm-dialog-message">
          {isReject
            ? `Reject ${applicationLabel}? A rejection reason is mandatory.`
            : `Approve ${applicationLabel}? You can add an optional note.`}
        </p>

        <div className={cn("form-field w-100 text-start mt-3", error && "is-invalid")}>
          <FormFieldLabel
            htmlFor="leave-approval-remarks"
            label={isReject ? "Rejection Reason" : "Remarks"}
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
                ? "Enter rejection reason (required)"
                : "Optional approver note"
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
            <p className="form-text text-muted mb-0">Max 500 characters</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useI18n, translateHrmsLookup } from "@/i18n";
import { latestFinancialYear } from "@/lib/leave-module-utils";
import type { HrmsRow } from "@/types/hrms";

export type LeaveEntitlementLeaveLine = {
  Leave_id: string;
  Leave_code: string;
  Leave_name: string;
  Allocated_days: string;
};

type LeaveEntitlementModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: HrmsRow) => void | Promise<void>;
  financialYearOptions: Array<{ value: string; label: string }>;
  leaveTypes: HrmsRow[];
  title?: string;
  subtitle?: string;
  submitLabel?: string;
};

function defaultDaysFromLeave(leave: HrmsRow): string {
  const days = Number(leave.Leave_days ?? leave.Leaves_per_year ?? 0);
  return Number.isFinite(days) && days >= 0 ? String(days) : "0";
}

function buildLeaveLines(leaveTypes: HrmsRow[]): LeaveEntitlementLeaveLine[] {
  return [...leaveTypes]
    .sort((left, right) =>
      String(left.Leave_code ?? left.Leave_name ?? "").localeCompare(
        String(right.Leave_code ?? right.Leave_name ?? ""),
        undefined,
        { sensitivity: "base" },
      ),
    )
    .map((leave) => {
      const id = String(leave.Leave_Id ?? leave.id ?? "").trim();
      const code = String(leave.Leave_code ?? leave.Short_name ?? "").trim();
      const name = String(leave.Leave_name ?? "").trim();
      return {
        Leave_id: id,
        Leave_code: code,
        Leave_name: name,
        Allocated_days: defaultDaysFromLeave(leave),
      };
    })
    .filter((line) => line.Leave_id);
}

export function LeaveEntitlementModal({
  open,
  onClose,
  onSubmit,
  financialYearOptions,
  leaveTypes,
  title,
  subtitle,
  submitLabel,
}: LeaveEntitlementModalProps) {
  const { language, t } = useI18n();
  const [finYear, setFinYear] = useState("");
  const [lines, setLines] = useState<LeaveEntitlementLeaveLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resolvedTitle = title || t("leave.entitlementModal.title");
  const resolvedSubtitle = subtitle || t("leave.entitlementModal.subtitle");
  const resolvedSubmit = submitLabel || t("leave.entitlementModal.submit");

  useEffect(() => {
    if (!open) return;

    const latest = latestFinancialYear(financialYearOptions.map((option) => option.label));
    const matchedYear =
      financialYearOptions.find((option) => option.label === latest) ??
      financialYearOptions[0];

    setFinYear(matchedYear?.value ?? "");
    setLines(buildLeaveLines(leaveTypes));
    setErrors({});
    setSubmitError("");
    setSubmitting(false);
  }, [open, financialYearOptions, leaveTypes]);

  const updateAllocatedDays = (leaveId: string, value: string) => {
    setLines((prev) =>
      prev.map((line) =>
        line.Leave_id === leaveId ? { ...line, Allocated_days: value } : line,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!finYear) nextErrors.Fin_year = t("leave.entitlementModal.yearRequired");
    if (lines.length === 0) nextErrors.Leaves = t("leave.entitlementModal.noTypes");

    for (const line of lines) {
      const allocated = Number(line.Allocated_days);
      if (!Number.isFinite(allocated) || allocated < 0) {
        nextErrors[`Allocated_${line.Leave_id}`] = t("leave.entitlementModal.invalidDays");
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setErrors({});
    try {
      await onSubmit({
        id: "",
        Fin_year: finYear,
        Year_Id: Number(finYear),
        Leaves: JSON.stringify(
          lines.map((line) => ({
            leave_id: Number(line.Leave_id),
            allocated_days: Number(line.Allocated_days || 0),
          })),
        ),
      });
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t("leave.entitlementModal.saveFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? () => undefined : onClose}
      title={resolvedTitle}
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="btn btn-light"
            onClick={onClose}
            disabled={submitting}
          >
            {t("leave.entitlementModal.close")}
          </button>
          <button
            type="submit"
            form="leave-entitlement-form"
            className="btn btn-primary"
            disabled={submitting || lines.length === 0}
          >
            {submitting ? t("leave.entitlementModal.saving") : resolvedSubmit}
          </button>
        </>
      }
    >
      <form id="leave-entitlement-form" onSubmit={(event) => void handleSubmit(event)}>
        {resolvedSubtitle ? <p className="text-muted mb-3">{resolvedSubtitle}</p> : null}

        <div className="form-grid form-grid-2">
          <div className="form-field">
            <FormFieldLabel
              htmlFor="leave-entitlement-year"
              label={t("leave.entitlementModal.financialYear")}
              required
            />
            <SearchableSelect
              id="leave-entitlement-year"
              name="Fin_year"
              value={finYear}
              onChange={setFinYear}
              options={financialYearOptions}
              placeholder={t("leave.entitlementModal.selectYear")}
              searchPlaceholder={t("leave.entitlementModal.searchYear")}
            />
            {errors.Fin_year ? <p className="form-field-error">{errors.Fin_year}</p> : null}
          </div>
        </div>

        <div className="mt-3">
          <div className="table-filters-head mb-2">
            <span className="table-filters-title">{t("leave.entitlementModal.leaveTypes")}</span>
          </div>
          <p className="text-muted small mb-2">{t("leave.entitlementModal.leaveTypesHint")}</p>
          {errors.Leaves ? <p className="form-field-error">{errors.Leaves}</p> : null}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="si-col">SI</th>
                  <th>{translateHrmsLookup(language, "headers", "Leave Type")}</th>
                  <th>{t("leave.entitlementModal.shortName")}</th>
                  <th>{t("leave.entitlementModal.allocatedDays")}</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      {t("leave.entitlementModal.noLeaveTypes")}
                    </td>
                  </tr>
                ) : (
                  lines.map((line, index) => (
                    <tr key={line.Leave_id}>
                      <td className="si-col">{index + 1}</td>
                      <td>{line.Leave_name || "—"}</td>
                      <td>{line.Leave_code || "—"}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step="0.5"
                          className="form-control form-control-sm"
                          value={line.Allocated_days}
                          onChange={(event) =>
                            updateAllocatedDays(line.Leave_id, event.target.value)
                          }
                        />
                        {errors[`Allocated_${line.Leave_id}`] ? (
                          <p className="form-field-error">
                            {errors[`Allocated_${line.Leave_id}`]}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {submitError ? <p className="form-field-error mt-3">{submitError}</p> : null}
      </form>
    </Modal>
  );
}

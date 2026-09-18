"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DataTable,
  SoftStatus,
  type Column,
} from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { getEssModule, getEssFormFields } from "@/config/ess-modules";
import { getEssMockRows } from "@/data/ess-mock";
import {
  useI18n,
  translateEssLookup,
  translateEssDescription,
  translateEssEmpty,
} from "@/i18n";
import { ApiError } from "@/lib/api/client";
import { authService } from "@/lib/api/services/auth.service";
import {
  getEssEmployeeCode,
  getEssEmployeeName,
  isCriticalRequestType,
} from "@/lib/ess-utils";
import { formatDateDisplay } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import type { AuthMeProfile } from "@/lib/api/types";
import type { FormField, HrmsRow, TableColumn } from "@/types/hrms";
import { AlertCircle, Download } from "lucide-react";

type EssModulePageProps = {
  moduleId: string;
  allowAdd?: boolean;
  allowEdit?: boolean;
  showDownloadAction?: boolean;
  headerAction?: React.ReactNode;
  emptyStateMessage?: string;
  modalSubtitle?: string;
  hrApprovalNotice?: boolean;
  loadRows?: (profile: AuthMeProfile | null) => Promise<HrmsRow[]>;
};

function formatCellValue(
  value: HrmsRow[string],
  type: TableColumn["type"] | undefined,
  yesLabel: string,
  noLabel: string,
): string {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "boolean") return value === true || value === "true" || value === 1 ? yesLabel : noLabel;
  if (type === "currency") return `₹${Number(value).toLocaleString("en-IN")}`;
  if (type === "date") return formatDateDisplay(String(value)) || "—";
  return String(value);
}

export function EssModulePage({
  moduleId,
  allowAdd = false,
  allowEdit = false,
  showDownloadAction = false,
  headerAction,
  emptyStateMessage,
  modalSubtitle,
  hrApprovalNotice = false,
  loadRows,
}: EssModulePageProps) {
  const { language, t } = useI18n();
  const config = getEssModule(moduleId);
  const toast = useToast();
  const [profile, setProfile] = useState<AuthMeProfile | null>(null);
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const employeeCode = getEssEmployeeCode(null, profile);
  const employeeName = getEssEmployeeName(profile);
  const title = translateEssLookup(language, "titles", config.title);
  const section = t("ess.section");
  const description = translateEssDescription(language, moduleId);
  const actionLabel = config.actionLabel
    ? translateEssLookup(language, "titles", config.actionLabel)
    : t("ess.ui.addNew");

  const formFields = useMemo((): FormField[] => {
    return getEssFormFields(moduleId).map((field) => ({
      ...field,
      label: translateEssLookup(language, "labels", field.label),
      options: field.options?.map((opt) => {
        if (typeof opt === "string") {
          return translateEssLookup(language, "options", opt);
        }
        return {
          ...opt,
          label: translateEssLookup(language, "options", opt.label),
        };
      }),
    }));
  }, [language, moduleId]);

  const columns = useMemo((): Column<HrmsRow>[] => {
    const yesLabel = t("common.yes");
    const noLabel = t("common.no");
    const cols = config.columns.map((column) => {
      const header = translateEssLookup(language, "headers", column.header);
      if (column.type === "status") {
        return {
          key: column.key,
          header,
          render: (row: HrmsRow) => <SoftStatus value={String(row[column.key] ?? "—")} />,
        };
      }
      return {
        key: column.key,
        header,
        render: (row: HrmsRow) =>
          formatCellValue(row[column.key], column.type, yesLabel, noLabel),
      };
    });

    if (showDownloadAction) {
      cols.push({
        key: "_download",
        header: t("ess.ui.action"),
        render: (row: HrmsRow) => (
          <button
            type="button"
            className="btn btn-sm btn-soft-primary inline-flex items-center gap-1"
            onClick={() => {
              const month = String(row.Payroll_month ?? t("ess.ui.selectedMonth"));
              window.alert(t("ess.ui.downloadAlert", { month }));
            }}
          >
            <Download size={14} />
            {t("ess.download")}
          </button>
        ),
      });
    }

    return cols;
  }, [config.columns, language, showDownloadAction, t]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const me = await authService.getMeProfile();
      setProfile(me);
      if (loadRows) {
        setRows(await loadRows(me));
        return;
      }
      const code = getEssEmployeeCode(null, me);
      setRows(getEssMockRows(moduleId, code));
    } catch (err) {
      setRows(loadRows ? [] : getEssMockRows(moduleId, employeeCode));
      if (loadRows) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t("ess.ui.loadFailed");
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [employeeCode, loadRows, moduleId, t, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial/async data load
    void loadData();
  }, [loadData]);

  const handleSubmit = useCallback(
    (values: HrmsRow) => {
      const enriched: HrmsRow = {
        ...values,
        id: editRow?.id ?? `ess-${Date.now()}`,
        Employee_code: employeeCode,
        Employee_name: employeeName,
        Application_status: values.Application_status ?? "Pending",
        Status: values.Status ?? "Pending",
        Applied_on: values.Applied_on ?? new Date().toISOString().slice(0, 10),
        Submitted_on: values.Submitted_on ?? new Date().toISOString().slice(0, 10),
        Requires_hr_approval: isCriticalRequestType(String(values.Request_type ?? "")),
      };

      if (moduleId === "ess-leave-apply") {
        const from = new Date(String(values.From_date));
        const to = new Date(String(values.To_date));
        const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1);
        enriched.Number_of_days = days;
        enriched.Application_status = "Pending";
      }

      if (editRow) {
        setRows((prev) => prev.map((r) => (r.id === editRow.id ? enriched : r)));
        toast.success(t("ess.ui.recordUpdated"));
      } else {
        setRows((prev) => [enriched, ...prev]);
        if (isCriticalRequestType(String(values.Request_type ?? ""))) {
          toast.success(t("ess.ui.requestSubmittedHr"));
        } else if (moduleId === "ess-leave-apply") {
          toast.success(t("ess.ui.leaveSubmitted"));
        } else {
          toast.success(t("ess.ui.submitted"));
        }
      }

      setAddOpen(false);
      setEditRow(null);
    },
    [editRow, employeeCode, employeeName, moduleId, t, toast],
  );

  const emptyMessage =
    emptyStateMessage ?? translateEssEmpty(language, moduleId, title);

  return (
    <>
      <PageHeader title={title} section={section} action={headerAction} />
      <div className="container-fluid">
        {hrApprovalNotice ? (
          <div className="ess-hr-notice mb-4">
            <AlertCircle size={18} aria-hidden="true" />
            <p>
              {t("ess.ui.hrNoticeBefore")} <strong>{t("ess.ui.hrApproval")}</strong>{" "}
              {t("ess.ui.hrNoticeAfter")}
            </p>
          </div>
        ) : null}

        {description ? <p className="ess-page-description mb-4">{description}</p> : null}

        <DataTable
          columns={columns}
          rows={rows}
          title={title}
          searchPlaceholder={t("ess.ui.searchPlaceholder", { title: title.toLowerCase() })}
          searchKeys={config.searchKeys}
          actionLabel={allowAdd ? actionLabel : undefined}
          onAction={allowAdd ? () => setAddOpen(true) : undefined}
          showRowActions={allowEdit}
          onRowEdit={allowEdit ? (row) => setEditRow(row) : undefined}
          loading={loading}
          emptyStateIcon={getModuleEmptyIcon(moduleId)}
          emptyStateMessage={emptyMessage}
        />
      </div>

      {(allowAdd || allowEdit) && formFields.length > 0 ? (
        <MasterDataModal
          open={addOpen || Boolean(editRow)}
          onClose={() => {
            setAddOpen(false);
            setEditRow(null);
          }}
          title={
            editRow
              ? t("ess.ui.editTitle", { title })
              : t("ess.ui.newTitle", { title })
          }
          subtitle={modalSubtitle ?? description}
          fields={formFields}
          initialValues={editRow ?? undefined}
          onSubmit={handleSubmit}
          submitLabel={editRow ? t("ess.ui.update") : t("ess.ui.submit")}
        />
      ) : null}
    </>
  );
}

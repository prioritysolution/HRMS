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
import { getEssModule, getEssFormFields, getEssModuleDescription } from "@/config/ess-modules";
import { getEssMockRows } from "@/data/ess-mock";
import { authService } from "@/lib/api/services/auth.service";
import {
  getEssEmployeeCode,
  getEssEmployeeName,
  isCriticalRequestType,
} from "@/lib/ess-utils";
import { formatDateDisplay } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import type { AuthMeProfile } from "@/lib/api/types";
import type { HrmsRow, TableColumn } from "@/types/hrms";
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
};

function formatCellValue(value: HrmsRow[string], type?: TableColumn["type"]): string {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "boolean") return value === true || value === "true" || value === 1 ? "Yes" : "No";
  if (type === "currency") return `₹${Number(value).toLocaleString("en-IN")}`;
  if (type === "date") return formatDateDisplay(String(value)) || "—";
  return String(value);
}

function buildColumns(
  configColumns: TableColumn[],
  showDownload?: boolean,
): Column<HrmsRow>[] {
  const cols = configColumns.map((column) => {
    if (column.type === "status") {
      return {
        key: column.key,
        header: column.header,
        render: (row: HrmsRow) => <SoftStatus value={String(row[column.key] ?? "—")} />,
      };
    }
    return {
      key: column.key,
      header: column.header,
      render: (row: HrmsRow) => formatCellValue(row[column.key], column.type),
    };
  });

  if (showDownload) {
    cols.push({
      key: "_download",
      header: "Action",
      render: (row: HrmsRow) => (
        <button
          type="button"
          className="btn btn-sm btn-soft-primary inline-flex items-center gap-1"
          onClick={() => {
            /* demo download */
            window.alert(`Downloading payslip for ${row.Payroll_month ?? "selected month"}…`);
          }}
        >
          <Download size={14} />
          Download
        </button>
      ),
    });
  }

  return cols;
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
}: EssModulePageProps) {
  const config = getEssModule(moduleId);
  const toast = useToast();
  const [profile, setProfile] = useState<AuthMeProfile | null>(null);
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const employeeCode = getEssEmployeeCode(null, profile);
  const employeeName = getEssEmployeeName(profile);
  const formFields = useMemo(() => getEssFormFields(moduleId), [moduleId]);
  const columns = useMemo(
    () => buildColumns(config.columns, showDownloadAction),
    [config.columns, showDownloadAction],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const me = await authService.getMeProfile();
      setProfile(me);
      const code = getEssEmployeeCode(null, me);
      setRows(getEssMockRows(moduleId, code));
    } catch {
      setRows(getEssMockRows(moduleId, employeeCode));
    } finally {
      setLoading(false);
    }
  }, [moduleId, employeeCode]);

  useEffect(() => {
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
        toast.success("Record updated successfully.");
      } else {
        setRows((prev) => [enriched, ...prev]);
        if (isCriticalRequestType(String(values.Request_type ?? ""))) {
          toast.success("Request submitted. Awaiting HR approval.");
        } else if (moduleId === "ess-leave-apply") {
          toast.success("Leave application submitted for approval.");
        } else {
          toast.success("Submitted successfully.");
        }
      }

      setAddOpen(false);
      setEditRow(null);
    },
    [editRow, employeeCode, employeeName, moduleId, toast],
  );

  return (
    <>
      <PageHeader
        title={config.title}
        section={config.section}
        action={headerAction}
      />
      <div className="container-fluid">
        {hrApprovalNotice ? (
          <div className="ess-hr-notice mb-4">
            <AlertCircle size={18} aria-hidden="true" />
            <p>
              Changes to critical information (address, bank details, PAN, etc.) require{" "}
              <strong>HR approval</strong> before they take effect.
            </p>
          </div>
        ) : null}

        {getEssModuleDescription(moduleId) ? (
          <p className="ess-page-description mb-4">{getEssModuleDescription(moduleId)}</p>
        ) : null}

        <DataTable
          columns={columns}
          rows={rows}
          title={config.title}
          searchPlaceholder={`Search ${config.title.toLowerCase()}…`}
          searchKeys={config.searchKeys}
          actionLabel={allowAdd ? "Add New" : undefined}
          onAction={allowAdd ? () => setAddOpen(true) : undefined}
          showRowActions={allowEdit}
          onRowEdit={allowEdit ? (row) => setEditRow(row) : undefined}
          loading={loading}
          emptyStateIcon={getModuleEmptyIcon(moduleId)}
          emptyStateMessage={
            emptyStateMessage ?? `No ${config.title.toLowerCase()} records found.`
          }
        />
      </div>

      {(allowAdd || allowEdit) && formFields.length > 0 ? (
        <MasterDataModal
          open={addOpen || Boolean(editRow)}
          onClose={() => {
            setAddOpen(false);
            setEditRow(null);
          }}
          title={editRow ? `Edit ${config.title}` : `New ${config.title}`}
          subtitle={modalSubtitle ?? getEssModuleDescription(moduleId)}
          fields={formFields}
          initialValues={editRow ?? undefined}
          onSubmit={handleSubmit}
          submitLabel={editRow ? "Update" : "Submit"}
        />
      ) : null}
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getHrmsModule, getModuleFilterFields, getModuleFormFields } from "@/config/hrms-modules";
import { RefreshCw, Eye } from "lucide-react";
import { getHrmsMockRows } from "@/data/hrms-mock";
import {
  ApiError,
  applOptionService,
  branchService,
  departmentService,
  designationService,
  employeeService,
  employmentStatusService,
  employmentTypeService,
  gradeService,
  organizationService,
  workShiftService,
} from "@/lib/api";
import { applOptionsToSelectOptions } from "@/lib/api/services/appl-options.service";
import {
  LEAVE_VALIDITY_FALLBACK_OPTIONS,
  LEAVE_VALIDITY_OPT_GRP_ID,
  leaveMasterService,
} from "@/lib/api/services/leave-master.service";
import {
  computeLeaveApplicationDays,
  LEAVE_APP_STATUS_FALLBACK,
  LEAVE_APP_STATUS_OPT_GRP_ID,
  LEAVE_HALF_DAY_FALLBACK,
  LEAVE_HALF_DAY_OPT_GRP_ID,
  leaveApplicationService,
} from "@/lib/api/services/leave-application.service";
import { latestFinancialYear } from "@/lib/leave-module-utils";
import { filterAttendanceStatusOptions } from "@/lib/api/services/attendance.service";
import type { FormValue } from "@/lib/form-validation";
import { formatEmployeeOptionLabel } from "@/lib/attendance-module-utils";
import { EMPLOYEE_APPL_OPTION_FALLBACKS } from "@/config/employee-form-sections";
import { ATTENDANCE_STATUS_OPTIONS } from "@/config/attendance-form-sections";
import {
  getMasterDataApiService,
  moduleUsesGradeSelect,
  moduleUsesOrganizationSelect,
  getEmployeeDetails,
} from "@/lib/api/master-data-services";
import { assetTypeService } from "@/lib/api/services/asset-type.service";
import { DEACTIVATE_CONFIRM_MESSAGE, ACTIVATE_CONFIRM_MESSAGE } from "@/lib/confirm-messages";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/date-utils";
import { formatRowStatus, getRowStatusKey } from "@/lib/row-status";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus, type Column } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { queueAuditLog, resolveAuditRecordId } from "@/lib/audit-log";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { getRowLabel } from "@/lib/row-label";
import type { FormField, HrmsRow, TableColumn } from "@/types/hrms";
import { LeaveApprovalDialog } from "@/components/leave/LeaveApprovalDialog";
import { LeaveEntitlementModal } from "@/components/leave/LeaveEntitlementModal";
import {
  applyConfigFormOptions,
  enrichConfigRow,
  getConfigModuleLookups,
  sortConfigRows,
  withLeaveEntitlementFilters,
} from "@/lib/config-module-helpers";
import { leaveApprovalService } from "@/lib/api/services/leave-approval.service";
import { finYearService } from "@/lib/api/services/fin-year.service";
import { authService } from "@/lib/api/services/auth.service";
import type { AuthMeProfile } from "@/lib/api/types";

type MasterDataPageProps = {
  moduleId: string;
  onRowEdit?: (row: HrmsRow) => void;
  titleRender?: React.ReactNode;
  topContent?: React.ReactNode;
  stats?: any[];
  extraActions?: React.ReactNode;
  fetchParams?: Record<string, any>;
  modalSubtitle?: string;
  emptyStateMessage?: string;
  submitLabel?: string;
};

function formatCellValue(value: HrmsRow[string], type?: TableColumn["type"]): string {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "boolean") return value === true || value === "true" || value === 1 ? "Yes" : "No";
  if (type === "currency") return `₹${Number(value).toLocaleString("en-IN")}`;
  if (type === "date") return formatDateDisplay(String(value));
  if (type === "time") return formatTimeDisplay(String(value)) || "—";
  if (type === "duration") {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    if (num === 0) return "0";
    const h = Math.floor(num / 60);
    const m = num % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }
  return String(value);
}

function formatStatus(value: HrmsRow[string]): string {
  return formatRowStatus(value);
}

function buildColumns(configColumns: TableColumn[]): Column<HrmsRow>[] {
  return configColumns.map((column) => {
    if (column.type === "person") {
      return {
        key: column.key,
        header: column.header,
        render: (row) => (
          <PersonCell
            name={String(row[column.key] ?? "—")}
            subtitle={column.subtitleKey ? String(row[column.subtitleKey] ?? "") : undefined}
            avatar={column.avatarKey ? String(row[column.avatarKey] ?? "") : undefined}
          />
        ),
      };
    }

    if (column.type === "status") {
      return {
        key: column.key,
        header: column.header,
        render: (row) => <SoftStatus value={formatStatus(row[column.key])} />,
      };
    }

    return {
      key: column.key,
      header: column.header,
      render: (row) =>
        column.wrap ? (
          <span className="cell-wrap">{formatCellValue(row[column.key], column.type)}</span>
        ) : (
          formatCellValue(row[column.key], column.type)
        ),
    };
  });
}

function resolveApplOptionValue(
  value: unknown,
  options: Array<{ value: string; label: string }>,
): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (options.some((option) => option.value === text)) return text;
  const byLabel = options.find((option) => option.label.toLowerCase() === text.toLowerCase());
  return byLabel?.value ?? text;
}

function enrichEmployeeRow(
  values: HrmsRow,
  organizationOptions: Array<{ value: string; label: string }>,
  applOptions?: {
    gender: Array<{ value: string; label: string }>;
    bloodGroup: Array<{ value: string; label: string }>;
    maritalStatus: Array<{ value: string; label: string }>;
  },
): HrmsRow {
  const displayName = [values.First_name, values.Middle_name, values.Last_name]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");

  const orgId = String(values.Org_Id ?? "");
  const orgName =
    organizationOptions.find((option) => option.value === orgId)?.label ??
    String(values.Org_Name ?? "");

  const genderCode = applOptions
    ? resolveApplOptionValue(values.Gender, applOptions.gender)
    : String(values.Gender ?? "");
  const bloodGroupCode = applOptions
    ? resolveApplOptionValue(values.Blood_group, applOptions.bloodGroup)
    : String(values.Blood_group ?? "");
  const maritalStatusCode = applOptions
    ? resolveApplOptionValue(values.Marital_status, applOptions.maritalStatus)
    : String(values.Marital_status ?? "");

  return {
    ...values,
    Display_name: displayName || String(values.Display_name ?? ""),
    Org_Name: orgName,
    Gender: genderCode,
    Blood_group: bloodGroupCode,
    Marital_status: maritalStatusCode,
  };
}

function resolveSaveLabel(
  saved: HrmsRow,
  fallback: HrmsRow,
  nameKey: string,
): string {
  const primary = String(saved[nameKey] ?? "").trim();
  if (primary) return primary;

  const savedLabel = getRowLabel(saved);
  if (savedLabel !== "this record") return savedLabel;

  const fallbackPrimary = String(fallback[nameKey] ?? "").trim();
  if (fallbackPrimary) return fallbackPrimary;

  return getRowLabel(fallback);
}

export function MasterDataPage({
  moduleId,
  onRowEdit,
  titleRender,
  topContent,
  stats,
  extraActions,
  fetchParams,
  modalSubtitle,
  emptyStateMessage,
  submitLabel,
}: MasterDataPageProps) {
  const config = useMemo(() => getHrmsModule(moduleId), [moduleId]);
  const toast = useToast();
  const usesApi = Boolean(config.usesApi);
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [organizationOptions, setOrganizationOptions] = useState<Array<{ value: string; label: string }>>(
    [],
  );
  const [gradeOptions, setGradeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [genderOptions, setGenderOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [branchOptions, setBranchOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [departmentOptions, setDepartmentOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [assetTypeOptions, setAssetTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [designationOptions, setDesignationOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [employmentStatusOptions, setEmploymentStatusOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [employeeOptions, setEmployeeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [attendanceStatusOptions, setAttendanceStatusOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [shiftOptions, setShiftOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [bloodGroupOptions, setBloodGroupOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [leaveValidityOptions, setLeaveValidityOptions] = useState<Array<{ value: string; label: string }>>(
    [...LEAVE_VALIDITY_FALLBACK_OPTIONS],
  );
  const [leaveHalfDayOptions, setLeaveHalfDayOptions] = useState<Array<{ value: string; label: string }>>(
    [...LEAVE_HALF_DAY_FALLBACK],
  );
  const [leaveAppStatusOptions, setLeaveAppStatusOptions] = useState<
    Array<{ value: string; label: string }>
  >([...LEAVE_APP_STATUS_FALLBACK]);
  const [leaveTypeRows, setLeaveTypeRows] = useState<HrmsRow[]>([]);
  const [leaveBalanceRows, setLeaveBalanceRows] = useState<HrmsRow[]>([]);
  const [requisitionEmployees, setRequisitionEmployees] = useState<HrmsRow[]>([]);
  const [financialYearOptions, setFinancialYearOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [activeFinYearId, setActiveFinYearId] = useState<number | undefined>(undefined);

  const isEmployeeModule = moduleId === "employees";
  const isDailyAttendanceModule = moduleId === "daily-attendance";
  const isLeaveMasterModule = moduleId === "leave-master";
  const isLeaveRequisitionModule = moduleId === "leave-requisition";
  const isLeaveApprovalModule = moduleId === "leave-approval";
  const isLeaveEntitlementModule = moduleId === "leave-entitlement";
  const [meProfile, setMeProfile] = useState<AuthMeProfile | null>(null);
  const isLeaveRequisitionAdmin = Boolean(meProfile?.isAdmin);
  const leaveRequisitionEmployeeId = meProfile?.employeeId ?? null;
  const configLookups = useMemo(() => getConfigModuleLookups(), []);
  const [approvalConfirm, setApprovalConfirm] = useState<{
    row: HrmsRow;
    status: "Approved" | "Rejected";
  } | null>(null);

  const columns = useMemo(() => {
    const base = buildColumns(config.columns);
    if (!isLeaveRequisitionModule && !isLeaveApprovalModule) return base;

    return base
      .filter((column) => {
        if (
          isLeaveRequisitionModule &&
          !isLeaveRequisitionAdmin &&
          (column.key === "Employee_name" || column.key === "Employee_code")
        ) {
          return false;
        }
        return true;
      })
      .map((column) => {
      if (
        (isLeaveApprovalModule || (isLeaveRequisitionModule && isLeaveRequisitionAdmin)) &&
        column.key === "Employee_name"
      ) {
        return {
          ...column,
          render: (row: HrmsRow) => {
            const name = String(row.Employee_name ?? "").trim();
            const code = String(row.Employee_code ?? "").trim();
            const post = String(row.Designation ?? "").trim();
            const branch = String(row.Branch_Name ?? "").trim();
            const subtitle = [code, post || branch].filter(Boolean).join(" · ");
            return (
              <PersonCell
                name={name || code || "—"}
                subtitle={subtitle || undefined}
                avatar={String(row.Photo_path ?? "")}
              />
            );
          },
        };
      }

      if (column.key !== "Document_name") return column;
      return {
        ...column,
        render: (row: HrmsRow) => {
          const requiresDocument = ["Yes", "1", 1, true].includes(
            row.Requires_document as string | number | boolean,
          ) || Number(row.Requires_Document) === 1;
          if (!requiresDocument) return "N/R";

          const url = String(row.Document_Url ?? "").trim();
          const name = String(row.Document_name ?? "").trim();
          if (!url && !name) return "—";
          if (!url) return name;

          return (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none d-inline-flex align-items-center gap-1"
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              title={name || "View attachment"}
            >
              <Eye size={14} strokeWidth={2.25} />
              View
            </button>
          );
        },
      };
    });
  }, [config.columns, isLeaveApprovalModule, isLeaveRequisitionAdmin, isLeaveRequisitionModule]);
  const filterFields = useMemo(() => {
    const fields = isEmployeeModule || isDailyAttendanceModule
      ? [...getModuleFilterFields(config), { key: "Branch_Id", label: "Branch" }]
      : getModuleFilterFields(config);
    const mapped = fields.map((field) => {
      if (isEmployeeModule) {
        if (field.key === "Department") return { ...field, options: departmentOptions.map(o => ({ value: o.label, label: o.label })) };
        if (field.key === "Designation") return { ...field, options: designationOptions.map(o => ({ value: o.label, label: o.label })) };
        if (field.key === "Branch_Id") return { ...field, options: branchOptions };
        if (field.key === "Branch") return { ...field, options: branchOptions.map(o => ({ value: o.label, label: o.label })) };
        if (field.key === "Employment_status_name") return { ...field, options: employmentStatusOptions.map(o => ({ value: o.label, label: o.label })) };
        if (field.key === "Status") return { ...field, options: [{ value: "1", label: "Active" }, { value: "0", label: "Inactive" }] };
      }
      if (isDailyAttendanceModule) {
        if (field.key === "Shift_name") return { ...field, options: shiftOptions };
        if (field.key === "Attendance_status") return { ...field, options: attendanceStatusOptions };
        if (field.key === "Branch_Id") return { ...field, options: branchOptions };
      }
      if (isLeaveRequisitionModule || isLeaveApprovalModule || isLeaveEntitlementModule) {
        if (field.key === "Branch_Name") {
          return {
            ...field,
            options: branchOptions.map((option) => ({
              value: option.label,
              label: option.label,
            })),
          };
        }
        if (field.key === "Leave_code") {
          return {
            ...field,
            options: leaveTypeRows
              .map((row) => {
                const code = String(row.Leave_code ?? row.Short_name ?? "").trim();
                const name = String(row.Leave_name ?? "").trim();
                if (!code) return null;
                return {
                  value: code,
                  label: name ? `${code} — ${name}` : code,
                };
              })
              .filter((option): option is { value: string; label: string } => option !== null),
          };
        }
        if (field.key === "Half_day_label") {
          return {
            ...field,
            options:
              leaveHalfDayOptions.length > 0
                ? leaveHalfDayOptions.map((option) => ({
                    value: option.label,
                    label: option.label,
                  }))
                : LEAVE_HALF_DAY_FALLBACK.map((option) => ({
                    value: option.label,
                    label: option.label,
                  })),
          };
        }
        if (field.key === "Application_status") {
          return {
            ...field,
            options:
              leaveAppStatusOptions.length > 0
                ? leaveAppStatusOptions.map((option) => ({
                    value: option.label,
                    label: option.label,
                  }))
                : LEAVE_APP_STATUS_FALLBACK.map((option) => ({
                    value: option.label,
                    label: option.label,
                  })),
          };
        }
      }
      return field;
    });
    return withLeaveEntitlementFilters(moduleId, mapped, financialYearOptions);
  }, [
    attendanceStatusOptions,
    branchOptions,
    config,
    departmentOptions,
    designationOptions,
    employmentStatusOptions,
    financialYearOptions,
    isDailyAttendanceModule,
    isEmployeeModule,
    isLeaveApprovalModule,
    isLeaveEntitlementModule,
    isLeaveRequisitionModule,
    leaveAppStatusOptions,
    leaveHalfDayOptions,
    leaveTypeRows,
    shiftOptions,
    moduleId,
  ]);
  const apiService = useMemo(
    () => (usesApi ? getMasterDataApiService(moduleId) : undefined),
    [moduleId, usesApi],
  );

  const usesOrganizationSelect = moduleUsesOrganizationSelect(moduleId);
  const usesGradeSelect = moduleUsesGradeSelect(moduleId);
  const baseFormFields = useMemo(() => getModuleFormFields(config), [config]);

  const applyDynamicFieldOptions = useCallback(
    (field: FormField): FormField => {
      if (field.name === "Org_Id" && usesOrganizationSelect) {
        return { ...field, options: organizationOptions };
      }
      if (isEmployeeModule && field.name === "Branch") {
        return { ...field, options: branchOptions };
      }

      if (isEmployeeModule && field.name === "Department") {
        return { ...field, options: departmentOptions };
      }

      if (isEmployeeModule && field.name === "Designation") {
        return { ...field, options: designationOptions };
      }

      if (isEmployeeModule && field.name === "Grade") {
        return { ...field, options: gradeOptions };
      }

      if (isEmployeeModule && field.name === "Employment_type") {
        return { ...field, options: employmentTypeOptions };
      }

      if (isEmployeeModule && field.name === "Employment_status") {
        return { ...field, options: employmentStatusOptions };
      }

      if (isEmployeeModule && field.name === "Shift") {
        return { ...field, options: shiftOptions };
      }
      if (isDailyAttendanceModule && field.name === "Employee_code") {
        return { ...field, options: employeeOptions };
      }
      if (isDailyAttendanceModule && field.name === "Shift_name") {
        return { ...field, options: shiftOptions };
      }
      if (isDailyAttendanceModule && field.name === "Attendance_status") {
        return { ...field, options: attendanceStatusOptions };
      }
      if (field.name === "Grade_Id" && usesGradeSelect) {
        return { ...field, options: gradeOptions };
      }
      if (moduleId === "assets" && field.name === "Asset_type") {
        return { ...field, options: assetTypeOptions };
      }
      if (isEmployeeModule && field.name === "Gender") {
        return { ...field, options: genderOptions };
      }
      if (isEmployeeModule && field.name === "Blood_group") {
        return { ...field, options: bloodGroupOptions };
      }
      if (isEmployeeModule && field.name === "Marital_status") {
        return { ...field, options: maritalStatusOptions };
      }
      if (isLeaveMasterModule && field.name === "Validity") {
        return {
          ...field,
          options:
            leaveValidityOptions.length > 0
              ? leaveValidityOptions
              : [...LEAVE_VALIDITY_FALLBACK_OPTIONS],
        };
      }
      if (isLeaveMasterModule && field.name === "Applicable_employee_type") {
        return {
          ...field,
          options: [
            { value: "", label: "All employment types" },
            ...employmentTypeOptions,
          ],
        };
      }
      if (isLeaveRequisitionModule && field.name === "Branch_Id") {
        return { ...field, options: branchOptions };
      }
      if (isLeaveRequisitionModule && field.name === "Half_day") {
        return {
          ...field,
          options:
            leaveHalfDayOptions.length > 0
              ? leaveHalfDayOptions
              : [...LEAVE_HALF_DAY_FALLBACK],
        };
      }
      if (isLeaveEntitlementModule && field.name === "Financial_year") {
        return {
          ...field,
          options: financialYearOptions.length > 0 ? financialYearOptions : field.options,
        };
      }
      return field;
    },
    [
      bloodGroupOptions,
      financialYearOptions,
      genderOptions,
      gradeOptions,
      isEmployeeModule,
      isLeaveEntitlementModule,
      isLeaveMasterModule,
      isLeaveRequisitionModule,
      leaveHalfDayOptions,
      leaveValidityOptions,
      maritalStatusOptions,
      organizationOptions,
      usesGradeSelect,
      usesOrganizationSelect,
      attendanceStatusOptions,
      branchOptions,
      departmentOptions,
      designationOptions,
      employeeOptions,
      employmentTypeOptions,
      employmentStatusOptions,
      shiftOptions,
      assetTypeOptions,
      isDailyAttendanceModule,
      moduleId,
    ],
  );

  const modalFields = useMemo(() => {
    if (config.formSections?.length) return undefined;
    return applyConfigFormOptions(
      moduleId,
      baseFormFields.map(applyDynamicFieldOptions),
      configLookups,
      rows,
      financialYearOptions,
    );
  }, [
    applyDynamicFieldOptions,
    baseFormFields,
    config.formSections,
    configLookups,
    financialYearOptions,
    moduleId,
    rows,
  ]);

  const employeeApplOptions = useMemo(
    () => ({
      gender: genderOptions,
      bloodGroup: bloodGroupOptions,
      maritalStatus: maritalStatusOptions,
    }),
    [bloodGroupOptions, genderOptions, maritalStatusOptions],
  );

  const editInitialValues = useMemo(() => {
    if (!editRow || !isEmployeeModule) return editRow ?? undefined;
    return {
      ...editRow,
      Gender: resolveApplOptionValue(editRow.Gender, genderOptions),
      Blood_group: resolveApplOptionValue(editRow.Blood_group, bloodGroupOptions),
      Marital_status: resolveApplOptionValue(editRow.Marital_status, maritalStatusOptions),
    };
  }, [bloodGroupOptions, editRow, genderOptions, isEmployeeModule, maritalStatusOptions]);

  const modalSections = useMemo(() => {
    if (!config.formSections?.length) return undefined;
    const sections = config.formSections.map((section) => ({
      ...section,
      fields: section.fields.map(applyDynamicFieldOptions),
    }));
    return sections.map((section) => ({
      ...section,
      fields: applyConfigFormOptions(
        moduleId,
        section.fields,
        configLookups,
        rows,
        financialYearOptions,
      ),
    }));
  }, [
    applyDynamicFieldOptions,
    config.formSections,
    configLookups,
    financialYearOptions,
    moduleId,
    rows,
  ]);

  useEffect(() => {
    if (!usesOrganizationSelect) {
      setOrganizationOptions([]);
      return;
    }

    let cancelled = false;

    async function loadOrganizations() {
      try {
        const organizations = await organizationService.list();
        if (cancelled) return;
        setOrganizationOptions(
          organizations.map((org) => ({
            value: String(org.Org_Id),
            label: String(org.Org_Name || org.Org_Cd),
          })),
        );
      } catch {
        if (!cancelled) setOrganizationOptions([]);
      }
    }

    void loadOrganizations();
    return () => {
      cancelled = true;
    };
  }, [moduleId, usesOrganizationSelect]);

  useEffect(() => {
    if (!isEmployeeModule) {
      setGenderOptions([]);
      setBloodGroupOptions([]);
      setMaritalStatusOptions([]);
      return;
    }

    let cancelled = false;

    async function loadApplOptions() {
      try {
        const [gender, bloodGroup, maritalStatus] = await Promise.all([
          applOptionService.gender(1),
          applOptionService.bloodGroup(1),
          applOptionService.maritalStatus(1),
        ]);

        if (cancelled) return;

        setGenderOptions(applOptionsToSelectOptions(gender));
        setBloodGroupOptions(applOptionsToSelectOptions(bloodGroup));
        setMaritalStatusOptions(applOptionsToSelectOptions(maritalStatus));
      } catch {
        if (cancelled) return;

        setGenderOptions([...EMPLOYEE_APPL_OPTION_FALLBACKS.gender]);
        setBloodGroupOptions([...EMPLOYEE_APPL_OPTION_FALLBACKS.bloodGroup]);
        setMaritalStatusOptions([...EMPLOYEE_APPL_OPTION_FALLBACKS.maritalStatus]);
      }
    }

    void loadApplOptions();

    return () => {
      cancelled = true;
    };
  }, [isEmployeeModule, moduleId]);

  useEffect(() => {
    if (!isLeaveEntitlementModule && !isLeaveRequisitionModule) {
      setFinancialYearOptions([]);
      setActiveFinYearId(undefined);
      return;
    }

    let cancelled = false;

    async function loadFinancialYears() {
      try {
        const rows = await finYearService.list({ status: 1 });
        if (cancelled) return;
        const options = rows
          .map((row) => {
            const id = String(row.Year_Id ?? row.id ?? "").trim();
            const name = String(row.Year_Name ?? row.Financial_year ?? "").trim();
            if (!id || !name) return null;
            return { value: id, label: name };
          })
          .filter((option): option is { value: string; label: string } => option !== null)
          .sort((left, right) =>
            right.label.localeCompare(left.label, undefined, { numeric: true }),
          );
        setFinancialYearOptions(options);
        const latestName = latestFinancialYear(options.map((option) => option.label));
        const matched = options.find((option) => option.label === latestName) ?? options[0];
        const yearId = Number(matched?.value ?? 0);
        setActiveFinYearId(yearId > 0 ? yearId : undefined);
      } catch {
        if (!cancelled) {
          setFinancialYearOptions([]);
          setActiveFinYearId(undefined);
        }
      }
    }

    void loadFinancialYears();

    return () => {
      cancelled = true;
    };
  }, [isLeaveEntitlementModule, isLeaveRequisitionModule]);

  useEffect(() => {
    if (!isLeaveMasterModule) {
      setLeaveValidityOptions([...LEAVE_VALIDITY_FALLBACK_OPTIONS]);
      return;
    }

    let cancelled = false;

    async function loadLeaveMasterOptions() {
      try {
        const [validityOptions, employmentTypes] = await Promise.all([
          applOptionService.list({ opt_grp_id: LEAVE_VALIDITY_OPT_GRP_ID, is_active: 1 }),
          employmentTypeService.list({ status: 1 }),
        ]);

        if (cancelled) return;

        const mappedValidity = applOptionsToSelectOptions(validityOptions);
        setLeaveValidityOptions(
          mappedValidity.length > 0
            ? mappedValidity
            : [...LEAVE_VALIDITY_FALLBACK_OPTIONS],
        );
        setEmploymentTypeOptions(
          employmentTypes
            .map((row) => {
              const id = String(row.Emp_type_id ?? row.id ?? "").trim();
              const name = String(row.Type_name ?? "").trim();
              const code = String(row.Type_code ?? "").trim();
              return {
                value: id,
                label: code ? `${name} (${code})` : name || id,
              };
            })
            .filter((option) => option.value && option.label),
        );
      } catch {
        if (cancelled) return;
        setLeaveValidityOptions([...LEAVE_VALIDITY_FALLBACK_OPTIONS]);
        setEmploymentTypeOptions([]);
      }
    }

    void loadLeaveMasterOptions();

    return () => {
      cancelled = true;
    };
  }, [isLeaveMasterModule, moduleId]);

  useEffect(() => {
    if (!isEmployeeModule && !isDailyAttendanceModule) {
      if (
        !isLeaveMasterModule &&
        !isLeaveRequisitionModule &&
        !isLeaveApprovalModule &&
        !isLeaveEntitlementModule
      ) {
        setEmployeeOptions([]);
        setAttendanceStatusOptions([]);
        setBranchOptions([]);
        setDepartmentOptions([]);
        setDesignationOptions([]);
        setEmploymentTypeOptions([]);
        setEmploymentStatusOptions([]);
        setShiftOptions([]);
      }
      return;
    }

    let cancelled = false;

    async function loadEmployeeMasterOptions() {
      try {
        if (isDailyAttendanceModule) {
          const [employees, shifts, applOptions, branches] = await Promise.all([
            employeeService.list({ status: 1 }),
            workShiftService.list({ status: 1 }),
            applOptionService.list({ is_active: 1 }),
            branchService.list(),
          ]);

          if (cancelled) return;

          setEmployeeOptions(
            employees
              .map((row) => {
                const code = String(row.Employee_code ?? "").trim();
                const name = String(row.Display_name ?? row.Employee_name ?? "").trim();
                return {
                  value: code,
                  label: formatEmployeeOptionLabel(code, name),
                };
              })
              .filter((option) => option.value && option.label),
          );

          setShiftOptions(
            shifts
              .map((row) => {
                const name = String(row.Shift_name ?? "").trim();
                const code = String(row.Shift_code ?? "").trim();
                return {
                  value: name,
                  label: code ? `${name} (${code})` : name,
                };
              })
              .filter((option) => option.value && option.label),
          );

          const fallbackStatusOptions = ATTENDANCE_STATUS_OPTIONS.map((status) => ({
            value: status,
            label: status,
          }));
          const apiStatusOptions = filterAttendanceStatusOptions(applOptions)
            .map((option) => {
              const label = String(option.Opt_Description ?? "").trim();
              return { value: label, label };
            })
            .filter((option) => option.value && option.label);

          setAttendanceStatusOptions(
            apiStatusOptions.length > 0 ? apiStatusOptions : fallbackStatusOptions,
          );
          setBranchOptions(
            branches
              .map((row) => ({
                value: String(row.Branch_Id),
                label: String(row.Branch_Name ?? ""),
              }))
              .filter((option) => option.value && option.label),
          );
          setDepartmentOptions([]);
          setDesignationOptions([]);
          setEmploymentTypeOptions([]);
          setEmploymentStatusOptions([]);
          return;
        }

        const [
          branches,
          departments,
          designations,
          employmentTypes,
          employmentStatuses,
          shifts,
        ] = await Promise.all([
          branchService.list(),
          departmentService.list(),
          designationService.list(),
          employmentTypeService.list(),
          employmentStatusService.list(),
          workShiftService.list(),
        ]);

        if (cancelled) return;

        setEmployeeOptions([]);
        setAttendanceStatusOptions([]);

        setBranchOptions(
          branches.map((row) => ({
            value: String(row.Branch_Id),
            label: String(row.Branch_Name ?? ""),
          })),
        );

        setDepartmentOptions(
          departments.map((row) => ({
            value: String(row.Dept_Id),
            label: String(row.Dept_Name ?? ""),
          })),
        );

        setDesignationOptions(
          designations.map((row) => ({
            value: String(row.Desig_Id),
            label: String(row.Desig_Name ?? ""),
          })),
        );

        setEmploymentTypeOptions(
          employmentTypes.map((row) => ({
            value: String(row.Emp_type_id),
            label: String(row.Type_name ?? ""),
          })),
        );

        setEmploymentStatusOptions(
          employmentStatuses.map((row) => ({
            value: String(row.Emp_status_id),
            label: String(row.Status_name ?? ""),
          })),
        );

        setShiftOptions(
          shifts.map((row) => ({
            value: String(row.Shift_id),
            label: String(row.Shift_name ?? ""),
          })),
        );
      } catch {
        if (cancelled) return;

        setEmployeeOptions([]);
        setAttendanceStatusOptions(
          isDailyAttendanceModule
            ? ATTENDANCE_STATUS_OPTIONS.map((status) => ({ value: status, label: status }))
            : [],
        );
        setBranchOptions([]);
        setDepartmentOptions([]);
        setDesignationOptions([]);
        setEmploymentTypeOptions([]);
        setEmploymentStatusOptions([]);
        setShiftOptions([]);
      }
    }

    void loadEmployeeMasterOptions();

    return () => {
      cancelled = true;
    };
  }, [
    isDailyAttendanceModule,
    isEmployeeModule,
    isLeaveApprovalModule,
    isLeaveEntitlementModule,
    isLeaveMasterModule,
    isLeaveRequisitionModule,
  ]);

  useEffect(() => {
    if (!isLeaveRequisitionModule) {
      setMeProfile(null);
      return;
    }

    let cancelled = false;
    void authService.getMeProfile().then((profile) => {
      if (!cancelled) setMeProfile(profile);
    });

    return () => {
      cancelled = true;
    };
  }, [isLeaveRequisitionModule]);

  useEffect(() => {
    if (!isLeaveRequisitionModule && !isLeaveApprovalModule && !isLeaveEntitlementModule) {
      setLeaveHalfDayOptions([...LEAVE_HALF_DAY_FALLBACK]);
      setLeaveAppStatusOptions([...LEAVE_APP_STATUS_FALLBACK]);
      setRequisitionEmployees([]);
      setLeaveTypeRows([]);
      setLeaveBalanceRows([]);
      return;
    }

    let cancelled = false;

    async function loadLeaveModuleOptions() {
      try {
        if (isLeaveEntitlementModule && !isLeaveRequisitionModule && !isLeaveApprovalModule) {
          const [leaveTypes, branches] = await Promise.all([
            leaveMasterService.list({ status: 1 }),
            branchService.list({ status: 1 }),
          ]);
          if (cancelled) return;
          setLeaveTypeRows(leaveTypes);
          setBranchOptions(
            branches
              .map((row) => ({
                value: String(row.Branch_Id ?? ""),
                label: String(row.Branch_Name ?? row.Branch_Cd ?? ""),
              }))
              .filter((option) => option.value && option.label),
          );
          return;
        }

        const needsApplOptions = isLeaveRequisitionModule || isLeaveApprovalModule;
        const [halfDayOptions, statusOptions, leaveTypes, branches] = await Promise.all([
          needsApplOptions
            ? applOptionService.list({
                opt_grp_id: LEAVE_HALF_DAY_OPT_GRP_ID,
                is_active: 1,
              })
            : Promise.resolve([]),
          needsApplOptions
            ? applOptionService.list({
                opt_grp_id: LEAVE_APP_STATUS_OPT_GRP_ID,
                is_active: 1,
              })
            : Promise.resolve([]),
          leaveMasterService.list({ status: 1 }),
          branchService.list({ status: 1 }),
        ]);

        if (cancelled) return;

        setLeaveTypeRows(leaveTypes);
        if (needsApplOptions) {
          const mappedHalfDay = applOptionsToSelectOptions(halfDayOptions);
          setLeaveHalfDayOptions(
            mappedHalfDay.length > 0 ? mappedHalfDay : [...LEAVE_HALF_DAY_FALLBACK],
          );
          const mappedStatus = applOptionsToSelectOptions(statusOptions);
          setLeaveAppStatusOptions(
            mappedStatus.length > 0 ? mappedStatus : [...LEAVE_APP_STATUS_FALLBACK],
          );
        }
        setBranchOptions(
          branches
            .map((row) => ({
              value: String(row.Branch_Id ?? ""),
              label: String(row.Branch_Name ?? row.Branch_Cd ?? ""),
            }))
            .filter((option) => option.value && option.label),
        );

        // Admin picks branch first, then employees load by branch_id.
        if (isLeaveRequisitionModule) {
          setRequisitionEmployees([]);
        }
      } catch {
        if (cancelled) return;
        setLeaveTypeRows([]);
        if (isLeaveRequisitionModule || isLeaveApprovalModule) {
          setLeaveHalfDayOptions([...LEAVE_HALF_DAY_FALLBACK]);
          setLeaveAppStatusOptions([...LEAVE_APP_STATUS_FALLBACK]);
          setBranchOptions([]);
        }
        if (isLeaveRequisitionModule) {
          setRequisitionEmployees([]);
        }
      }
    }

    void loadLeaveModuleOptions();

    return () => {
      cancelled = true;
    };
  }, [
    isLeaveApprovalModule,
    isLeaveEntitlementModule,
    isLeaveRequisitionModule,
    moduleId,
  ]);

  useEffect(() => {
    if (!isLeaveRequisitionModule || !editRow) return;
    const employeeId = Number(editRow.Employee_id ?? editRow.Employee_Id ?? 0);
    if (!employeeId) {
      setLeaveBalanceRows([]);
      return;
    }

    let cancelled = false;
    void leaveApplicationService
      .balance({
        employee_id: employeeId,
        ...(activeFinYearId ? { fin_year: activeFinYearId } : {}),
      })
      .then((rows) => {
        if (cancelled) return;
        setLeaveBalanceRows(rows);
        const leaveId = String(editRow.Leave_id ?? editRow.Leave_Id ?? "").trim();
        const matched = rows.find(
          (row) => String(row.Leave_Id ?? row.id ?? "").trim() === leaveId,
        );
        if (!matched) return;
        setEditRow((prev) => {
          if (!prev || String(prev.id) !== String(editRow.id)) return prev;
          return {
            ...prev,
            Balance_leave: Number(matched.Balance_leave ?? matched.Balance_Days ?? 0),
            Requires_document: String(matched.Requires_document ?? prev.Requires_document ?? "No"),
            Is_half_day_allowed: matched.Is_half_day_allowed ?? prev.Is_half_day_allowed ?? 1,
            Leave_type: String(matched.Leave_name ?? prev.Leave_type ?? ""),
            Leave_code: String(matched.Leave_code ?? prev.Leave_code ?? ""),
          };
        });
      })
      .catch(() => {
        if (!cancelled) setLeaveBalanceRows([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeFinYearId, editRow?.id, editRow?.Employee_id, editRow?.Leave_id, isLeaveRequisitionModule]);

  /** Employee self-service: preload own leave balance when opening create form. */
  useEffect(() => {
    if (!isLeaveRequisitionModule || !addOpen || isLeaveRequisitionAdmin) return;
    if (!leaveRequisitionEmployeeId) {
      setLeaveBalanceRows([]);
      return;
    }

    let cancelled = false;
    void leaveApplicationService
      .balance({
        employee_id: leaveRequisitionEmployeeId,
        ...(activeFinYearId ? { fin_year: activeFinYearId } : {}),
      })
      .then((rows) => {
        if (!cancelled) setLeaveBalanceRows(rows);
      })
      .catch(() => {
        if (!cancelled) setLeaveBalanceRows([]);
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeFinYearId,
    addOpen,
    isLeaveRequisitionAdmin,
    isLeaveRequisitionModule,
    leaveRequisitionEmployeeId,
  ]);

  /** Admin edit: load branch employees so employee select has options. */
  useEffect(() => {
    if (!isLeaveRequisitionModule || !isLeaveRequisitionAdmin || !editRow) return;
    const branchId = Number(editRow.Branch_Id ?? 0);
    if (!branchId) return;

    let cancelled = false;
    void employeeService
      .list({ branch_id: branchId, status: 1 })
      .then((employees) => {
        if (!cancelled) setRequisitionEmployees(employees);
      })
      .catch(() => {
        if (!cancelled) setRequisitionEmployees([]);
      });

    return () => {
      cancelled = true;
    };
  }, [editRow?.Branch_Id, editRow?.id, isLeaveRequisitionAdmin, isLeaveRequisitionModule]);

  useEffect(() => {
    if (!usesGradeSelect || !usesApi) {
      setGradeOptions([]);
      return;
    }

    let cancelled = false;

    async function loadGrades() {
      try {
        const organizations = await organizationService.list();
        if (cancelled) return;
        const orgNameById = new Map(
          organizations.map((org) => [Number(org.Org_Id), String(org.Org_Name || org.Org_Cd)]),
        );
        const grades = await gradeService.list(undefined, orgNameById);
        if (cancelled) return;
        setGradeOptions(
          grades.map((grade) => ({
            value: String(grade.Grade_Id),
            label: String(grade.Grade_Name || grade.Grade_Code),
          })),
        );
      } catch {
        if (!cancelled) setGradeOptions([]);
      }
    }

    void loadGrades();
    return () => {
      cancelled = true;
    };
  }, [moduleId, usesApi, usesGradeSelect]);

  useEffect(() => {
    if (moduleId !== "assets") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssetTypeOptions([]);
      return;
    }

    let cancelled = false;

    async function loadAssetTypes() {
      try {
        const types = await assetTypeService.list();
        if (cancelled) return;
        setAssetTypeOptions(
          types.map((type) => ({
            value: String(type.Type_id),
            label: String(type.Type_name),
          })),
        );
      } catch {
        if (!cancelled) setAssetTypeOptions([]);
      }
    }

    void loadAssetTypes();
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const fetchModuleRows = useCallback(async (): Promise<HrmsRow[]> => {
    const nextRows = usesApi
      ? apiService
        ? await apiService.list(fetchParams)
        : []
      : getHrmsMockRows(moduleId);
    return sortConfigRows(moduleId, nextRows);
  }, [apiService, moduleId, usesApi, fetchParams]);

  const loadRows = useCallback(
    async (options?: { showLoader?: boolean }) => {
      const showLoader = options?.showLoader ?? true;
      if (showLoader) setLoading(true);
      try {
        setRows(await fetchModuleRows());
      } catch (error) {
        setRows([]);
        toast.error({
          title: `Unable to load ${config.title.toLowerCase()}`,
          message: error instanceof ApiError ? error.message : "Check the API connection and try again.",
        });
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [config.title, fetchModuleRows, toast],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOnNavigate() {
      setLoading(true);
      setRows([]);
      try {
        const nextRows = await fetchModuleRows();
        if (!cancelled) setRows(nextRows);
      } catch (error) {
        if (cancelled) return;
        setRows([]);
        toast.error({
          title: `Unable to load ${config.title.toLowerCase()}`,
          message: error instanceof ApiError ? error.message : "Check the API connection and try again.",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOnNavigate();
    return () => {
      cancelled = true;
    };
    // Load once when the route/module changes — not when toast identity updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, usesApi, fetchParams]);

  // const handleEdit = (row: HrmsRow) => {
  //   if (onRowEdit) {
  //     onRowEdit(row);
  //     return;
  //   }
  //   setEditRow(row);
  // };

  // 1. Add a specific state for edit loading alongside your other states
  const [editLoading, setEditLoading] = useState(false);

  // 2. Update the handleEdit function
  const handleEdit = async (row: HrmsRow) => {
    if (onRowEdit) {
      onRowEdit(row);
      return;
    }

    if (isLeaveRequisitionModule) {
      const statusCode = Number(row.Application_status_code ?? 0);
      const statusLabel = String(row.Application_status ?? row.Status ?? "").toLowerCase();
      if (statusCode !== 1 && statusLabel !== "pending") {
        toast.error({
          title: "Cannot edit",
          message: "Only pending leave requisitions can be edited.",
        });
        return;
      }
    }

    if (isEmployeeModule && usesApi) {
      const employeeId = row.Employee_id;

      if (
        employeeId === undefined ||
        employeeId === null ||
        !Number.isInteger(Number(employeeId)) ||
        Number(employeeId) <= 0
      ) {
        toast.error({
          title: "Invalid employee",
          message: "Employee ID is missing or invalid.",
        });
        return;
      }

      setEditLoading(true);

      try {
        const detailedRow = await getEmployeeDetails(
          Number(employeeId),
        );
        setEditRow(detailedRow);
      } catch (error) {
        toast.error({
          title: "Failed to fetch employee",
          message:
            error instanceof ApiError
              ? error.message
              : "Unable to load complete employee profile for editing.",
        });
      } finally {
        setEditLoading(false);
      }
    } else {
      setEditRow(row);
    }
  };

  const adaptLeaveRequisitionFields = useCallback(
    (fields: FormField[], values: Record<string, FormValue>): FormField[] => {
      if (!isLeaveRequisitionModule) return fields;

      const branchId = String(values.Branch_Id ?? "").trim();
      const employeeOptionsForBranch = requisitionEmployees
        .filter((row) => {
          if (!branchId) return true;
          return String(row.Branch_Id ?? "").trim() === branchId;
        })
        .map((row) => {
          const id = String(row.Employee_id ?? row.id ?? "").trim();
          const name = String(row.Display_name ?? row.Employee_name ?? "").trim();
          const code = String(row.Employee_code ?? "").trim();
          return {
            value: id,
            label: formatEmployeeOptionLabel(code, name) || id,
          };
        })
        .filter((option) => option.value && option.label);

      const balanceLeaveOptions = leaveBalanceRows
        .map((row) => {
          const id = String(row.Leave_Id ?? row.id ?? "").trim();
          const name = String(row.Leave_name ?? "").trim();
          const code = String(row.Leave_code ?? "").trim();
          const balance = Number(row.Balance_leave ?? row.Balance_Days ?? 0);
          if (!id || !name) return null;
          return {
            value: id,
            label: code
              ? `${name} (${code}) · Bal ${balance}`
              : `${name} · Bal ${balance}`,
          };
        })
        .filter((option): option is { value: string; label: string } => option !== null);

      const masterLeaveOptions = leaveTypeRows
        .map((row) => {
          const id = String(row.Leave_Id ?? row.id ?? "").trim();
          const name = String(row.Leave_name ?? "").trim();
          const code = String(row.Leave_code ?? row.Short_name ?? "").trim();
          if (!id || !name) return null;
          return {
            value: id,
            label: code ? `${name} (${code})` : name,
          };
        })
        .filter((option): option is { value: string; label: string } => option !== null);

      const leaveOptions =
        balanceLeaveOptions.length > 0 ? balanceLeaveOptions : masterLeaveOptions;

      const selectedLeaveId = String(values.Leave_id ?? "").trim();
      const selectedBalance = leaveBalanceRows.find(
        (row) => String(row.Leave_Id ?? row.id ?? "").trim() === selectedLeaveId,
      );
      const halfDayAllowed =
        selectedBalance == null
          ? true
          : Number(selectedBalance.Is_half_day_allowed ?? 1) !== 0;

      return fields
        .filter((field) => {
          if (
            !isLeaveRequisitionAdmin &&
            (field.name === "Branch_Id" || field.name === "Employee_id")
          ) {
            return false;
          }
          if (field.name === "Half_day" && !halfDayAllowed) return false;
          if (field.name !== "Supporting_document") return true;
          const requiresDocument =
            values.Requires_document === "Yes" ||
            values.Requires_document === "1" ||
            values.Requires_document === true;
          return requiresDocument;
        })
        .map((field) => {
          if (field.name === "Employee_id") {
            return {
              ...field,
              options: employeeOptionsForBranch,
              placeholder: branchId ? "Select Employee" : "Select branch first",
            };
          }
          if (field.name === "Leave_id") {
            return {
              ...field,
              options: leaveOptions,
              placeholder: isLeaveRequisitionAdmin
                ? branchId
                  ? String(values.Employee_id ?? "").trim()
                    ? "Select Leave Type"
                    : "Select employee first"
                  : "Select branch first"
                : "Select Leave Type",
            };
          }
          if (field.name === "Half_day") {
            return {
              ...field,
              options:
                leaveHalfDayOptions.length > 0
                  ? leaveHalfDayOptions
                  : [...LEAVE_HALF_DAY_FALLBACK],
            };
          }
          if (field.name === "Branch_Id") {
            return { ...field, options: branchOptions };
          }
          if (field.name === "Supporting_document") {
            return {
              ...field,
              required: true,
              hint: "Required for this leave type. JPG, PNG, WEBP, PDF · max 2 MB",
            };
          }
          return field;
        });
    },
    [
      branchOptions,
      isLeaveRequisitionAdmin,
      isLeaveRequisitionModule,
      leaveBalanceRows,
      leaveHalfDayOptions,
      leaveTypeRows,
      requisitionEmployees,
    ],
  );

  const resolveLeaveBalanceFields = useCallback(
    (leaveId: string, leaveTypes: HrmsRow[], balances: HrmsRow[]) => {
      const matchedBalance = balances.find(
        (row) => String(row.Leave_Id ?? row.id ?? "").trim() === leaveId,
      );
      const matchedType = leaveTypes.find(
        (row) => String(row.Leave_Id ?? row.id ?? "").trim() === leaveId,
      );
      const requiresDocument = String(
        matchedBalance?.Requires_document ??
          matchedType?.Requires_document ??
          matchedType?.Document_required ??
          "No",
      );
      const halfDayAllowed = Number(
        matchedBalance?.Is_half_day_allowed ?? matchedType?.Is_half_day_allowed ?? 1,
      );

      return {
        Balance_leave: String(
          matchedBalance?.Balance_leave ?? matchedBalance?.Balance_Days ?? 0,
        ),
        Requires_document: requiresDocument === "Yes" || requiresDocument === "1" ? "Yes" : "No",
        Is_half_day_allowed: halfDayAllowed,
        Leave_type: String(matchedType?.Leave_name ?? matchedBalance?.Leave_name ?? ""),
        Leave_code: String(
          matchedType?.Leave_code ?? matchedType?.Short_name ?? matchedBalance?.Leave_code ?? "",
        ),
        ...(halfDayAllowed === 0 ? { Half_day: "" } : {}),
      };
    },
    [],
  );

  const deriveLeaveRequisitionValues = useCallback(
    async (
      name: string,
      value: FormValue,
      current: Record<string, FormValue>,
    ): Promise<Partial<Record<string, FormValue>> | void> => {
      if (!isLeaveRequisitionModule) return;

      const next: Partial<Record<string, FormValue>> = {};

      if (name === "Branch_Id") {
        next.Employee_id = "";
        next.Leave_id = "";
        next.Balance_leave = "";
        next.Requires_document = "No";
        next.Supporting_document = "";
        next.Document_name = "";
        next.Document_Url = "";
        next.Half_day = "";
        setLeaveBalanceRows([]);

        const branchId = Number(value ?? 0);
        if (branchId > 0) {
          try {
            const employees = await employeeService.list({
              branch_id: branchId,
              status: 1,
            });
            setRequisitionEmployees(employees);
          } catch {
            setRequisitionEmployees([]);
          }
        } else {
          setRequisitionEmployees([]);
        }
      }

      if (name === "Employee_id") {
        const leaveId = String(current.Leave_id ?? "").trim();
        next.Balance_leave = "";
        next.Requires_document = "No";
        next.Supporting_document = "";
        next.Document_name = "";
        next.Document_Url = "";
        next.Half_day = "";
        const employeeId = Number(value ?? 0);
        if (employeeId > 0) {
          try {
            const balances = await leaveApplicationService.balance({
              employee_id: employeeId,
              ...(activeFinYearId ? { fin_year: activeFinYearId } : {}),
            });
            setLeaveBalanceRows(balances);
            if (leaveId) {
              Object.assign(next, resolveLeaveBalanceFields(leaveId, leaveTypeRows, balances));
              if (next.Requires_document !== "Yes") {
                next.Supporting_document = "";
                next.Document_name = "";
                next.Document_Url = "";
              }
            } else {
              next.Leave_id = "";
            }
          } catch {
            setLeaveBalanceRows([]);
          }
        } else {
          setLeaveBalanceRows([]);
          next.Leave_id = "";
        }
      }

      if (name === "Leave_id") {
        const leaveId = String(value ?? "").trim();
        Object.assign(next, resolveLeaveBalanceFields(leaveId, leaveTypeRows, leaveBalanceRows));
        if (next.Requires_document !== "Yes") {
          next.Supporting_document = "";
          next.Document_name = "";
          next.Document_Url = "";
        }
      }

      if (name === "From_date" || name === "To_date" || name === "Half_day") {
        const fromDate = String(
          name === "From_date" ? value : current.From_date ?? "",
        );
        const toDate = String(name === "To_date" ? value : current.To_date ?? "");
        const halfDay = name === "Half_day" ? value : current.Half_day;
        next.Number_of_days = String(
          computeLeaveApplicationDays(fromDate, toDate, halfDay),
        );
      }

      return next;
    },
    [activeFinYearId, isLeaveRequisitionModule, leaveBalanceRows, leaveTypeRows, resolveLeaveBalanceFields],
  );

  const handleDelete = async (row: HrmsRow) => {
    if (usesApi && apiService) {
      await apiService.remove(row.id);
      queueAuditLog({
        moduleId,
        action: "delete",
        recordId: resolveAuditRecordId(row as Record<string, unknown>),
        oldValues: row,
      });
      await loadRows();
      return;
    }
    setRows((prev) => prev.filter((item) => item.id !== row.id));
  };

  const handleActivate = async (row: HrmsRow) => {
    if (usesApi && apiService) {
      if (isEmployeeModule) {
        const employeeId = row.Employee_id;

        if (
          employeeId === undefined ||
          employeeId === null ||
          !Number.isInteger(Number(employeeId)) ||
          Number(employeeId) <= 0
        ) {
          toast.error({
            title: "Invalid employee",
            message: "Employee ID is missing or invalid.",
          });
          return;
        }

        try {
          const activated = {
            ...row,
            Employee_id: Number(employeeId),
            Status: 1,
          };
          await apiService.update(Number(employeeId), activated);

          queueAuditLog({
            moduleId,
            action: "update",
            recordId: Number(employeeId),
            oldValues: row,
            newValues: activated,
          });

          await loadRows();
          return;
        } catch (error) {
          toast.error({
            title: "Failed to activate employee",
            message:
              error instanceof ApiError
                ? error.message
                : "Unable to activate employee.",
          });
          return;
        }
      }

      const statusKey = getRowStatusKey(row);
      const activated = {
        ...row,
        [statusKey]: "Active",
      };

      await apiService.update(row.id, activated);
      queueAuditLog({
        moduleId,
        action: "update",
        recordId: resolveAuditRecordId(row as Record<string, unknown>),
        oldValues: row,
        newValues: activated,
      });
      await loadRows();
      return;
    }

    const statusKey = getRowStatusKey(row);
    const activated = {
      ...row,
      [statusKey]: "Active",
    };

    setRows((prev) =>
      prev.map((item) =>
        item.id === row.id ? activated : item,
      ),
    );
  };

  const handleSave = async (
    values: HrmsRow,
    mode: "add" | "edit",
  ) => {
    try {
      let saved: HrmsRow;
      const requisitionValues =
        isLeaveRequisitionModule && !isLeaveRequisitionAdmin && leaveRequisitionEmployeeId
          ? {
              ...values,
              Employee_id: String(leaveRequisitionEmployeeId),
              Branch_Id: String(
                values.Branch_Id || meProfile?.branchId || "",
              ),
              Employee_name: String(
                values.Employee_name || meProfile?.displayName || "",
              ),
              Employee_code: String(
                values.Employee_code || meProfile?.employeeCode || "",
              ),
            }
          : values;

      const payload = enrichConfigRow(
        moduleId,
        isEmployeeModule
          ? enrichEmployeeRow(requisitionValues, organizationOptions, {
              gender: genderOptions,
              bloodGroup: bloodGroupOptions,
              maritalStatus: maritalStatusOptions,
            })
          : requisitionValues,
        configLookups,
        rows,
      );

      if (usesApi && apiService) {
        const previous = mode === "edit" ? editRow ?? payload : undefined;
        saved =
          mode === "edit"
            ? await apiService.update(
                isLeaveEntitlementModule
                  ? String(payload.Employee_Leave_Id ?? payload.id)
                  : String(payload.id),
                payload,
              )
            : await apiService.create(payload);

        queueAuditLog({
          moduleId,
          action: mode === "edit" ? "update" : "create",
          recordId: resolveAuditRecordId(saved as Record<string, unknown>),
          oldValues: mode === "edit" ? previous : undefined,
          newValues: saved,
        });

        await loadRows();
      } else {
        saved = payload;

        setRows((prev) => {
          const exists = prev.some(
            (row) => row.id === saved.id,
          );

          if (exists) {
            return prev.map((row) =>
              row.id === saved.id
                ? { ...row, ...saved }
                : row,
            );
          }

          return [...prev, saved];
        });
      }

      const label = resolveSaveLabel(saved, payload, config.nameKey);

      toast.success({
        title:
          mode === "edit"
            ? "Updated successfully"
            : "Saved successfully",

        message:
          `"${label}" has been ${mode === "edit"
            ? "updated"
            : "added"
          }.`,
      });
    } catch (error) {
      toast.error({
        title:
          mode === "edit"
            ? "Update failed"
            : "Save failed",

        message:
          error instanceof ApiError
            ? error.message
            : "Unable to save employee data.",
      });
    }
  };

  const deleteName = (row: HrmsRow) => {
    const name = row[config.nameKey];
    if (name) return String(name);
    return getRowLabel(row);
  };

  const handleSyncDevices = async () => {
    setSyncing(true);
    try {
      if (usesApi && apiService && apiService.sync) {
        const response = await apiService.sync();
        await loadRows({ showLoader: false });
        toast.success({
          title: "Sync Successful",
          message: response.message || "Connected devices synced successfully.",
        });
      } else {
        toast.error({
          title: "Configuration Error",
          message: "Sync API is not available.",
        });
      }
    } catch (err) {
      toast.error({
        title: "Sync Failed",
        message: err instanceof ApiError ? err.message : "Unable to sync devices.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const decideApproval = async (row: HrmsRow, status: "Approved" | "Rejected", remarks = "") => {
    try {
      const id = Number(row.Leave_Application_Id ?? row.id);
      if (!Number.isFinite(id) || id <= 0) {
        throw new Error("Leave application ID is missing or invalid.");
      }
      const saved =
        status === "Approved"
          ? await leaveApprovalService.approve(id, remarks, row)
          : await leaveApprovalService.reject(id, remarks, row);

      queueAuditLog({
        moduleId,
        action: "update",
        recordId: resolveAuditRecordId(saved as Record<string, unknown>),
        oldValues: row,
        newValues: saved,
      });

      setApprovalConfirm(null);
      await loadRows({ showLoader: false });
      toast.success({
        title: status === "Approved" ? "Leave approved" : "Leave rejected",
        message: `${String(saved.Application_no || saved.Employee_name || row.Application_no)} has been ${status.toLowerCase()}.`,
      });
    } catch (error) {
      toast.error({
        title: status === "Approved" ? "Approve failed" : "Reject failed",
        message:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unable to update leave application.",
      });
      throw error;
    }
  };

  const requestApprovalChange = (row: HrmsRow, status: "Approved" | "Rejected") => {
    const current = String(row.Application_status ?? row.Approval_status ?? "Pending");
    if (current === status) return;
    setApprovalConfirm({ row, status });
  };

  const resolvedExtraActions = useMemo(() => {
    if (moduleId === "devices") {
      return (
        <div className="flex items-center gap-2">
          {extraActions}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSyncDevices}
            disabled={syncing || loading}
          >
            <RefreshCw size={16} strokeWidth={2} className={syncing ? "animate-spin" : ""} />
            Sync Device
          </button>
        </div>
      );
    }
    return extraActions;
  }, [moduleId, extraActions, syncing, loading]);

  const activeStats = stats ?? config.stats;

  const tableRows = useMemo(() => {
    if (
      (!isDailyAttendanceModule && !isEmployeeModule) ||
      branchOptions.length === 0
    ) {
      return rows;
    }

    const nameById = new Map(
      branchOptions.map((option) => [option.value, option.label]),
    );

    return rows.map((row) => {
      const existingName = String(row.Branch_Name ?? "").trim();
      if (existingName) return row;

      const branchId = String(row.Branch_Id ?? "").trim();
      const resolvedName = branchId ? nameById.get(branchId) : undefined;
      return resolvedName ? { ...row, Branch_Name: resolvedName } : row;
    });
  }, [branchOptions, isDailyAttendanceModule, isEmployeeModule, rows]);

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        {topContent}
        {activeStats && activeStats.length > 0 ? (
          <div className="stat-grid mb-4">
            {activeStats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value(rows)}
                change={stat.change(rows)}
                hint={stat.hint}
                description={stat.description}
                tone={stat.tone}
                icon={stat.icon}
                positive={stat.positive}
              />
            ))}
          </div>
        ) : null}
        <DataTable
          title={titleRender ?? config.title}
          searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
          actionLabel={config.actionLabel}
          onAction={() => setAddOpen(true)}
          showRowActions
          statusToggle={
            isLeaveApprovalModule || isLeaveRequisitionModule
              ? false
              : (config.statusToggle ?? usesApi)
          }
          onRowEdit={isLeaveApprovalModule ? undefined : handleEdit}
          onRowDelete={isLeaveApprovalModule ? undefined : handleDelete}
          onRowActivate={
            isLeaveApprovalModule || isLeaveRequisitionModule ? undefined : handleActivate
          }
          renderRowActions={
            isLeaveApprovalModule
              ? (row) => {
                  const status = String(
                    row.Application_status ?? row.Approval_status ?? "Pending",
                  );
                  const isPending = status.toLowerCase() === "pending";
                  if (!isPending) {
                    return <SoftStatus value={status} />;
                  }
                  return (
                    <div className="leave-approval-actions">
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => requestApprovalChange(row, "Approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => requestApprovalChange(row, "Rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  );
                }
              : undefined
          }
          deleteConfirmTitle={
            isLeaveRequisitionModule
              ? "Cancel leave requisition?"
              : (config.statusToggle ?? usesApi)
                ? `Deactivate ${config.title.toLowerCase()}?`
                : `Delete ${config.title.toLowerCase()}?`
          }
          deleteConfirmMessage={
            isLeaveRequisitionModule
              ? "This will cancel the pending application. Only pending requisitions can be cancelled."
              : (config.statusToggle ?? usesApi)
                ? DEACTIVATE_CONFIRM_MESSAGE
                : undefined
          }
          activateConfirmTitle={`Activate ${config.title.toLowerCase()}?`}
          activateConfirmMessage={ACTIVATE_CONFIRM_MESSAGE}
          rows={tableRows}
          columns={columns}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          getDeleteLabel={deleteName}
          emptyStateIcon={getModuleEmptyIcon(moduleId)}
          emptyStateTitle={`No ${config.title.toLowerCase()} records yet`}
          emptyStateMessage={emptyStateMessage}
          loading={loading || editLoading}
          extraActions={resolvedExtraActions}
        />
      </div>

      <MasterDataModal
        open={addOpen && !isLeaveEntitlementModule}
        onClose={() => {
          setAddOpen(false);
          if (isLeaveRequisitionModule) setLeaveBalanceRows([]);
        }}
        title={config.actionLabel || `Add ${config.title}`}
        subtitle={
          isLeaveRequisitionModule
            ? isLeaveRequisitionAdmin
              ? "Select branch and employee, then apply leave. New applications are saved as Pending."
              : "Apply for leave. Your employee profile is used automatically. New applications are saved as Pending."
            : modalSubtitle
        }
        submitLabel={submitLabel}
        fields={modalFields}
        sections={modalSections}
        size={config.modalSize}
        existingRows={moduleId === "devices" ? rows : undefined}
        defaultValues={
          isLeaveRequisitionModule && !isLeaveRequisitionAdmin && leaveRequisitionEmployeeId
            ? {
                Employee_id: String(leaveRequisitionEmployeeId),
                Branch_Id: meProfile?.branchId ? String(meProfile.branchId) : "",
                Employee_name: meProfile?.displayName ?? "",
                Employee_code: meProfile?.employeeCode ?? "",
              }
            : undefined
        }
        onSubmit={(values) => handleSave(values, "add")}
        adaptFields={isLeaveRequisitionModule ? adaptLeaveRequisitionFields : undefined}
        deriveValues={isLeaveRequisitionModule ? deriveLeaveRequisitionValues : undefined}
      />

      <LeaveEntitlementModal
        open={addOpen && isLeaveEntitlementModule}
        onClose={() => setAddOpen(false)}
        title={config.actionLabel || `Add ${config.title}`}
        subtitle={
          modalSubtitle ||
          "Set allocated days by leave type for the selected financial year."
        }
        submitLabel={submitLabel ?? "Save Entitlement"}
        financialYearOptions={financialYearOptions}
        leaveTypes={leaveTypeRows}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={!!editRow}
        onClose={() => {
          setEditRow(null);
          if (isLeaveRequisitionModule) setLeaveBalanceRows([]);
        }}
        title={`Edit ${config.title}`}
        subtitle={
          isLeaveRequisitionModule
            ? isLeaveRequisitionAdmin
              ? "Update a pending leave requisition for the selected employee."
              : "Update your pending leave requisition."
            : modalSubtitle
        }
        submitLabel={submitLabel ?? "Save Changes"}
        fields={modalFields}
        sections={modalSections}
        size={config.modalSize}
        initialValues={editInitialValues}
        existingRows={moduleId === "devices" ? rows : undefined}
        onSubmit={(values) => handleSave(values, "edit")}
        disableSubmit={config.disableEditSubmit}
        adaptFields={isLeaveRequisitionModule ? adaptLeaveRequisitionFields : undefined}
        deriveValues={isLeaveRequisitionModule ? deriveLeaveRequisitionValues : undefined}
      />

      <LeaveApprovalDialog
        open={Boolean(approvalConfirm)}
        status={approvalConfirm?.status ?? "Approved"}
        applicationLabel={String(
          approvalConfirm?.row.Application_no ||
            approvalConfirm?.row.Employee_name ||
            "this leave request",
        )}
        onClose={() => setApprovalConfirm(null)}
        onConfirm={async (remarks) => {
          if (!approvalConfirm) return;
          await decideApproval(approvalConfirm.row, approvalConfirm.status, remarks);
        }}
      />
    </>
  );
}

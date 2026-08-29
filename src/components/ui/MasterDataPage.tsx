"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getHrmsModule, getModuleFilterFields, getModuleFormFields } from "@/config/hrms-modules";
import { getHrmsMockRows } from "@/data/hrms-mock";
import { ApiError, applOptionService, gradeService, organizationService } from "@/lib/api";
import { applOptionsToSelectOptions } from "@/lib/api/services/appl-options.service";
import { EMPLOYEE_APPL_OPTION_FALLBACKS } from "@/config/employee-form-sections";
import { getMasterDataApiService, moduleUsesGradeSelect, moduleUsesOrganizationSelect } from "@/lib/api/master-data-services";
import { DEACTIVATE_CONFIRM_MESSAGE, ACTIVATE_CONFIRM_MESSAGE } from "@/lib/confirm-messages";
import { formatDateDisplay } from "@/lib/date-utils";
import { formatRowStatus, getRowStatusKey } from "@/lib/row-status";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, PersonCell, SoftStatus, type Column } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { getRowLabel } from "@/lib/row-label";
import type { FormField, HrmsRow, TableColumn } from "@/types/hrms";

type MasterDataPageProps = {
  moduleId: string;
  onRowEdit?: (row: HrmsRow) => void;
};

function formatCellValue(value: HrmsRow[string], type?: TableColumn["type"]): string {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "boolean") return value === true || value === "true" || value === 1 ? "Yes" : "No";
  if (type === "currency") return `₹${Number(value).toLocaleString("en-IN")}`;
  if (type === "date") return formatDateDisplay(String(value));
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
      render: (row) => formatCellValue(row[column.key], column.type),
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

export function MasterDataPage({ moduleId, onRowEdit }: MasterDataPageProps) {
  const config = getHrmsModule(moduleId);
  const toast = useToast();
  const usesApi = Boolean(config.usesApi);
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);
  const [organizationOptions, setOrganizationOptions] = useState<Array<{ value: string; label: string }>>(
    [],
  );
  const [gradeOptions, setGradeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [genderOptions, setGenderOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [bloodGroupOptions, setBloodGroupOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<Array<{ value: string; label: string }>>([]);

  const isEmployeeModule = moduleId === "employees";

  const columns = useMemo(() => buildColumns(config.columns), [config.columns]);
  const filterFields = useMemo(() => getModuleFilterFields(config), [config]);
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
      if (field.name === "Grade_Id" && usesGradeSelect) {
        return { ...field, options: gradeOptions };
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
      return field;
    },
    [
      bloodGroupOptions,
      genderOptions,
      gradeOptions,
      isEmployeeModule,
      maritalStatusOptions,
      organizationOptions,
      usesGradeSelect,
      usesOrganizationSelect,
    ],
  );

  const modalFields = useMemo(() => {
    if (config.formSections?.length) return undefined;
    return baseFormFields.map(applyDynamicFieldOptions);
  }, [applyDynamicFieldOptions, baseFormFields, config.formSections]);

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
    return config.formSections.map((section) => ({
      ...section,
      fields: section.fields.map(applyDynamicFieldOptions),
    }));
  }, [applyDynamicFieldOptions, config.formSections]);

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

  const fetchModuleRows = useCallback(async (): Promise<HrmsRow[]> => {
    if (usesApi) {
      if (apiService) return apiService.list();
      return [];
    }
    return getHrmsMockRows(moduleId);
  }, [apiService, moduleId, usesApi]);

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
  }, [moduleId, usesApi]);

  const handleEdit = (row: HrmsRow) => {
    if (onRowEdit) {
      onRowEdit(row);
      return;
    }
    setEditRow(row);
  };

  const handleDelete = async (row: HrmsRow) => {
    if (usesApi && apiService) {
      await apiService.remove(row.id);
      await loadRows();
      return;
    }
    setRows((prev) => prev.filter((item) => item.id !== row.id));
  };

  const handleActivate = async (row: HrmsRow) => {
    const statusKey = getRowStatusKey(row);
    const activated = { ...row, [statusKey]: "Active" };

    if (usesApi && apiService) {
      await apiService.update(row.id, activated);
      await loadRows();
      return;
    }

    setRows((prev) => prev.map((item) => (item.id === row.id ? activated : item)));
  };

  const handleSave = async (values: HrmsRow, mode: "add" | "edit") => {
    let saved =
      moduleId === "employees"
        ? enrichEmployeeRow(values, organizationOptions, employeeApplOptions)
        : values;

    if (usesApi && apiService) {
      saved =
        mode === "edit"
          ? await apiService.update(saved.id, saved)
          : await apiService.create(saved);
      await loadRows();
    } else {
      setRows((prev) => {
        const exists = prev.some((row) => row.id === saved.id);
        if (exists) {
          return prev.map((row) => (row.id === saved.id ? { ...row, ...saved } : row));
        }
        return [...prev, saved];
      });
    }

    const label = String(saved[config.nameKey] ?? getRowLabel(saved));
    toast.success({
      title: mode === "edit" ? "Updated successfully" : "Saved successfully",
      message: `"${label}" has been ${mode === "edit" ? "updated" : "added"}.`,
    });
  };

  const deleteName = (row: HrmsRow) => {
    const name = row[config.nameKey];
    if (name) return String(name);
    return getRowLabel(row);
  };

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        <DataTable
          title={config.title}
          searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
          actionLabel={config.actionLabel}
          onAction={() => setAddOpen(true)}
          showRowActions
          statusToggle={usesApi}
          onRowEdit={handleEdit}
          onRowDelete={handleDelete}
          onRowActivate={handleActivate}
          deleteConfirmTitle={
            usesApi ? `Deactivate ${config.title.toLowerCase()}?` : `Delete ${config.title.toLowerCase()}?`
          }
          deleteConfirmMessage={usesApi ? DEACTIVATE_CONFIRM_MESSAGE : undefined}
          activateConfirmTitle={`Activate ${config.title.toLowerCase()}?`}
          activateConfirmMessage={ACTIVATE_CONFIRM_MESSAGE}
          rows={rows}
          columns={columns}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          getDeleteLabel={deleteName}
          emptyStateIcon={getModuleEmptyIcon(moduleId)}
          loading={loading}
        />
      </div>

      <MasterDataModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={config.actionLabel}
        fields={modalFields}
        sections={modalSections}
        size={config.modalSize}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        title={`Edit ${config.title}`}
        fields={modalFields}
        sections={modalSections}
        size={config.modalSize}
        initialValues={editInitialValues}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}

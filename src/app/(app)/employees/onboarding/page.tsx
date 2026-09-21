"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useI18n, translateHrmsLookup } from "@/i18n";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError } from "@/lib/api/client";
import { employeeOnboardingService } from "@/lib/api/services/employee-onboarding.service";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { getChecklistProgress, isOnboardingFlagDone } from "@/lib/onboarding-checklist";
import { formatDateDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function asOnboardId(value: HrmsRow[string]): string | number | null {
  if (value === undefined || value === null || value === "" || typeof value === "boolean" || value instanceof File) {
    return null;
  }
  return value;
}

export default function EmployeeOnboardingPage() {
  const { t, language } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const list = await employeeOnboardingService.list();
      setRows(list);
    } catch (error) {
      console.error(error);
      toast.error({
        title: t("employees.onboarding.errorTitle"),
        message: error instanceof ApiError ? error.message : t("employees.onboarding.loadError"),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const stats = useMemo(() => {
    const inProgress = rows.filter((row) => {
      const { percent } = getChecklistProgress(row);
      return percent > 0 && percent < 100;
    }).length;
    const pending = rows.filter((row) => getChecklistProgress(row).percent === 0).length;
    const completed = rows.filter((row) => getChecklistProgress(row).percent >= 100).length;
    const documentsPending = rows.filter((row) => !isOnboardingFlagDone(row.Step_documents_done)).length;

    return { inProgress, pending, completed, documentsPending };
  }, [rows]);

  const handleEdit = async (row: HrmsRow) => {
    const onboardId = asOnboardId(row.Onboard_id ?? row.id);
    if (onboardId === null) {
      toast.error({
        title: t("employees.onboarding.errorTitle"),
        message: "Missing onboarding id for this record.",
      });
      return;
    }

    setEditLoading(true);
    try {
      // Always fetch full detail for edit — list rows are incomplete.
      const detail = await employeeOnboardingService.get(onboardId);
      const resolvedId = String(detail.Onboard_id ?? detail.id ?? onboardId);
      setEditRow({
        ...detail,
        id: resolvedId,
        Onboard_id: detail.Onboard_id ?? resolvedId,
        // Keep list display labels only when the detail payload omits them.
        Display_name: detail.Display_name || row.Display_name,
        Employee_code: detail.Employee_code || row.Employee_code,
        Dept_Name: detail.Dept_Name || row.Dept_Name,
        Employment_status_name:
          detail.Employment_status_name || row.Employment_status_name,
      });
    } catch (error) {
      console.error(error);
      toast.error({
        title: t("employees.onboarding.errorTitle"),
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to load onboarding details.",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleSave = async (values: HrmsRow, mode: "add" | "edit") => {
    try {
      if (mode === "edit") {
        const onboardId = asOnboardId(editRow?.Onboard_id ?? editRow?.id ?? values.Onboard_id ?? values.id);
        if (onboardId === null) {
          throw new Error("Missing onboarding id for update.");
        }
        await employeeOnboardingService.update(onboardId, values);
        toast.success({ title: "Onboarding updated", message: "Checklist saved successfully." });
      } else {
        await employeeOnboardingService.create(values);
        toast.success({ title: "Onboarding started", message: "Checklist saved successfully." });
      }

      await loadRows();
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Unable to save onboarding record.");
    }
  };

  const handleDelete = async (row: HrmsRow) => {
    const onboardId = asOnboardId(row.Onboard_id ?? row.id);
    if (onboardId === null) return;

    try {
      await employeeOnboardingService.remove(onboardId);
      setRows((prev) => prev.filter((item) => String(item.id) !== String(row.id)));
      toast.success({
        title: "Onboarding removed",
        message: `"${row.Display_name}" was removed from the onboarding list.`,
      });
    } catch (error) {
      toast.error({
        title: t("employees.onboarding.errorTitle"),
        message: error instanceof ApiError ? error.message : "Unable to delete onboarding record.",
      });
      throw error;
    }
  };

  return (
    <>
      <PageHeader
        title={t("employees.onboarding.title")}
        section={t("employees.onboarding.section")}
        hideTitle
      />
      <div className="container-fluid">
        <div className="stat-grid mb-4">
          <StatCard
            title={t("employees.onboarding.inProgress")}
            value={String(stats.inProgress)}
            change={t("employees.onboarding.docsPending", { count: stats.documentsPending })}
            hint={t("employees.onboarding.active")}
            description={t("employees.onboarding.inProgressDesc")}
            tone="info"
            icon="userPlus"
          />
          <StatCard
            title={t("employees.onboarding.notStarted")}
            value={String(stats.pending)}
            change={t("employees.onboarding.awaiting")}
            hint={t("employees.onboarding.startHint")}
            description={t("employees.onboarding.notStartedDesc")}
            tone="warning"
            icon="clock"
          />
          <StatCard
            title={t("employees.onboarding.completed")}
            value={String(stats.completed)}
            change={t("employees.onboarding.ready")}
            hint={t("employees.onboarding.toJoin")}
            description={t("employees.onboarding.completedDesc")}
            tone="success"
            icon="users"
          />
        </div>

        <DataTable
          title={t("employees.onboarding.title")}
          searchPlaceholder={t("employees.onboarding.search")}
          actionLabel={t("employees.onboarding.start")}
          onAction={() => setAddOpen(true)}
          rows={rows}
          loading={loading || editLoading}
          searchKeys={["Employee_code", "Display_name", "Dept_Name", "Department_name", "Onboarding_stage"]}
          filterFields={[
            { key: "Dept_Name", label: translateHrmsLookup(language, "headers", "Department") },
            { key: "Onboarding_stage", label: translateHrmsLookup(language, "headers", "Stage") },
            { key: "Employment_status_name", label: translateHrmsLookup(language, "headers", "Status") },
          ]}
          onRowEdit={handleEdit}
          showRowActions
          deleteConfirmTitle={t("employees.onboarding.deleteConfirm")}
          deleteConfirmMessage={t("employees.onboarding.deleteConfirmMessage")}
          getDeleteLabel={(row) => String(row.Display_name ?? row.Employee_code ?? "this employee")}
          onRowDelete={handleDelete}
          emptyStateIcon={getModuleEmptyIcon("onboarding")}
          emptyStateTitle={t("employees.onboarding.emptyTitle")}
          emptyStateMessage={t("employees.onboarding.emptyMessage")}
          columns={[
            {
              key: "Employee_code",
              header: translateHrmsLookup(language, "headers", "Employee Code"),
              render: (row) => formatCell(row.Employee_code),
            },
            {
              key: "Display_name",
              header: translateHrmsLookup(language, "headers", "Employee"),
              render: (row) => (
                <PersonCell
                  name={String(row.Display_name ?? "—")}
                  subtitle={String(row.Employee_code ?? "")}
                  avatar={row.Photo_path ? String(row.Photo_path) : undefined}
                />
              ),
            },
            {
              key: "Department",
              header: translateHrmsLookup(language, "headers", "Department"),
              render: (row) => formatCell(row.Dept_Name ?? row.Department_name ?? row.Department),
            },
            {
              key: "Date_of_joining",
              header: translateHrmsLookup(language, "headers", "Join Date"),
              render: (row) => formatDateDisplay(String(row.Date_of_joining ?? "")),
            },
            {
              key: "Checklist_progress",
              header: translateHrmsLookup(language, "headers", "Checklist"),
              render: (row) => {
                const { completed, total, percent } = getChecklistProgress(row);
                return (
                  <div className="onboarding-table-progress">
                    <div className="progress">
                      <div
                        className="progress-bar bg-primary"
                        style={{ width: `${percent}%` }}
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <span className="onboarding-table-progress-label">
                      {t("employees.onboarding.stepsProgress", { completed, total })}
                    </span>
                  </div>
                );
              },
            },
            {
              key: "Onboarding_stage",
              header: translateHrmsLookup(language, "headers", "Stage"),
              render: (row) => {
                const rawStage = String(row.Onboarding_stage ?? "");
                const translatedStage = translateHrmsLookup(language, "labels", rawStage);
                return formatCell(translatedStage || rawStage);
              },
            },
            {
              key: "Employment_status",
              header: translateHrmsLookup(language, "headers", "Status"),
              render: (row) => (
                <SoftStatus value={String(row.Employment_status_name || row.Employment_status || "Pending")} />
              ),
            },
          ]}
        />
      </div>

      <OnboardingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("employees.onboarding.start")}
        submitLabel={t("employees.onboarding.saveContinue")}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <OnboardingModal
        key={editRow ? String(editRow.Onboard_id ?? editRow.id) : "onboarding-edit"}
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title={t("employees.onboarding.continue")}
        submitLabel={t("employees.onboarding.saveProgress")}
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}

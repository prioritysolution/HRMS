"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import { PageHeader } from "@/components/ui/PageHeader";
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
        title: "Error",
        message: error instanceof ApiError ? error.message : "Failed to load onboarding list",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
        title: "Load failed",
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
        title: "Load failed",
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
        title: "Delete failed",
        message: error instanceof ApiError ? error.message : "Unable to delete onboarding record.",
      });
      throw error;
    }
  };

  return (
    <>
      <PageHeader title="Employee Onboarding" section="Employee Management" hideTitle />
      <div className="container-fluid">
        <div className="stat-grid mb-4">
          <StatCard
            title="In Progress"
            value={String(stats.inProgress)}
            change={`${stats.documentsPending} docs pending`}
            hint="active"
            description="Employees mid-onboarding"
            tone="info"
            icon="userPlus"
          />
          <StatCard
            title="Not Started"
            value={String(stats.pending)}
            change="awaiting"
            hint="start"
            description="Checklist not yet begun"
            tone="warning"
            icon="clock"
          />
          <StatCard
            title="Completed"
            value={String(stats.completed)}
            change="ready"
            hint="to join"
            description="All checklist steps done"
            tone="success"
            icon="users"
          />
        </div>

        <DataTable
          title="Employee Onboarding"
          searchPlaceholder="Search by employee code or name..."
          actionLabel="Start Onboarding"
          onAction={() => setAddOpen(true)}
          rows={rows}
          loading={loading || editLoading}
          searchKeys={["Employee_code", "Display_name", "Dept_Name", "Department_name", "Onboarding_stage"]}
          filterFields={[
            { key: "Dept_Name", label: "Department" },
            { key: "Onboarding_stage", label: "Stage" },
            { key: "Employment_status_name", label: "Status" },
          ]}
          onRowEdit={handleEdit}
          showRowActions
          deleteConfirmTitle="Remove onboarding record?"
          deleteConfirmMessage='Remove onboarding for "{name}"? This will not delete the employee profile.'
          getDeleteLabel={(row) => String(row.Display_name ?? row.Employee_code ?? "this employee")}
          onRowDelete={handleDelete}
          emptyStateIcon={getModuleEmptyIcon("onboarding")}
          emptyStateTitle="No onboarding records yet"
          emptyStateMessage="Start onboarding for a new employee to track registration, documents, and checklist progress."
          columns={[
            {
              key: "Employee_code",
              header: "Employee Code",
              render: (row) => formatCell(row.Employee_code),
            },
            {
              key: "Display_name",
              header: "Employee",
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
              header: "Department",
              render: (row) => formatCell(row.Dept_Name ?? row.Department_name ?? row.Department),
            },
            {
              key: "Date_of_joining",
              header: "Join Date",
              render: (row) => formatDateDisplay(String(row.Date_of_joining ?? "")),
            },
            {
              key: "Checklist_progress",
              header: "Checklist",
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
                      {completed}/{total} steps
                    </span>
                  </div>
                );
              },
            },
            {
              key: "Onboarding_stage",
              header: "Stage",
              render: (row) => formatCell(row.Onboarding_stage),
            },
            {
              key: "Employment_status",
              header: "Status",
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
        title="Start Onboarding"
        submitLabel="Save & Continue"
        onSubmit={(values) => handleSave(values, "add")}
      />

      <OnboardingModal
        key={editRow ? String(editRow.Onboard_id ?? editRow.id) : "onboarding-edit"}
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title="Continue Onboarding"
        submitLabel="Save Progress"
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { getHrmsMockRows } from "@/data/hrms-mock";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { enrichOnboardingRow, getChecklistProgress } from "@/lib/onboarding-checklist";
import { formatDateDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export default function EmployeeOnboardingPage() {
  const toast = useToast();
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const loadRows = useCallback(() => {
    setLoading(true);
    setRows(getHrmsMockRows("onboarding"));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const stats = useMemo(() => {
    const inProgress = rows.filter((row) => {
      const { percent } = getChecklistProgress(row);
      return percent > 0 && percent < 100;
    }).length;
    const pending = rows.filter((row) => getChecklistProgress(row).percent === 0).length;
    const completed = rows.filter((row) => getChecklistProgress(row).percent >= 100).length;
    const documentsPending = rows.filter((row) => row.Step_documents_done !== true && row.Step_documents_done !== "true").length;

    return { inProgress, pending, completed, documentsPending };
  }, [rows]);

  const handleSave = async (values: HrmsRow, mode: "add" | "edit") => {
    const saved = enrichOnboardingRow(values);

    setRows((prev) => {
      const exists = prev.some((row) => row.id === saved.id);
      if (exists) {
        return prev.map((row) => (row.id === saved.id ? saved : row));
      }
      return [saved, ...prev];
    });

    toast.success({
      title: mode === "edit" ? "Onboarding updated" : "Onboarding started",
      message: `"${saved.Display_name}" checklist saved (${saved.Checklist_progress}% complete).`,
    });
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
          loading={loading}
          searchKeys={["Employee_code", "Display_name", "Department", "Onboarding_stage"]}
          filterFields={[
            { key: "Department", label: "Department" },
            { key: "Onboarding_stage", label: "Stage" },
            { key: "Employment_status", label: "Status" },
          ]}
          onRowEdit={setEditRow}
          showRowActions
          deleteConfirmTitle="Remove onboarding record?"
          deleteConfirmMessage='Remove onboarding for "{name}"? This will not delete the employee profile.'
          getDeleteLabel={(row) => String(row.Display_name ?? row.Employee_code ?? "this employee")}
          onRowDelete={(row) => {
            setRows((prev) => prev.filter((item) => item.id !== row.id));
            toast.success({
              title: "Onboarding removed",
              message: `"${row.Display_name}" was removed from the onboarding list.`,
            });
          }}
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
              render: (row) => formatCell(row.Department),
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
              render: (row) => <SoftStatus value={String(row.Employment_status ?? "Pending")} />,
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

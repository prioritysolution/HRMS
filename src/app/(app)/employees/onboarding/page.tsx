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

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const response = await apiClient.get<any[]>("/api/v1/employee-onboarding/list");
      if (Array.isArray(response)) {
        setRows(response.map((row: any) => ({
          ...row, 
          id: row.Onboard_id ?? row.id,
          Display_name: row.Employee_name || `${row.First_name || ""} ${row.Last_name || ""}`.trim() || row.Display_name,
          Department: String(row.Dept_Id || ""),
          Designation: String(row.Desig_Id || ""),
          Employment_type: String(row.Emp_type_id || ""),
          Branch: String(row.Branch_Id || ""),
          Grade: String(row.Grade_Id || ""),
          Shift: Array.isArray(row.Shift_id) ? row.Shift_id.map(String).join(",") : String(row.Shift_id || ""),
          Employment_status: String(row.Employment_status || ""),
        })));
      }
    } catch (error: any) {
      console.error(error);
      toast.error({ title: "Error", message: "Failed to load onboarding list" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
    try {
      const { apiClient } = await import("@/lib/api/client");
      const payload = {
        employee_id: values.Employee_id,
        user_name: values.Username,
        work_email: values.Work_email,
        idcard_no: values.Id_card_number,
        idcard_doc_path: typeof values.Photo_path === "string" ? values.Photo_path : undefined,
        agreement_doc_path: typeof values.Employment_agreement === "string" ? values.Employment_agreement : undefined,
        remarks: values.Verification_remarks,
        date_of_joining: values.Date_of_joining,
        device_user_id: values.Device_user_id,
        department: values.Department ? Number(values.Department) : null,
        dept_id: values.Department ? Number(values.Department) : null,
        designation: values.Designation ? Number(values.Designation) : null,
        desig_id: values.Designation ? Number(values.Designation) : null,
        employment_type: values.Employment_type ? Number(values.Employment_type) : null,
        emp_type_id: values.Employment_type ? Number(values.Employment_type) : null,
        branch: values.Branch ? Number(values.Branch) : null,
        branch_id: values.Branch ? Number(values.Branch) : null,
        grade: values.Grade ? Number(values.Grade) : null,
        grade_id: values.Grade ? Number(values.Grade) : null,
        shift: values.Shift ? String(values.Shift).split(",").map(Number) : null,
        shift_id: values.Shift ? String(values.Shift).split(",").map(Number) : null,
        employment_status: values.Employment_status ? Number(values.Employment_status) : null,
        identifications: [
          values.Aadhaar_no ? { id_type: 1, id_number: values.Aadhaar_no } : null,
          values.PAN ? { id_type: 2, id_number: values.PAN } : null,
        ].filter(Boolean),
        statutory: {
          pf_no: values.PF_number,
          uan_no: values.UAN,
          esi_no: values.ESI_number,
          ptax_no: values.Professional_tax,
          tds_applicable: values.TDS ? 1 : 0,
        }
      };

      let finalBody: any = payload;
      let hasFiles = false;
      const fileFields = ["Photo", "Employment_agreement", "Aadhaar_doc", "PAN_doc", "Educational_certificates", "Experience_certificates"];
      fileFields.forEach((f) => {
        if (values[f] instanceof File) hasFiles = true;
      });

      if (hasFiles) {
        const formData = new FormData();
        const buildFormData = (fd: FormData, data: any, parentKey?: string) => {
          if (data && typeof data === "object" && !(data instanceof Date) && !(data instanceof File)) {
            Object.keys(data).forEach((key) => {
              buildFormData(fd, data[key], parentKey ? `${parentKey}[${key}]` : key);
            });
          } else if (data !== undefined && data !== null) {
            fd.append(parentKey!, data instanceof File ? data : String(data));
          }
        };
        buildFormData(formData, payload);

        if (values.Photo instanceof File) formData.append("idcard_doc", values.Photo);
        if (values.Employment_agreement instanceof File) formData.append("agreement_doc", values.Employment_agreement);
        if (values.Aadhaar_doc instanceof File) formData.append("aadhaar_doc", values.Aadhaar_doc);
        if (values.PAN_doc instanceof File) formData.append("pan_doc", values.PAN_doc);
        if (values.Educational_certificates instanceof File) formData.append("educational_certificates", values.Educational_certificates);
        if (values.Experience_certificates instanceof File) formData.append("experience_certificates", values.Experience_certificates);
        
        finalBody = formData;
      }

      if (mode === "edit" || editRow) {
        await apiClient.put(
          `/api/v1/employee-onboarding/update/${(editRow?.id ?? values.Onboard_id ?? values.id)}`,
          finalBody
        );
        toast.success({ title: "Onboarding updated", message: "Checklist saved successfully." });
      } else {
        await apiClient.post("/api/v1/employee-onboarding/create", finalBody);
        toast.success({ title: "Onboarding started", message: "Checklist saved successfully." });
      }

      await loadRows();
    } catch (error: any) {
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
              render: (row) => formatCell(row.Dept_Name),
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
              render: (row) => <SoftStatus value={String(row.Employment_status_name || "Pending")} />,
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

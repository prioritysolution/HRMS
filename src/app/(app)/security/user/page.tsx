"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, SoftStatus, type Column } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError } from "@/lib/api/client";
import { branchService } from "@/lib/api/services/branch.service";
import { userService } from "@/lib/api/services/user.service";
import { ACTIVATE_CONFIRM_MESSAGE, DEACTIVATE_CONFIRM_MESSAGE } from "@/lib/confirm-messages";
import type { HrmsRow } from "@/types/hrms";

const LOGIN_STATUS_OPTIONS = [
  { value: "LogIn", label: "LogIn" },
  { value: "LogOut", label: "LogOut" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export default function UserManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [branchOptions, setBranchOptions] = useState<Array<{ value: string; label: string }>>([]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const nextRows = await userService.list();
      setRows(nextRows);
    } catch (error) {
      setRows([]);
      toast.error({
        title: "Unable to load users",
        message: error instanceof ApiError ? error.message : "Check the API connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      try {
        const branches = await branchService.list({ status: 1 });
        if (cancelled) return;
        setBranchOptions(
          branches
            .map((row) => {
              const id = String(row.Branch_Id ?? row.id ?? "").trim();
              const name = String(row.Branch_Name ?? "").trim();
              if (!id || !name) return null;
              return { value: name, label: name };
            })
            .filter((option): option is { value: string; label: string } => option !== null),
        );
      } catch {
        if (!cancelled) setBranchOptions([]);
      }
    }

    void loadBranches();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const columns = useMemo<Column<HrmsRow>[]>(
    () => [
      {
        key: "User_Name",
        header: "User Name",
        render: (row) => String(row.User_Name ?? "—"),
      },
      {
        key: "Org_Name",
        header: "Organization",
        render: (row) => String(row.Org_Name || "—"),
      },
      {
        key: "Branch_Name",
        header: "Branch",
        render: (row) => String(row.Branch_Name || "—"),
      },
      {
        key: "Status",
        header: "Status",
        render: (row) => <SoftStatus value={String(row.Status ?? "Inactive")} />,
      },
      {
        key: "Login_Status",
        header: "Login Status",
        render: (row) => <SoftStatus value={String(row.Login_Status ?? "LogOut")} />,
      },
    ],
    [],
  );

  const filterFields = useMemo(
    () => [
      {
        key: "Branch_Name",
        label: "Branch",
        options: branchOptions,
      },
      {
        key: "Status",
        label: "Status",
        options: STATUS_OPTIONS,
      },
      {
        key: "Login_Status",
        label: "Login Status",
        options: LOGIN_STATUS_OPTIONS,
      },
    ],
    [branchOptions],
  );

  const handleDeactivate = async (row: HrmsRow) => {
    const userId = Number(row.User_Id ?? row.id);
    if (!userId) throw new Error("User ID is missing.");
    await userService.updateStatus(userId, 0);
    await loadRows();
  };

  const handleActivate = async (row: HrmsRow) => {
    const userId = Number(row.User_Id ?? row.id);
    if (!userId) throw new Error("User ID is missing.");
    await userService.updateStatus(userId, 1);
    await loadRows();
  };

  return (
    <>
      <PageHeader title="User Management" section="Security" hideTitle />
      <div className="container-fluid">
        <DataTable
          title="User Management"
          searchPlaceholder="Search users..."
          showRowActions
          statusToggle
          onRowDelete={handleDeactivate}
          onRowActivate={handleActivate}
          deleteConfirmTitle="Deactivate user?"
          deleteConfirmMessage={DEACTIVATE_CONFIRM_MESSAGE}
          activateConfirmTitle="Activate user?"
          activateConfirmMessage={ACTIVATE_CONFIRM_MESSAGE}
          rows={rows}
          columns={columns}
          searchKeys={["User_Name", "Org_Name", "Branch_Name", "Branch_Code"]}
          filterFields={filterFields}
          getDeleteLabel={(row) => String(row.User_Name ?? "this user")}
          emptyStateIcon={Users}
          emptyStateTitle="No users found"
          emptyStateMessage="No user accounts are available for this organization yet."
          loading={loading}
        />
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ClampedText,
  DataTable,
  SoftStatus,
  type Column,
} from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError } from "@/lib/api/client";
import { branchService } from "@/lib/api/services/branch.service";
import { loginHistoryService } from "@/lib/api/services/login-history.service";
import { pad2 } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

const LOGIN_RESULT_OPTIONS = [
  { value: "Success", label: "Success" },
  { value: "Failed", label: "Failed" },
];

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    from: `${year}-${pad2(month + 1)}-01`,
    to: `${year}-${pad2(month + 1)}-${pad2(lastDay)}`,
  };
}

function toApiDateTime(date: string, endOfDay = false): string | undefined {
  const trimmed = date.trim();
  if (!trimmed) return undefined;
  return endOfDay ? `${trimmed} 23:59:59` : `${trimmed} 00:00:00`;
}

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export default function LoginHistoryPage() {
  const toast = useToast();
  const defaults = useMemo(() => currentMonthRange(), []);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [branchOptions, setBranchOptions] = useState<Array<{ value: string; label: string }>>(
    [],
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const nextRows = await loginHistoryService.list({
        from_date: toApiDateTime(fromDate),
        to_date: toApiDateTime(toDate, true),
      });
      setRows(nextRows);
    } catch (error) {
      setRows([]);
      toast.error({
        title: "Unable to load login history",
        message:
          error instanceof ApiError ? error.message : "Check the API connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, toast]);

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      try {
        const branches = await branchService.list({ status: 1 });
        if (cancelled) return;
        setBranchOptions(
          branches
            .map((row) => {
              const name = String(row.Branch_Name ?? "").trim();
              if (!name) return null;
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
        render: (row) => formatCell(row.User_Name),
      },
      {
        key: "Branch_Name",
        header: "Branch",
        render: (row) => formatCell(row.Branch_Name),
      },
      {
        key: "Login_Status",
        header: "Result",
        render: (row) => <SoftStatus value={String(row.Login_Status ?? "Failed")} />,
      },
      {
        key: "Login_at",
        header: "Login At",
        render: (row) => formatCell(row.Login_at),
      },
      {
        key: "Logout_at",
        header: "Logout At",
        render: (row) => formatCell(row.Logout_at),
      },
      {
        key: "Ip_address",
        header: "IP Address",
        render: (row) => formatCell(row.Ip_address),
      },
      {
        key: "User_agent",
        header: "User Agent",
        render: (row) => <ClampedText text={String(row.User_agent ?? "")} />,
      },
      {
        key: "Remarks",
        header: "Remarks",
        render: (row) => <ClampedText text={String(row.Remarks ?? "")} />,
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
        key: "Login_Status",
        label: "Result",
        options: LOGIN_RESULT_OPTIONS,
      },
    ],
    [branchOptions],
  );

  return (
    <>
      <PageHeader title="Login History" section="Security" hideTitle />
      <div className="container-fluid">
        <DataTable
          title="Login History"
          searchPlaceholder="Search by user, IP, remarks..."
          showRowActions={false}
          rows={rows}
          columns={columns}
          searchKeys={["User_Name", "Branch_Name", "Ip_address", "Remarks", "User_agent"]}
          filterFields={filterFields}
          emptyStateIcon={History}
          emptyStateTitle="No login history found"
          emptyStateMessage="Try adjusting the date range or filters."
          loading={loading}
          filterExtra={
            <>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="login-history-from">
                  From
                </label>
                <input
                  id="login-history-from"
                  type="date"
                  className="form-control form-control-sm"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="login-history-to">
                  To
                </label>
                <input
                  id="login-history-to"
                  type="date"
                  className="form-control form-control-sm"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </>
          }
        />
      </div>
    </>
  );
}

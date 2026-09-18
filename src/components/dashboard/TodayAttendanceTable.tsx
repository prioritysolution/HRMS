"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Clock3 } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TableEmptyState } from "@/components/ui/TableEmptyState";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { PersonCell } from "@/components/ui/DataTable";
import { useI18n } from "@/i18n";
import { branchService } from "@/lib/api/services/branch.service";
import { dashboardService } from "@/lib/api/services/dashboard.service";
import type { DashboardTodayAttendance } from "@/lib/api/types";
import { formatTimeDisplay } from "@/lib/date-utils";

function formatTime(value: string | null): string {
  if (!value) return "—";
  return formatTimeDisplay(value) || "—";
}

export function TodayAttendanceTable({
  rows = [],
  viewMoreHref = "/attendance/daily",
}: {
  rows?: DashboardTodayAttendance[];
  viewMoreHref?: string;
}) {
  const { t } = useI18n();
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [attendanceRows, setAttendanceRows] = useState<DashboardTodayAttendance[]>(rows);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);

  const loadBranches = useCallback(async () => {
    setLoadingBranches(true);
    try {
      const payload = await branchService.list();
      setBranches(
        payload
          .map((row) => ({
            value: String(row.Branch_Id),
            label: String(row.Branch_Name ?? ""),
          }))
          .filter((option) => option.value && option.label),
      );
    } catch {
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  const loadAttendance = useCallback(async (branchId: string) => {
    setLoadingRows(true);
    try {
      if (!branchId) {
        setAttendanceRows([]);
        return;
      }
      const data = await dashboardService.overview({
        branch_id: Number(branchId),
        limit: 50,
      });
      setAttendanceRows(data.today_attendance ?? []);
    } catch {
      setAttendanceRows([]);
    } finally {
      setLoadingRows(false);
    }
  }, []);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    if (selectedBranchId) {
      void loadAttendance(selectedBranchId);
    }
  }, [selectedBranchId, loadAttendance]);

  useEffect(() => {
    if (!selectedBranchId) {
      setAttendanceRows(rows);
    }
  }, [rows, selectedBranchId]);

  const branchOptions = [
    { value: "", label: t("dashboard.allBranches") },
    ...branches,
  ];

  const emptyMessage = selectedBranchId
    ? t("dashboard.emptyBranch")
    : t("dashboard.emptyToday");

  const markedLabel =
    attendanceRows.length === 1
      ? t("dashboard.employeeMarkedOne")
      : t("dashboard.employeesMarked", { count: attendanceRows.length });

  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h5 className="card-title mb-1">{t("dashboard.todayAttendance")}</h5>
            <small className="text-muted">
              {loadingRows ? t("common.loading") : markedLabel}
            </small>
          </div>
          <div className="flex items-center gap-2">
            <SearchableSelect
              size="sm"
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              options={branchOptions}
              placeholder={t("dashboard.selectBranch")}
              emptyLabel={t("dashboard.allBranches")}
              clearable={false}
              disabled={loadingBranches}
              className="w-auto min-w-[11.5rem]"
            />
            <Link
              href={viewMoreHref}
              className="btn btn-primary btn-sm rounded-md inline-flex items-center justify-center gap-2 h-[38px] min-w-[9.5rem] whitespace-nowrap px-3.5"
            >
              <CalendarCheck size={14} strokeWidth={2} />
              {t("dashboard.viewMore")}
            </Link>
          </div>
        </div>
        <div className="table-wrap overflow-x-auto">
          <table className="data-table perform-table w-full">
            <thead className="table-light">
              <tr>
                <th className="si-col">{t("dashboard.siNo")}</th>
                <th>{t("dashboard.employeeCode")}</th>
                <th>{t("dashboard.employeeName")}</th>
                <th className="text-center">{t("dashboard.inTime")}</th>
                <th className="text-center">{t("dashboard.outTime")}</th>
                <th>{t("dashboard.status")}</th>
              </tr>
            </thead>
            <tbody>
              {loadingRows ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`today-skel-${i}`} aria-busy="true">
                    <td><div className="ui-skeleton h-4 w-6 rounded" /></td>
                    <td><div className="ui-skeleton h-4 w-20 rounded" /></td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="ui-skeleton w-7 h-7 rounded-full flex-shrink-0" />
                        <div className="space-y-1">
                          <div className="ui-skeleton h-3.5 w-28 rounded" />
                          <div className="ui-skeleton h-2.5 w-16 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="text-center"><div className="ui-skeleton h-4 w-14 mx-auto rounded" /></td>
                    <td className="text-center"><div className="ui-skeleton h-4 w-14 mx-auto rounded" /></td>
                    <td><div className="ui-skeleton h-6 w-16 rounded-full" /></td>
                  </tr>
                ))
              ) : attendanceRows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <TableEmptyState
                      icon={Clock3}
                      title={t("dashboard.noDataFound")}
                      message={emptyMessage}
                    />
                  </td>
                </tr>
              ) : (
                attendanceRows.map((row, index) => (
                  <tr
                    key={`${row.Employee_id}-${row.Employee_code}-${index}`}
                    className={index === attendanceRows.length - 1 ? "last-row" : undefined}
                  >
                    <td className="si-col">{index + 1}</td>
                    <td>{row.Employee_code || "—"}</td>
                    <td>
                      <PersonCell
                        name={row.Employee_name || "—"}
                        avatar={row.Photo_path || undefined}
                      />
                    </td>
                    <td className="text-center">{formatTime(row.In_time)}</td>
                    <td className="text-center">{formatTime(row.Out_time)}</td>
                    <td>
                      <StatusBadge
                        label={row.Attendance_status_name || "—"}
                        tone={statusTone(row.Attendance_status_name || "")}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

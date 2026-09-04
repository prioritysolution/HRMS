"use client";

import Link from "next/link";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import type { DashboardTodayAttendance } from "@/lib/api/types";

function formatTime(value: string | null): string {
  if (!value) return "—";
  const match = value.match(/(\d{1,2}:\d{2})(?::\d{2})?/);
  if (!match) return value;
  const [hours, minutes] = match[1].split(":");
  return `${hours.padStart(2, "0")}:${minutes}`;
}

export function TodayAttendanceTable({
  rows = [],
  viewMoreHref = "/attendance/daily",
}: {
  rows?: DashboardTodayAttendance[];
  viewMoreHref?: string;
}) {
  return (
    <div className="card h-full">
      <div className="card-body">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h5 className="card-title mb-0">Today&apos;s Attendance</h5>
          <Link href={viewMoreHref} className="btn btn-sm btn-outline rounded-md">
            View More
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data-table perform-table">
            <thead className="table-light">
              <tr>
                <th className="si-col">SI NO</th>
                <th>Employee Code</th>
                <th>Employee Name</th>
                <th className="text-center">In Time</th>
                <th className="text-center">Out Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No attendance records for today.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={`${row.Employee_id}-${row.Employee_code}-${index}`}
                    className={index === rows.length - 1 ? "last-row" : undefined}
                  >
                    <td className="si-col">{index + 1}</td>
                    <td>{row.Employee_code || "—"}</td>
                    <td>{row.Employee_name || "—"}</td>
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

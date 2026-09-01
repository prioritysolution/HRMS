"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";
import { MONTHLY_STATS, enrichMonthlyRow } from "@/lib/attendance-stats";

export default function MonthlyAttendancePage() {
  return (
    <AttendanceModulePage
      moduleId="monthly-attendance"
      stats={MONTHLY_STATS}
      enrichRow={enrichMonthlyRow}
      modalSubtitle="Generate or update monthly attendance summary for an employee."
      emptyStateMessage="Generate monthly summaries to review present, absent, late, and overtime totals."
    />
  );
}

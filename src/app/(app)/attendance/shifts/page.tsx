"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";

export default function AttendanceShiftsPage() {
  return (
    <AttendanceModulePage
      moduleId="attendance-shifts"
      modalSubtitle="Assign shift timing to employees for attendance calculation."
    />
  );
}

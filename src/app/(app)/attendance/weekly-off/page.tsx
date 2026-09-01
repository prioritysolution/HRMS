"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";

export default function WeeklyOffPage() {
  return (
    <AttendanceModulePage
      moduleId="weekly-off"
      modalSubtitle="Configure weekly off days by branch and off type."
    />
  );
}

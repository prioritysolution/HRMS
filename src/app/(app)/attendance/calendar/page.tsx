"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";

export default function AttendanceCalendarPage() {
  return (
    <AttendanceModulePage
      moduleId="attendance-calendar"
      modalSubtitle="Define working days, holidays, weekly off, and special calendar entries."
      emptyStateMessage="Add calendar entries for holidays, weekly off, and working day planning."
    />
  );
}

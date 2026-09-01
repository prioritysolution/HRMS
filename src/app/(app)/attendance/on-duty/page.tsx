"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";

export default function OnDutyPage() {
  return (
    <AttendanceModulePage
      moduleId="on-duty"
      modalSubtitle="Schedule and track on-duty assignments for employees."
      emptyStateMessage="Assign on-duty schedules for employees working outside regular office attendance."
    />
  );
}

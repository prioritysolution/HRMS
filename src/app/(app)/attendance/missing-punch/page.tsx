"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";

export default function MissingPunchPage() {
  return (
    <AttendanceModulePage
      moduleId="missing-punch"
      modalSubtitle="Track and resolve missing check-in or check-out punches."
    />
  );
}

"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";

export default function CheckInOutPage() {
  return (
    <AttendanceModulePage
      moduleId="check-in-out"
      modalSubtitle="Capture check-in and check-out punches from all attendance sources."
    />
  );
}

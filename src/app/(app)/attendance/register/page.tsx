"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";

export default function AttendanceRegisterPage() {
  return (
    <AttendanceModulePage
      moduleId="attendance-register"
      modalSubtitle="Record working hours, overtime, and attendance source in the register."
    />
  );
}

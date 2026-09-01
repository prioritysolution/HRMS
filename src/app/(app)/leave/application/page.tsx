"use client";

import { LeaveModulePage } from "@/components/leave/LeaveModulePage";
import { APPLICATION_STATS } from "@/lib/leave-stats";

export default function LeaveApplicationPage() {
  return (
    <LeaveModulePage
      moduleId="leave-application"
      stats={APPLICATION_STATS}
      modalSubtitle="Employees can apply for leave via web or mobile with supporting documents."
      emptyStateMessage="Submit a leave application with leave type, dates, reason, and optional document."
    />
  );
}

"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";

export default function EssPayslipsPage() {
  return (
    <EssModulePage
      moduleId="ess-payslips"
      showDownloadAction
      emptyStateMessage="No payslips available yet. Payslips are published after payroll finalization."
    />
  );
}

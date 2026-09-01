"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";

export default function EssReimbursementPage() {
  return (
    <EssModulePage
      moduleId="ess-reimbursement"
      allowAdd
      modalSubtitle="Upload receipts and submit your expense claim for finance review."
      emptyStateMessage="No reimbursement claims yet. Submit your first claim using 'Add New'."
    />
  );
}

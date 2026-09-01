"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";

export default function EssRequestsPage() {
  return (
    <EssModulePage
      moduleId="ess-requests"
      allowAdd
      hrApprovalNotice
      modalSubtitle="Describe your request. Critical changes will be routed to HR for approval."
      emptyStateMessage="No service requests submitted yet."
    />
  );
}

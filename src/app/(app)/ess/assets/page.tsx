"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";

export default function EssAssetsPage() {
  return (
    <EssModulePage
      moduleId="ess-assets"
      emptyStateMessage="No assets are currently assigned to you."
    />
  );
}

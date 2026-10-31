"use client";

import { Suspense } from "react";
import { SupportPage } from "@/components/support/SupportDesk";

export default function SupportRoute() {
  return (
    <Suspense fallback={null}>
      <SupportPage />
    </Suspense>
  );
}

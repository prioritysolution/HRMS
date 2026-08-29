"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

/** Same employees list used by /employees — kept for menu/legacy paths. */
export default function EmployeeProfilePage() {
  return <MasterDataPage moduleId="employees" />;
}

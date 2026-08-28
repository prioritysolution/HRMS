"use client";

import { useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import {
  EmployeeProfileModal,
  type EmployeeProfile,
} from "@/components/modals/EmployeeProfileModal";
import type { HrmsRow } from "@/types/hrms";

function toEmployeeProfile(row: HrmsRow): EmployeeProfile {
  return {
    id: String(row.Employee_code ?? row.id),
    name: String(row.Display_name ?? row.First_name ?? "Employee"),
    email: String(row.Email ?? ""),
    role: String(row.Designation ?? ""),
    department: String(row.Department ?? ""),
    status: String(row.Employment_status ?? "Active"),
    type: String(row.Employment_type ?? "Full Time"),
    joinDate: String(row.Date_of_joining ?? ""),
    avatar: String(row.Photo_path ?? "/images/avatars/avatar1.jpg"),
  };
}

export default function EmployeesPage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);

  return (
    <>
      <MasterDataPage moduleId="employees" onRowEdit={(row) => setProfile(toEmployeeProfile(row))} />
      <EmployeeProfileModal
        open={!!profile}
        employee={profile}
        onClose={() => setProfile(null)}
      />
    </>
  );
}

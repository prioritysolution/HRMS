import { redirect } from "next/navigation";

/** Backend menu route `/employee/asset-allocation` maps to the employees screen. */
export default function EmployeeAssetAllocationRedirect() {
  redirect("/employees/asset-allocation");
}

import type { FormField, HrmsRow } from "@/types/hrms";

export function formatAttendanceCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export function selectOptionsFromEmployees(
  employees: HrmsRow[],
): Array<{ value: string; label: string }> {
  return employees
    .map((row) => {
      const code = String(row.Employee_code ?? "").trim();
      if (!code) return null;
      const name = String(row.Display_name ?? code).trim();
      return { value: code, label: `${name} (${code})` };
    })
    .filter((option): option is { value: string; label: string } => option !== null);
}

export function withEmployeeSelectOptions(
  fields: FormField[],
  employees: HrmsRow[],
): FormField[] {
  const employeeOptions = selectOptionsFromEmployees(employees);
  if (employeeOptions.length === 0) return fields;

  return fields.map((field) => {
    if (field.name === "Employee_code") {
      return { ...field, options: employeeOptions };
    }
    return field;
  });
}

export function enrichEmployeeAttendanceRow(
  values: HrmsRow,
  employees: HrmsRow[],
): HrmsRow {
  const employeeCode = String(values.Employee_code ?? "").trim();
  const employee = employees.find(
    (row) => String(row.Employee_code ?? "").trim() === employeeCode,
  );

  return {
    ...values,
    Employee_code: employeeCode,
    Employee_name:
      String(employee?.Display_name ?? values.Employee_name ?? employeeCode).trim(),
    Department: String(employee?.Department ?? values.Department ?? ""),
    Photo_path: String(employee?.Photo_path ?? values.Photo_path ?? ""),
  };
}

export function countByStatus(rows: HrmsRow[], status: string): number {
  return rows.filter(
    (row) => String(row.Attendance_status ?? "").toLowerCase() === status.toLowerCase(),
  ).length;
}

export function countBySource(rows: HrmsRow[], source: string): number {
  return rows.filter((row) => String(row.Source ?? "").toLowerCase() === source.toLowerCase())
    .length;
}

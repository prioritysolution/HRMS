export function getRowLabel(row: object): string {
  const record = row as Record<string, unknown>;
  const preferredKeys = [
    "Display_name",
    "Org_Name",
    "Branch_Name",
    "Dept_Name",
    "Desig_Name",
    "Grade_Name",
    "Status_name",
    "Type_name",
    "Shift_name",
    "Holiday_name",
    "Employee_name",
    "Rule_name",
    "Day_name",
    "primary",
    "name",
  ];

  for (const key of preferredKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return "this record";
}

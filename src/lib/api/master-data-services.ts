import type { HrmsRow } from "@/types/hrms";
import type {
  EmployeeCreatePayload,
  EmployeeUpdatePayload,
} from "@/lib/api/types";
import { branchService } from "@/lib/api/services/branch.service";
import { departmentService } from "@/lib/api/services/department.service";
import { assetService } from "@/lib/api/services/asset.service";
import { designationService } from "@/lib/api/services/designation.service";
import { employmentTypeService } from "@/lib/api/services/employment-type.service";
import { employmentStatusService } from "@/lib/api/services/employment-status.service";
import { holidayService } from "./services/holiday.service";
import { gradeSalaryService } from "@/lib/api/services/grade-salary.service";
import { gradeService } from "@/lib/api/services/grade.service";
import { organizationService } from "@/lib/api/services/organization.service";
import { workShiftService } from "@/lib/api/services/work-shift.service";
import { employeeService } from "@/lib/api/services/employee.service";


type MasterDataApiService = {
  list: () => Promise<HrmsRow[]>;
  create: (row: HrmsRow) => Promise<HrmsRow>;
  update: (id: string | number, row: HrmsRow) => Promise<HrmsRow>;
  remove: (id: string | number) => Promise<unknown>;
};

export const ORG_SCOPED_MODULE_IDS = new Set([
  "branches",
  "departments",
  "designations",
  "employment-types",
  "employees",
  "grades",
  "shifts",
]);

export const GRADE_SCOPED_MODULE_IDS = new Set(["salary-grades"]);

async function buildOrgNameMap(): Promise<Map<number, string>> {
  const organizations = await organizationService.list();
  return new Map(
    organizations.map((org) => [Number(org.Org_Id), String(org.Org_Name ?? org.Org_Cd ?? "")]),
  );
}

async function buildGradeNameMap(): Promise<Map<number, string>> {
  const grades = await gradeService.list(undefined, await buildOrgNameMap());
  return new Map(
    grades.map((grade) => [Number(grade.Grade_Id), String(grade.Grade_Name ?? grade.Grade_Code ?? "")]),
  );
}

async function listBranches(): Promise<HrmsRow[]> {
  return branchService.list(undefined, await buildOrgNameMap());
}

async function listDepartments(): Promise<HrmsRow[]> {
  return departmentService.list(undefined, await buildOrgNameMap());
}

async function listDesignations(): Promise<HrmsRow[]> {
  return designationService.list(undefined, await buildOrgNameMap());
}

async function listGrades(): Promise<HrmsRow[]> {
  return gradeService.list(undefined, await buildOrgNameMap());
}

async function listEmploymentTypes(): Promise<HrmsRow[]> {
  return employmentTypeService.list(undefined, await buildOrgNameMap());
}

async function listWorkShifts(): Promise<HrmsRow[]> {
  return workShiftService.list(undefined, await buildOrgNameMap());
}

async function listGradeSalaries(): Promise<HrmsRow[]> {
  return gradeSalaryService.list(undefined, await buildGradeNameMap());
}

async function listEmployees(): Promise<HrmsRow[]> {
  const employees = await employeeService.list();

  return employees.map((employee) => ({
    id: String(employee.Employee_id),

    Employee_id: employee.Employee_id,
    Employee_code: employee.Employee_code,
    First_name: employee.First_name,
    Last_name: employee.Last_name,
    Display_name: employee.Display_name,

    Dept_Id: employee.Dept_Id,
    Dept_Name: employee.Dept_Name,
    Department: employee.Dept_Name,

    Desig_Id: employee.Desig_Id,
    Desig_Name: employee.Desig_Name,
    Designation: employee.Desig_Name,

    Grade_Name: employee.Grade_Name,

    Emp_type_name: employee.Emp_type_name,
    Employment_type: employee.Emp_type_name,

    Employment_status_name: employee.Employment_status_name,
    Employment_status: employee.Employment_status_name,

    Shift_name: employee.Shift_name,

    Date_of_joining: employee.Date_of_joining,

    Status: employee.Status,

    Email: "",
    Mobile: "",
    Org_Name: "",
  }));
}



function nullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}


async function createEmployee(row: HrmsRow): Promise<HrmsRow> {
  const payload: EmployeeCreatePayload = {
    employee_code: String(row.Employee_code ?? "").trim(),

    first_name: String(row.First_name ?? "").trim(),

    middle_name: String(row.Middle_name ?? "").trim() || null,

    last_name: String(row.Last_name ?? "").trim() || null,

    display_name: String(row.Display_name ?? "").trim() || null,

    gender: nullableNumber(row.Gender),

    date_of_birth:
      String(row.Date_of_birth ?? "").trim() || null,

    blood_group: nullableNumber(row.Blood_group),

    marital_status: nullableNumber(row.Marital_status),

    mobile:
      String(row.Mobile ?? "").trim() || null,

    email:
      String(row.Email ?? "").trim() || null,

    address_line1:
      String(row.Address_line1 ?? "").trim() || null,

    city:
      String(row.City ?? "").trim() || null,

    state:
      String(row.State ?? "").trim() || null,

    country:
      String(row.Country ?? "India").trim() || null,

    pincode:
      String(row.Pincode ?? "").trim() || null,

    branch_id: nullableNumber(row.Branch),

    dept_id: nullableNumber(row.Department),

    desig_id: nullableNumber(row.Designation),

    grade_id: nullableNumber(row.Grade),

    shift_id: nullableNumber(row.Shift),

    emp_type_id: nullableNumber(row.Employment_type),

    date_of_joining:
      String(row.Date_of_joining ?? "").trim() || null,

    employment_status:
      nullableNumber(row.Employment_status),

    status: nullableNumber(row.Status) ?? 1,

    bank: {
      bank_name:
        String(row.Bank_name ?? "").trim() || null,

      branch_name:
        String(row.Bank_branch ?? "").trim() || null,

      account_holder_name:
        String(row.Account_holder_name ?? "").trim() || null,

      account_number:
        String(row.Account_number ?? "").trim() || null,

      ifsc_code:
        String(row.IFSC_code ?? "").trim() || null,

      account_type:
        String(row.Account_type ?? "").trim() || null,
    },

    statutory: {
      pf_no:
        String(row.PF_number ?? "").trim() || null,

      uan_no:
        String(row.UAN ?? "").trim() || null,

      esi_no:
        String(row.ESI_number ?? "").trim() || null,

      ptax_no:
        String(row.Professional_tax ?? "").trim() || null,

      tds_applicable:
        nullableNumber(row.TDS) ?? 0,
    },
  };

  const saved = await employeeService.create(payload);

  return {
    ...row,

    id: String(saved.Employee_id),

    Employee_id: saved.Employee_id,
    Employee_code: saved.Employee_code,
    First_name: saved.First_name,
    Last_name: saved.Last_name,
    Display_name: saved.Display_name,

    Dept_Id: saved.Dept_Id,
    Dept_Name: saved.Dept_Name,
    Department: saved.Dept_Name,

    Desig_Id: saved.Desig_Id,
    Desig_Name: saved.Desig_Name,
    Designation: saved.Desig_Name,

    Grade_Name: saved.Grade_Name,

    Emp_type_name: saved.Emp_type_name,

    Employment_status_name:
      saved.Employment_status_name,

    Employment_status:
      saved.Employment_status_name,

    Shift_name: saved.Shift_name,

    Date_of_joining:
      saved.Date_of_joining,

    Status: saved.Status,
  };
}
async function updateEmployee(
  id: string | number,
  row: HrmsRow,
): Promise<HrmsRow> {
  const payload: EmployeeUpdatePayload = {
    employee_code:
      String(row.Employee_code ?? "").trim(),

    first_name:
      String(row.First_name ?? "").trim(),

    middle_name:
      String(row.Middle_name ?? "").trim() || null,

    last_name:
      String(row.Last_name ?? "").trim() || null,

    display_name:
      String(row.Display_name ?? "").trim() || null,

    gender: nullableNumber(row.Gender),

    date_of_birth:
      String(row.Date_of_birth ?? "").trim() || null,

    blood_group:
      nullableNumber(row.Blood_group),

    marital_status:
      nullableNumber(row.Marital_status),

    mobile:
      String(row.Mobile ?? "").trim() || null,

    email:
      String(row.Email ?? "").trim() || null,

    address_line1:
      String(row.Address_line1 ?? "").trim() || null,

    city:
      String(row.City ?? "").trim() || null,

    state:
      String(row.State ?? "").trim() || null,

    country:
      String(row.Country ?? "India").trim() || null,

    pincode:
      String(row.Pincode ?? "").trim() || null,

    branch_id:
      nullableNumber(row.Branch),

    dept_id:
      nullableNumber(row.Department),

    desig_id:
      nullableNumber(row.Designation),

    grade_id:
      nullableNumber(row.Grade),

    shift_id:
      nullableNumber(row.Shift),

    emp_type_id:
      nullableNumber(row.Employment_type),

    date_of_joining:
      String(row.Date_of_joining ?? "").trim() || null,

    employment_status:
      nullableNumber(row.Employment_status),

    status:
      nullableNumber(row.Status) ?? 1,

    statutory: {
      pf_no:
        String(row.PF_number ?? "").trim() || null,

      uan_no:
        String(row.UAN ?? "").trim() || null,

      esi_no:
        String(row.ESI_number ?? "").trim() || null,

      ptax_no:
        String(row.Professional_tax ?? "").trim() || null,

      tds_applicable:
        nullableNumber(row.TDS) ?? 0,
    },
  };

  const saved = await employeeService.update(
    id,
    payload,
  );

  return {
    ...row,

    id: String(saved.Employee_id),

    Employee_id: saved.Employee_id,
    Employee_code: saved.Employee_code,
    First_name: saved.First_name,
    Last_name: saved.Last_name,
    Display_name: saved.Display_name,

    Dept_Id: saved.Dept_Id,
    Dept_Name: saved.Dept_Name,
    Department: saved.Dept_Name,

    Desig_Id: saved.Desig_Id,
    Desig_Name: saved.Desig_Name,
    Designation: saved.Desig_Name,

    Grade_Name: saved.Grade_Name,

    Emp_type_name: saved.Emp_type_name,

    Employment_status_name:
      saved.Employment_status_name,

    Employment_status:
      saved.Employment_status_name,

    Shift_name: saved.Shift_name,

    Date_of_joining:
      saved.Date_of_joining,

    Status: saved.Status,
  };
}

export const MASTER_DATA_API_SERVICES: Record<string, MasterDataApiService> = {
  organization: organizationService,
  assets: {
    list: assetService.list,
    create: assetService.create,
    update: assetService.update,
    remove: assetService.remove,
  },
  branches: {
    list: listBranches,
    create: branchService.create,
    update: branchService.update,
    remove: branchService.remove,
  },
  departments: {
    list: listDepartments,
    create: departmentService.create,
    update: departmentService.update,
    remove: departmentService.remove,
  },
  designations: {
    list: listDesignations,
    create: designationService.create,
    update: designationService.update,
    remove: designationService.remove,
  },
  grades: {
    list: listGrades,
    create: gradeService.create,
    update: gradeService.update,
    remove: gradeService.remove,
  },
  "employment-types": {
    list: listEmploymentTypes,
    create: employmentTypeService.create,
    update: employmentTypeService.update,
    remove: employmentTypeService.remove,
  },
  employees: {
    list: listEmployees,
    create: createEmployee,
    update: updateEmployee,
    remove: employeeService.remove,
  },
  "employee-status": {
    list: employmentStatusService.list,
    create: employmentStatusService.create,
    update: employmentStatusService.update,
    remove: employmentStatusService.remove,
  },

  holidays: holidayService,

  shifts: {
    list: listWorkShifts,
    create: workShiftService.create,
    update: workShiftService.update,
    remove: workShiftService.remove,
  },
  "salary-grades": {
    list: listGradeSalaries,
    create: gradeSalaryService.create,
    update: gradeSalaryService.update,
    remove: gradeSalaryService.remove,
  },
};

export function getMasterDataApiService(moduleId: string): MasterDataApiService | undefined {
  return MASTER_DATA_API_SERVICES[moduleId];
}

export function moduleUsesOrganizationSelect(moduleId: string): boolean {
  return ORG_SCOPED_MODULE_IDS.has(moduleId);
}

export function moduleUsesGradeSelect(moduleId: string): boolean {
  return GRADE_SCOPED_MODULE_IDS.has(moduleId);
}

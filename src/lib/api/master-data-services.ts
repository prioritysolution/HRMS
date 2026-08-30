import type { HrmsRow } from "@/types/hrms";
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
  update: (
    id: string | number,
    row: HrmsRow,
  ) => Promise<HrmsRow>;
  remove: (
    id: string | number,
  ) => Promise<unknown>;
  getDetails?: (
    id: string | number,
  ) => Promise<HrmsRow>;
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

const listEmployees = async (): Promise<HrmsRow[]> => {
  return employeeService.list();
};

const createEmployee = async (
  row: HrmsRow,
): Promise<HrmsRow> => {
  return employeeService.create(row);
};

const updateEmployee = async (
  id: string | number,
  row: HrmsRow,
): Promise<HrmsRow> => {
  return employeeService.update(id, row);
};

const deleteEmployee = async (
  id: string | number,
): Promise<unknown> => {
  return employeeService.remove(id);
};

export const getEmployeeDetails = async (
  id: string | number,
): Promise<HrmsRow> => {
  return employeeService.getById(id);
};

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
    remove: deleteEmployee,
    getDetails: getEmployeeDetails,
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



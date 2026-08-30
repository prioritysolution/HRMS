export type ApiMessageResponse = {
  message: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  roleId?: number;
  orgId?: number;
  userName?: string;
  isAdmin?: boolean;
};

export type AuthResponse = {
  token: string;
  tokenType?: string;
  expiresIn?: number;
  user: AuthUser;
};

export type LoginRequest = {
  user_name: string;
  password: string;
};

export type MenuStatus = 0 | 1;

export type MenuSubItem = {
  Menu_Sl: number;
  Menu_Id: number;
  SubMenu_Id: number | null;
  SubMenu_Name: string;
  Icon?: string | null;
  Route?: string | null;
  Status: MenuStatus | number | string;
};

export type MenuTreeItem = {
  Menu_Sl: number;
  Menu_Id: number;
  Menu_Name: string;
  Icon?: string | null;
  Route?: string | null;
  Status: MenuStatus | number | string;
  SubMenus?: MenuSubItem[];
};

export type MenuListItem = {
  Menu_Sl: number;
  Menu_Id: number;
  Menu_Name: string;
  SubMenu_Id?: number | null;
  SubMenu_Name?: string | null;
  Icon?: string | null;
  Route?: string | null;
  Status: MenuStatus | number | string;
};

export type MenuTreeQuery = {
  status?: MenuStatus;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
};

export type ResetPasswordRequest = {
  email: string;
  otp: string;
  password: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type OrganizationStatus = 0 | 1;

export type OrganizationRecord = {
  Org_Id: number;
  Org_Cd: string;
  Org_Name: string;
  Legal_Name?: string | null;
  Regd_No?: string | null;
  Email?: string | null;
  Contact?: string | null;
  Website?: string | null;
  Address_line1?: string | null;
  Address_line2?: string | null;
  City?: string | null;
  State?: string | null;
  Country?: string | null;
  Pincode?: string | null;
  Logo_Path?: string | null;
  Logo_Url?: string | null;
  Status: OrganizationStatus | number | string;
  Created_at?: string | null;
  Updated_at?: string | null;
};

export type OrganizationWritePayload = {
  org_cd: string;
  org_name: string;
  legal_name?: string | null;
  regd_no?: string | null;
  email?: string | null;
  contact?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  logo_path?: string | null;
  status?: OrganizationStatus;
};

export type OrganizationListQuery = {
  status?: OrganizationStatus;
};

export type BranchStatus = OrganizationStatus;

export type BranchRecord = {
  Branch_Id: number;
  Org_Id: number;
  Branch_Code: string;
  Branch_Name: string;
  Open_Date?: string | null;
  Address_line1?: string | null;
  Address_line2?: string | null;
  City?: string | null;
  State?: string | null;
  Pincode?: string | null;
  Contact?: string | null;
  Email?: string | null;
  Latitude?: string | number | null;
  Longitude?: string | number | null;
  Status: BranchStatus | number | string;
  Org_Name?: string | null;
};

export type BranchWritePayload = {
  org_id: number;
  branch_code: string;
  branch_name: string;
  open_date?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  contact?: string | null;
  email?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  status?: BranchStatus;
};

export type BranchListQuery = {
  org_id?: number;
  status?: BranchStatus;
};

export type AssetStatus = 0 | 1;

export type AssetRecord = {
  Asset_id: number;
  Asset_type: number;
  Asset_type_name?: string | null;
  Asset_code: string;
  Serial_number?: string | null;
  Purchase_date?: string | null;
  Purchase_cost?: string | number | null;
  Warranty_expiry?: string | null;
  Asset_status: AssetStatus | number | string;
  Remarks?: string | null;
};

export type AssetWritePayload = {
  asset_type: number;
  asset_code: string;
  serial_number?: string | null;
  purchase_date?: string | null;
  purchase_cost?: number | null;
  warranty_expiry?: string | null;
  asset_status?: AssetStatus;
  remarks?: string | null;
};

export type AssetListQuery = {
  asset_id?: number;
  asset_code?: string;
  asset_type?: number;
};

export type HolidayRecord = {
  Holiday_id: number;
  Month_sl: number;
  Year_Sl: number;
  Holiday_date: string;
  Holiday_name: string;
  Holiday_type: string;
};

export type HolidayWritePayload = {
  holiday_date: string;
  holiday_name: string;
  holiday_type: string;
  month_sl?: number;
  year_sl?: number;
};

export type HolidayListQuery = {
  holiday_id?: number;
  month_sl?: number;
  year_sl?: number;
  holiday_type?: string;
  holiday_date?: string;
};

export type DepartmentStatus = OrganizationStatus;

export type DepartmentRecord = {
  Dept_Id: number;
  Org_Id: number;
  Dept_Cd: string;
  Dept_Name: string;
  Status: DepartmentStatus | number | string;
  Org_Name?: string | null;
};

export type DepartmentWritePayload = {
  org_id: number;
  dept_cd: string;
  dept_name: string;
  status?: DepartmentStatus;
};

export type DepartmentListQuery = {
  org_id?: number;
  status?: DepartmentStatus;
};

export type DesignationStatus = OrganizationStatus;

export type DesignationRecord = {
  Desig_Id: number;
  Org_Id: number;
  Desig_Code: string;
  Desig_Name: string;
  Level_No?: number | null;
  Status: DesignationStatus | number | string;
  Org_Name?: string | null;
};

export type DesignationWritePayload = {
  org_id: number;
  desig_code: string;
  desig_name: string;
  level_no?: number;
  status?: DesignationStatus;
};

export type DesignationListQuery = {
  org_id?: number;
  status?: DesignationStatus;
};

export type GradeStatus = OrganizationStatus;

export type GradeRecord = {
  Grade_Id: number;
  Org_Id: number;
  Grade_Code: string;
  Grade_Name: string;
  Min_salary?: string | number | null;
  Max_salary?: string | number | null;
  Pay_Band?: string | null;
  Status: GradeStatus | number | string;
  Org_Name?: string | null;
};

export type GradeWritePayload = {
  org_id: number;
  grade_code: string;
  grade_name: string;
  min_salary?: number;
  max_salary?: number;
  pay_band?: string | null;
  status?: GradeStatus;
};

export type GradeListQuery = {
  org_id?: number;
  status?: GradeStatus;
};

export type EmploymentTypeStatus = OrganizationStatus;

export type EmploymentTypeRecord = {
  Emp_type_id: number;
  Org_Id: number;
  Type_code: string;
  Type_name: string;
  Is_payroll_applicable: number;
  Status: EmploymentTypeStatus | number | string;
  Org_Name?: string | null;
};

export type EmploymentTypeWritePayload = {
  org_id: number;
  type_code: string;
  type_name: string;
  is_payroll_applicable?: 0 | 1;
  status?: EmploymentTypeStatus;
};

export type EmploymentTypeListQuery = {
  org_id?: number;
  status?: EmploymentTypeStatus;
};

export type EmploymentStatus = 0 | 1;

export type EmploymentStatusRecord = {
  Emp_status_id: number;
  Status_code: string;
  Status_name: string;
  Status: EmploymentStatus | number | string;
};

export type EmploymentStatusWritePayload = {
  status_code: string;
  status_name: string;
  status: EmploymentStatus;
};

export type EmploymentStatusListQuery = {
  emp_status_id?: number;
  status_code?: string;
  status?: EmploymentStatus;
};

export type WorkShiftStatus = OrganizationStatus;

export type WorkShiftRecord = {
  Shift_id: number;
  Org_Id: number;
  Shift_code: string;
  Shift_name: string;
  Start_time: string;
  End_time: string;
  Overtime_hr?: string | number | null;
  Status: WorkShiftStatus | number | string;
  Org_Name?: string | null;
};

export type WorkShiftWritePayload = {
  org_id: number;
  shift_code: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  overtime_hr?: number;
  status?: WorkShiftStatus;
};

export type WorkShiftListQuery = {
  org_id?: number;
  status?: WorkShiftStatus;
};

export type GradeSalaryStatus = OrganizationStatus;

export type GradeSalaryRecord = {
  Inc_Id: number;
  Grade_Id: number;
  Scale_Frm?: string | number | null;
  Yr_Inc?: string | number | null;
  Scale_Upto?: string | number | null;
  Status: GradeSalaryStatus | number | string;
  Grade_Name?: string | null;
};

export type GradeSalaryWritePayload = {
  grade_id: number;
  scale_frm: number;
  yr_inc: number;
  scale_upto: number;
  status?: GradeSalaryStatus;
};

export type GradeSalaryListQuery = {
  grade_id?: number;
  status?: GradeSalaryStatus;
};

export type ApplOptionActiveStatus = 0 | 1;

export type ApplOptionRecord = {
  Option_Id: number;
  Opt_Grp_Id: number;
  Opt_Group: string;
  Opt_Code: number | string;
  Opt_Description: string;
  Is_Active: ApplOptionActiveStatus | number | string;
  Srl_No?: number | null;
};

export type ApplOptionListQuery = {
  opt_grp_id?: number;
  is_active?: ApplOptionActiveStatus;
};

export interface EmployeeRecord {
  Employee_id: number;
  Employee_code: string;

  First_name: string;
  Middle_name?: string | null;
  Last_name: string;
  Display_name: string;

  Dept_Id: number | null;
  Dept_Name: string | null;

  Desig_Id: number | null;
  Desig_Name: string | null;

  Grade_Name: string | null;
  Emp_type_name: string | null;
  Employment_status_name: string | null;
  Shift_name: string | null;

  Date_of_joining: string | null;
  Status: number;
}

export interface EmployeeDetailRecord {
  Employee_id: number;
  Employee_code: string;

  Title?: string | null;
  First_name?: string | null;
  Middle_name?: string | null;
  Last_name?: string | null;
  Display_name?: string | null;

  Gender?: number | null;
  Date_of_birth?: string | null;
  Blood_group?: number | null;
  Marital_status?: number | null;

  Father_name?: string | null;
  Mother_name?: string | null;
  Spouse_name?: string | null;

  Mobile?: string | null;
  Alternate_mobile?: string | null;
  Email?: string | null;

  Address_line1?: string | null;
  Address_line2?: string | null;
  City?: string | null;
  State?: string | null;
  Country?: string | null;
  Pincode?: string | null;

  Emergency_contact?: string | null;

  Branch_Id?: number | null;
  Dept_Id?: number | null;
  Desig_Id?: number | null;
  Grade_Id?: number | null;
  Shift_id?: number | null;
  Emp_type_id?: number | null;

  Reporting_manager_id?: number | null;

  Date_of_joining?: string | null;
  Confirmation_date?: string | null;
  Probation_end_date?: string | null;

  Employment_status?: number | null;

  Work_location?: string | null;
  Photo_path?: string | null;

  Status?: number | null;

  Created_by?: number | null;
  Created_at?: string | null;
  Updated_at?: string | null;

  Dept_Name?: string | null;
  Desig_Name?: string | null;
  Grade_Name?: string | null;
  Emp_type_name?: string | null;
  Employment_status_name?: string | null;
  Shift_name?: string | null;
}

export interface EmployeeBank {
  Employee_bank_id?: number;
  Employee_id?: number;

  Bank_name: string | null;
  Branch_name?: string | null;
  Account_holder_name?: string | null;
  Account_number: string | null;
  Ifsc_code: string | null;
  Account_type?: string | null;

  Status?: number;
}

export interface EmployeeIdentification {
  Identification_id?: number;
  Employee_id?: number;

  Id_type: number;
  Id_number: string;

  Issue_date?: string | null;
  Expiry_date?: string | null;

  Status?: number;
  Verified?: number;
}

export interface EmployeeStatutory {
  Statutory_id?: number;
  Employee_id?: number;

  Pf_no: string | null;
  Uan_no: string | null;
  Esi_no: string | null;
  Ptax_no: string | null;
  Tds_applicable: number;

  Status?: number;
}

export interface EmployeeDetail {
  employee: EmployeeDetailRecord;
  banks: EmployeeBank[];
  identifications: EmployeeIdentification[];
  statutory: EmployeeStatutory | null;
}

export interface EmployeeBankPayload {
  bank_name: string;
  branch_name?: string | null;
  account_holder_name?: string | null;
  account_number: string;
  ifsc_code: string;
  account_type?: string | null;
}

export interface EmployeeIdentificationPayload {
  id_type: number;
  id_number: string;
  issue_date?: string | null;
  expiry_date?: string | null;
}

export interface EmployeeStatutoryPayload {
  pf_no?: string | null;
  uan_no?: string | null;
  esi_no?: string | null;
  ptax_no?: string | null;
  tds_applicable: number;
}

export interface EmployeeCreatePayload {
  employee_code: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  display_name?: string | null;

  gender?: number | null;
  date_of_birth?: string | null;
  blood_group?: number | null;
  marital_status?: number | null;

  mobile?: string | null;
  email?: string | null;

  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  branch_id: number;
  dept_id: number;
  desig_id: number;
  grade_id: number;
  shift_id: number;
  emp_type_id: number;

  date_of_joining: string;
  employment_status: number;
  status: number;

  bank?: EmployeeBankPayload;
  identifications?: EmployeeIdentificationPayload[];
  statutory?: EmployeeStatutoryPayload;
  photo?: File | string | null;
}

// export interface EmployeeUpdatePayload {
//   employee_code?: string;
//   first_name?: string;
//   middle_name?: string | null;
//   last_name?: string;
//   display_name?: string | null;

//   gender?: number | null;
//   date_of_birth?: string | null;
//   blood_group?: number | null;
//   marital_status?: number | null;

//   mobile?: string | null;
//   email?: string | null;

//   father_name?: string | null;
//   mother_name?: string | null;
//   spouse_name?: string | null;

//   address_line1?: string | null;
//   city?: string | null;
//   state?: string | null;
//   country?: string | null;
//   pincode?: string | null;

//   branch_id?: number | null;
//   dept_id?: number | null;
//   desig_id?: number | null;
//   grade_id?: number | null;
//   shift_id?: number | null;
//   emp_type_id?: number | null;

//   date_of_joining?: string | null;
//   employment_status?: number | null;
//   status?: number;

//   bank?: Partial<EmployeeBankPayload>;
//   identifications?: EmployeeIdentificationPayload[];
//   statutory?: Partial<EmployeeStatutoryPayload>;
// }


export interface EmployeeUpdatePayload {
  // Employee identity
  employee_code?: string;
  title?: string | null;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  display_name?: string | null;

  // Personal information
  gender?: number | null;
  date_of_birth?: string | null;
  blood_group?: number | null;
  marital_status?: number | null;

  father_name?: string | null;
  mother_name?: string | null;
  spouse_name?: string | null;

  mobile?: string | null;
  alternate_mobile?: string | null;
  email?: string | null;

  // Address
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  emergency_contact?: string | null;

  // Employment
  branch_id?: number | null;
  dept_id?: number | null;
  desig_id?: number | null;
  grade_id?: number | null;
  shift_id?: number | null;
  emp_type_id?: number | null;

  reporting_manager_id?: number | null;
  reporting_manager?: string | null;

  date_of_joining?: string | null;
  confirmation_date?: string | null;
  probation_end_date?: string | null;
  probation_period?: number | null;

  employment_status?: number | null;
  work_location?: string | null;

  // Photo
  photo?: File | string | null;
  photo_path?: string | null;

  // Record status
  status?: number;

  // Related employee data
  bank?: Partial<EmployeeBankPayload>;

  identifications?: EmployeeIdentificationPayload[];

  statutory?: Partial<
    EmployeeStatutoryPayload & {
      other_statutory?: string | null;
    }
  >;
}
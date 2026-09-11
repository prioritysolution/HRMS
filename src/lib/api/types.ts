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

export type AuthMeRole = {
  roleId: number;
  roleName: string;
  isAdmin: boolean;
};

export type AuthMeProfile = {
  userId: number;
  userName: string;
  roleId: number;
  roleName: string;
  isAdmin: boolean;
  roles: AuthMeRole[];
  orgId: number;
  orgCode: string;
  orgName: string;
  orgLogo: string | null;
  orgSchema: string;
  branchId: number;
  branchCode: string;
  branchName: string;
  employeeId: number | null;
  employeeCode: string | null;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  photoPath: string | null;
  loginStatus: string;
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
  org_id?: number;
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
  org_id?: number;
  asset_id?: number;
  asset_code?: string;
  asset_type?: number;
  asset_status?: AssetStatus;
};

export type EmployeeAssetStatus = 0 | 1;

export type EmployeeAssetRecord = {
  Assignment_id: number;
  Employee_id: number;
  Employee_code?: string | null;
  Employee_name?: string | null;
  Asset_id: number;
  Asset_code?: string | null;
  Asset_type?: number | null;
  Asset_type_name?: string | null;
  Asset_status?: number | null;
  Serial_number?: string | null;
  Issue_date?: string | null;
  Return_date?: string | null;
  Issue_condition?: string | null;
  Return_condition?: string | null;
  Status?: EmployeeAssetStatus | number | string;
  Remarks?: string | null;
};

export type EmployeeAssetWritePayload = {
  employee_id: number;
  asset_id: number;
  issue_date: string;
  return_date?: string | null;
  issue_condition?: string | null;
  return_condition?: string | null;
  status?: EmployeeAssetStatus;
  remarks?: string | null;
};

export type EmployeeAssetListQuery = {
  assignment_id?: number;
  employee_id?: number;
  asset_id?: number;
  status?: EmployeeAssetStatus;
};

export type EmployeeServiceHistoryRecord = {
  History_id: number;
  Employee_id: number;
  Employee_code?: string | null;
  Employee_name?: string | null;
  Event_type: number;
  Event_type_code?: number | null;
  Event_type_name?: string | null;
  Effective_date?: string | null;
  Old_Id?: number | null;
  Old_Opt_Code?: number | null;
  Old_Opt_Description?: string | null;
  New_Id?: number | null;
  New_Opt_Code?: number | null;
  New_Opt_Description?: string | null;
  Old_Amount?: number | string | null;
  New_Amount?: number | string | null;
  Remarks?: string | null;
  Created_by?: number | null;
  Created_at?: string | null;
};

export type EmployeeServiceHistoryWritePayload = {
  employee_id: number;
  event_type: number;
  effective_date: string;
  old_id?: number | null;
  new_id?: number | null;
  old_opt_code?: number | null;
  new_opt_code?: number | null;
  old_amount?: number | string | null;
  new_amount?: number | string | null;
  remarks?: string | null;
};

export type EmployeeServiceHistoryListQuery = {
  history_id?: number;
  employee_id?: number;
  event_type?: number;
  effective_date?: string;
};

export type DeviceStatus = OrganizationStatus;

export type DeviceRecord = {
  Device_id: number;
  Device_name: string;
  Ip_address: string;
  Port?: number | null;
  Location?: string | null;
  Device_model?: string | null;
  Serial_no?: string | null;
  Status: DeviceStatus | number | string;
  Last_sync_time?: string | null;
  Created_at?: string | null;
};

export type DeviceWritePayload = {
  device_name: string;
  ip_address: string;
  port?: number;
  location?: string | null;
  device_model?: string | null;
  serial_no?: string | null;
  status?: DeviceStatus;
};

export type DeviceListQuery = {
  device_id?: number;
  device_name?: string;
  ip_address?: string;
  serial_no?: string;
  status?: DeviceStatus;
};

export type HolidayRecord = {
  Holiday_id: number;
  Month_sl: number;
  Year_Sl: number;
  Holiday_date: string;
  Holiday_name: string;
  Holiday_type: string;
  Remarks?: string | null;
  remarks?: string | null;
};

export type HolidayWritePayload = {
  org_id?: number;
  holiday_date: string;
  holiday_name: string;
  holiday_type: string;
  remarks?: string;
  month_sl?: number;
  year_sl?: number;
};

export type HolidayListQuery = {
  org_id?: number;
  holiday_id?: number;
  month_sl?: number;
  year_sl?: number;
  holiday_type?: string;
  holiday_date?: string;
};

export type AttendanceRecord = {
  Attendance_id: number;
  Employee_id: number;
  Employee_code?: string | null;
  Employee_name?: string | null;
  Branch_Id?: number | null;
  Branch_Name?: string | null;
  Dept_Id?: number | null;
  Dept_Name?: string | null;
  Attendance_date?: string | null;
  Shift_id?: number | null;
  Shift_code?: string | null;
  Shift_name?: string | null;
  Shift_start?: string | null;
  Shift_late_after?: string | null;
  Shift_end?: string | null;
  Check_in?: string | null;
  Check_out?: string | null;
  Working_minutes?: number | null;
  Overtime_minutes?: number | null;
  Attendance_status?: number | null;
  Attendance_status_code?: number | null;
  Attendance_status_name?: string | null;
  Source?: number | null;
  Source_code?: number | null;
  Source_name?: string | null;
  Late_minutes?: number | null;
  Early_leave_minutes?: number | null;
  Remarks?: string | null;
  Created_by?: number | null;
  Created_at?: string | null;
  Updated_at?: string | null;
};

export type AttendanceWritePayload = {
  employee_id: number;
  attendance_date: string;
  shift_id?: number;
  check_in?: string | null;
  check_out?: string | null;
  attendance_status?: number;
  source?: number;
  remarks?: string | null;
};

export type AttendanceListQuery = {
  attendance_id?: number;
  employee_id?: number;
  attendance_date?: string;
  from_date?: string;
  to_date?: string;
  branch_id?: number;
  dept_id?: number;
  shift_id?: number;
  attendance_status?: number;
  source?: number;
  with_punches?: boolean | number;
};

export type AttendancePunchRecord = {
  Punch_id: number;
  Employee_id: number;
  Employee_code?: string | null;
  Employee_name?: string | null;
  Device_id?: number | null;
  Device_name?: string | null;
  Punch_time?: string | null;
  Punch_type?: number | null;
  Punch_type_code?: number | null;
  Punch_type_name?: string | null;
  Source?: number | null;
  Source_code?: number | null;
  Source_name?: string | null;
  Latitude?: number | null;
  Longitude?: number | null;
  Raw_data?: unknown;
  Created_at?: string | null;
};

export type AttendancePunchWritePayload = {
  employee_id: number;
  punch_time?: string;
  punch_type?: number;
  source?: number;
  device_id?: number;
  latitude?: number;
  longitude?: number;
  raw_data?: unknown;
};

export type AttendancePunchListQuery = {
  punch_id?: number;
  employee_id?: number;
  device_id?: number;
  punch_date?: string;
  from_date?: string;
  to_date?: string;
  punch_type?: number;
  source?: number;
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

/** Leave Master — `mst_leave_master` / USP_LEAVE_* */
export type LeaveMasterStatus = 0 | 1;
export type LeaveMasterGender = "A" | "M" | "F";
/** Appl-options Opt_Grp_Id = 18 (Validity) */
export type LeaveMasterValidityCode = 1 | 2 | 3;

export type LeaveMasterRecord = {
  Leave_Id?: number;
  leave_id?: number;
  Leave_Code?: string | null;
  leave_code?: string | null;
  Leave_Name?: string | null;
  leave_name?: string | null;
  Leave_Days?: number | string | null;
  leave_days?: number | string | null;
  Is_Paid?: number | string | null;
  is_paid?: number | string | null;
  Is_Half_Day_Allowed?: number | string | null;
  is_half_day_allowed?: number | string | null;
  Is_Carry_Forward?: number | string | null;
  is_carry_forward?: number | string | null;
  Max_Carry_Forward_Days?: number | string | null;
  max_carry_forward_days?: number | string | null;
  Is_Encashable?: number | string | null;
  is_encashable?: number | string | null;
  Max_Encash_Days?: number | string | null;
  max_encash_days?: number | string | null;
  Requires_Approval?: number | string | null;
  requires_approval?: number | string | null;
  Requires_Document?: number | string | null;
  requires_document?: number | string | null;
  Minimum_Days?: number | string | null;
  minimum_days?: number | string | null;
  Maximum_Days?: number | string | null;
  maximum_days?: number | string | null;
  Applicable_Gender?: string | null;
  applicable_gender?: string | null;
  Applicable_Employee_Type?: number | string | null;
  applicable_employee_type?: number | string | null;
  Validity?: number | string | null;
  validity?: number | string | null;
  Days_Number?: number | string | null;
  days_number?: number | string | null;
  Status?: LeaveMasterStatus | number | string;
  status?: LeaveMasterStatus | number | string;
};

export type LeaveMasterWritePayload = {
  leave_code?: string;
  leave_name: string;
  leave_days?: number;
  is_paid?: 0 | 1;
  is_half_day_allowed?: 0 | 1;
  is_carry_forward?: 0 | 1;
  max_carry_forward_days?: number;
  is_encashable?: 0 | 1;
  max_encash_days?: number;
  requires_approval?: 0 | 1;
  requires_document?: 0 | 1;
  minimum_days?: number;
  maximum_days?: number | null;
  applicable_gender?: LeaveMasterGender;
  applicable_employee_type?: number | null;
  validity?: number;
  days_number?: number;
  status?: LeaveMasterStatus;
  created_by?: number;
};

export type LeaveMasterStatusPayload = {
  status: LeaveMasterStatus;
};

export type LeaveMasterListQuery = {
  leave_id?: number;
  leave_code?: string;
  status?: LeaveMasterStatus;
  applicable_gender?: LeaveMasterGender;
  applicable_employee_type?: number;
};

/** Leave Application / Requisition — `trans_employee_leave_application` */
export type LeaveApplicationStatusCode = 1 | 2 | 3 | 4;
/** Appl-options Opt_Grp_Id = 19 */
export type LeaveHalfDayCode = 1 | 2;

export type LeaveApplicationRecord = {
  Leave_Application_Id?: number;
  leave_application_id?: number;
  Application_No?: string | null;
  application_no?: string | null;
  Employee_Id?: number | string | null;
  employee_id?: number | string | null;
  Employee_Code?: string | null;
  employee_code?: string | null;
  Employee_Name?: string | null;
  employee_name?: string | null;
  Branch_Id?: number | string | null;
  branch_id?: number | string | null;
  Branch_Name?: string | null;
  branch_name?: string | null;
  Designation?: string | null;
  designation?: string | null;
  Desig_Name?: string | null;
  desig_name?: string | null;
  Post?: string | null;
  post?: string | null;
  Photo_path?: string | null;
  photo_path?: string | null;
  Leave_Id?: number | string | null;
  leave_id?: number | string | null;
  Leave_Name?: string | null;
  leave_name?: string | null;
  Leave_Code?: string | null;
  leave_code?: string | null;
  From_Date?: string | null;
  from_date?: string | null;
  To_Date?: string | null;
  to_date?: string | null;
  Total_Days?: number | string | null;
  total_days?: number | string | null;
  No_Of_Days?: number | string | null;
  no_of_days?: number | string | null;
  Half_Day?: number | string | null;
  half_day?: number | string | null;
  Reason?: string | null;
  reason?: string | null;
  Leave_Reason?: string | null;
  leave_reason?: string | null;
  Document_File?: string | null;
  document_file?: string | null;
  Document_Url?: string | null;
  document_url?: string | null;
  Status?: LeaveApplicationStatusCode | number | string | null;
  status?: LeaveApplicationStatusCode | number | string | null;
  Remarks?: string | null;
  remarks?: string | null;
};

export type LeaveBalanceRecord = {
  Leave_Id?: number;
  leave_id?: number;
  Leave_Code?: string | null;
  leave_code?: string | null;
  Leave_Name?: string | null;
  leave_name?: string | null;
  Balance_Days?: number | string | null;
  balance_days?: number | string | null;
  Is_Half_Day_Allowed?: number | string | null;
  is_half_day_allowed?: number | string | null;
  Requires_Document?: number | string | null;
  requires_document?: number | string | null;
  Leave_Days?: number | string | null;
  leave_days?: number | string | null;
};

export type LeaveApplicationWritePayload = {
  employee_id: number;
  leave_id: number;
  from_date: string;
  to_date: string;
  total_days?: number;
  half_day?: LeaveHalfDayCode;
  reason?: string;
  application_no?: string;
};

export type LeaveApplicationStatusPayload = {
  status: LeaveApplicationStatusCode;
  remarks?: string;
};

export type LeaveApplicationListQuery = {
  leave_application_id?: number;
  employee_id?: number;
  leave_id?: number;
  branch_id?: number;
  status?: LeaveApplicationStatusCode;
  from_date?: string;
  to_date?: string;
};

export type LeaveBalanceQuery = {
  employee_id: number;
  fin_year?: number;
  leave_id?: number;
};

/** Financial Year — `USP_FIN_YEAR_LIST` / FinYearController@list */
export type FinYearStatus = 0 | 1;

export type FinYearRecord = {
  Year_Id?: number;
  year_id?: number;
  Year_Name?: string | null;
  year_name?: string | null;
  Start_Date?: string | null;
  start_date?: string | null;
  End_Date?: string | null;
  end_date?: string | null;
  Status?: FinYearStatus | number | string | null;
  status?: FinYearStatus | number | string | null;
};

export type FinYearListQuery = {
  year_id?: number;
  year_name?: string;
  status?: FinYearStatus;
};

/** Leave Allocation — `trans` employee leave / LeaveAllocationController */
export type LeaveAllocationStatus = 0 | 1;

export type LeaveAllocationRecord = {
  Employee_Leave_Id?: number;
  employee_leave_id?: number;
  Employee_Id?: number | string | null;
  employee_id?: number | string | null;
  Employee_Code?: string | null;
  Employee_code?: string | null;
  employee_code?: string | null;
  Employee_Name?: string | null;
  Employee_name?: string | null;
  employee_name?: string | null;
  Leave_Id?: number | string | null;
  leave_id?: number | string | null;
  Leave_Code?: string | null;
  leave_code?: string | null;
  Leave_Name?: string | null;
  leave_name?: string | null;
  Year_Id?: number | string | null;
  year_id?: number | string | null;
  Fin_Year?: number | string | null;
  fin_year?: number | string | null;
  Year_Name?: string | null;
  year_name?: string | null;
  Opening_Balance?: number | string | null;
  opening_balance?: number | string | null;
  Allocated_Days?: number | string | null;
  allocated_days?: number | string | null;
  Earned_Days?: number | string | null;
  earned_days?: number | string | null;
  Carry_Forward_Days?: number | string | null;
  carry_forward_days?: number | string | null;
  Used_Days?: number | string | null;
  used_days?: number | string | null;
  Status?: LeaveAllocationStatus | number | string | null;
  status?: LeaveAllocationStatus | number | string | null;
};

export type LeaveAllocationLeavePayload = {
  leave_id: number;
  opening_balance?: number;
  allocated_days?: number;
  earned_days?: number;
  carry_forward_days?: number;
  status?: LeaveAllocationStatus;
};

export type LeaveAllocationCreatePayload = {
  employee_id?: number;
  fin_year: number;
  leaves?: LeaveAllocationLeavePayload[];
  leave_id?: number;
  opening_balance?: number;
  allocated_days?: number;
  earned_days?: number;
  carry_forward_days?: number;
  status?: LeaveAllocationStatus;
};

export type LeaveAllocationUpdatePayload = {
  leave_id?: number;
  opening_balance?: number;
  allocated_days?: number;
  earned_days?: number;
  carry_forward_days?: number;
  status?: LeaveAllocationStatus;
  fin_year?: number;
  employee_id?: number;
};

export type LeaveAllocationListQuery = {
  employee_leave_id?: number;
  employee_id?: number;
  leave_id?: number;
  fin_year?: number;
  year_id?: number;
  status?: LeaveAllocationStatus;
};

export type EmploymentStatus = 0 | 1;

export type EmploymentStatusRecord = {
  Emp_status_id: number;
  Status_code: string;
  Status_name: string;
  Status: EmploymentStatus | number | string;
};

export type EmploymentStatusWritePayload = {
  org_id?: number;
  status_code: string;
  status_name: string;
  status: EmploymentStatus;
};

export type EmploymentStatusListQuery = {
  org_id?: number;
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

/** Opt_Code from appl-options/list?opt_grp_id=15 */
export type AuditLogActionCode = number;

export type AuditLogJsonValue =
  | string
  | number
  | boolean
  | null
  | AuditLogJsonValue[]
  | { [key: string]: AuditLogJsonValue };

export type AuditLogCreatePayload = {
  action: AuditLogActionCode;
  user_id?: number;
  menu_name?: string;
  table_name?: string;
  record_id?: number;
  old_values?: AuditLogJsonValue | string | null;
  new_values?: AuditLogJsonValue | string | null;
  ip_address?: string;
  user_agent?: string;
};

export type AuditLogRecord = {
  Audit_Id?: number;
  audit_id?: number;
  User_Id?: number;
  user_id?: number;
  Menu_Name?: string | null;
  menu_name?: string | null;
  Table_Name?: string | null;
  table_name?: string | null;
  Record_Id?: number | null;
  record_id?: number | null;
  Action?: number;
  action?: number;
  Old_Values?: AuditLogJsonValue | string | null;
  old_values?: AuditLogJsonValue | string | null;
  New_Values?: AuditLogJsonValue | string | null;
  new_values?: AuditLogJsonValue | string | null;
  Ip_Address?: string | null;
  ip_address?: string | null;
  User_Agent?: string | null;
  user_agent?: string | null;
  Created_At?: string | null;
  created_at?: string | null;
};

export interface EmployeeRecord {
  Employee_id: number;
  Employee_code: string;

  First_name: string;
  Middle_name?: string | null;
  Last_name: string;
  Display_name: string;

  Branch_Id?: number | null;
  Branch_Name?: string | null;

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
  Branch_Name?: string | null;
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

  father_name?: string | null;
  mother_name?: string | null;
  spouse_name?: string | null;

  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  emergency_contact?: string | null;

  branch_id: number;
  dept_id: number;
  desig_id: number;
  grade_id: number;
  shift_id?: number[];
  emp_type_id: number;

  date_of_joining: string;
  employment_status: number;
  status: number;

  bank?: EmployeeBankPayload;
  identifications?: EmployeeIdentificationPayload[];
  statutory?: EmployeeStatutoryPayload;
  photo?: File | string | null;
  photo_path?: string | null;
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
  shift_id?: number[] | null;
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

export type DashboardTrend = "up" | "down" | "flat";

export type DashboardSummaryMetric = {
  value: number;
  change_percent: number;
  trend: DashboardTrend;
  compare_label: string;
  active?: number;
  new?: number;
};

export type DashboardSummary = {
  total_employees: DashboardSummaryMetric;
  on_leave: DashboardSummaryMetric;
  absent_today: DashboardSummaryMetric;
  present_today: DashboardSummaryMetric;
  late_today: DashboardSummaryMetric;
  on_probation: DashboardSummaryMetric;
};

export type DashboardTodayAttendance = {
  Employee_id: number;
  Employee_code: string;
  Employee_name: string;
  In_time: string | null;
  Out_time: string | null;
  Attendance_status: number;
  Attendance_status_name: string;
};

export type DashboardAttendanceTrend = {
  Attendance_date: string;
  Day_label: string;
  Present_count: number;
  Absent_count: number;
  Late_count: number;
};

export type DashboardDepartmentDistribution = {
  Dept_Id: number;
  Dept_Name: string;
  Employee_count: number;
};

export type DashboardOverview = {
  as_of_date: string;
  summary: DashboardSummary;
  today_attendance: DashboardTodayAttendance[];
  attendance_trend: DashboardAttendanceTrend[];
  department_distribution: DashboardDepartmentDistribution[];
};

export type DashboardOverviewQuery = {
  as_of_date?: string;
  branch_id?: number;
  dept_id?: number;
  limit?: number;
};

export type EmpDashboardQuery = {
  employee_id: number;
  as_of_date?: string;
};

export type EmpDashboardHeader = {
  greeting: string;
  employee_id: number;
  employee_code: string;
  employee_name: string;
  display_name: string;
  as_of_date: string;
  display_date: string;
  subtitle: string;
};

export type EmpDashboardSummary = {
  attendance_status: number;
  attendance_status_name: string;
  attendance_status_label: string;
  scheduled_check_out: string;
  working_minutes: number;
  working_hours: string;
  working_hours_label: string;
  total_leaves_left: number;
  total_leaves_left_label: string;
};

export type EmpDashboardTimelineItem = {
  Punch_id: number;
  Event_time_display: string;
  Event_label: string;
  Punch_type: number;
};

export type EmpDashboardLeaveBalance = {
  Leave_Id: number;
  Leave_Name: string;
  Used_Days: number;
  Total_Days: number;
  Balance_Days: number;
  Used_Percent: number;
};

export type EmpDashboardLastPayslip = {
  period: string;
  net_salary: number;
  paid_on: string;
  status: string;
};

export type EmpDashboardSalaryHistoryItem = {
  month: string;
  net_pay: number;
};

export type EmpDashboardMonthlyAttendance = {
  Year_no: number;
  Month_no: number;
  Month_name: string;
  Present_count: number;
  Absent_count: number;
  Leave_count: number;
  Holiday_count: number;
};

export type EmpDashboard = {
  header: EmpDashboardHeader;
  summary: EmpDashboardSummary;
  timeline: EmpDashboardTimelineItem[];
  leave_balances: EmpDashboardLeaveBalance[];
  last_payslip: EmpDashboardLastPayslip | null;
  salary_history: EmpDashboardSalaryHistoryItem[];
  monthly_attendance: EmpDashboardMonthlyAttendance | null;
};

export type EmailConfigRecord = {
  config_id?: number | null;
  mailer: string;
  host: string;
  port: number | string;
  username: string;
  password?: string;
  encryption: string;
  from_address: string;
  from_name: string;
};

/** PUT /api/v1/email-config/update body */
export type EmailConfigWritePayload = {
  config_host: string;
  config_port: string;
  config_username: string;
  config_password: string;
  config_encryption: string;
  config_from_email: string;
  config_from_name: string;
};

export type EmailConfigTestPayload = EmailConfigWritePayload & {
  to_email: string;
  subject: string;
  message: string;
};

export type NotificationChannelStatus = 0 | 1;

export type NotificationSettingsRecord = {
  email_notification: NotificationChannelStatus;
  inapp_notification: NotificationChannelStatus;
};

export type NotificationSettingsWritePayload = NotificationSettingsRecord;
export type MyAttendanceCalendarQuery = {
  year: number;
  month: number;
  employee_id?: number;
};

export type MyAttendanceCalendarSummary = {
  Present_count: number;
  Absent_count: number;
  Leave_count: number;
  Holiday_count: number;
  Late_count: number;
  Half_day_count: number;
  Weekly_off_count: number;
};

export type MyAttendanceCalendarDay = {
  Day_no: number;
  Attendance_date: string;
  Weekday: number;
  Day_name: string;
  Is_weekend: number;
  Is_holiday: number;
  Holiday_id: number | null;
  Holiday_name: string | null;
  Holiday_type: number | null;
  Holiday_type_name: string | null;
  Is_leave: number;
  Leave_Application_Id: number | null;
  Leave_Id: number | null;
  Leave_Name: string | null;
  Half_Day: number | null;
  Attendance_id: number | null;
  Shift_id: number | null;
  Check_in: string | null;
  Check_out: string | null;
  Working_minutes: number | null;
  Overtime_minutes: number | null;
  Late_minutes: number | null;
  Early_leave_minutes: number | null;
  Attendance_status: number | null;
  Attendance_status_name: string | null;
  Source: string | null;
  Remarks: string | null;
  Day_status: number | null;
  Day_status_name: string | null;
  Day_label: string | null;
};

export type MyAttendanceCalendar = {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  display_name: string;
  year: number;
  month: number;
  month_name: string;
  month_start: string;
  month_end: string;
  summary: MyAttendanceCalendarSummary;
  days: MyAttendanceCalendarDay[];
};

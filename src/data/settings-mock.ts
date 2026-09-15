export type NumberingSequenceType = {
  id: number;
  entityModule: string;
  customPrefix?: string;
  nextCounter?: number;
  paddingDigits?: number;
  suffix?: string;
  liveFormattedSample?: string;
  status: number;
};

export type SmsGatewayConfig = {
  api_url: string;
  api_key: string;
  sender_id: string;
  message_type: "transactional" | "promotional";
  status: 0 | 1;
};

export type SmsEventKey =
  | "employee_joining"
  | "salary_generated"
  | "leave_approved"
  | "attendance_alert";

export type SmsEventSetting = {
  key: SmsEventKey;
  label: string;
  description: string;
  enabled: 0 | 1;
};

export type SmsTemplate = {
  id: string;
  template_name: string;
  event: string;
  message_template: string;
  status: 0 | 1;
};

export type DocumentSettings = {
  approval_required: 0 | 1;
  allow_edit_after_approval: 0 | 1;
  allow_cancel_after_approval: 0 | 1;
  allow_reprint: 0 | 1;
  show_duplicate_on_reprint: 0 | 1;
};

export type AttendanceLateEarlySettings = {
  late_grace_period_minutes: number;
  early_leaving_grace_minutes: number;
  late_mark_after_minutes: number;
  half_day_after_minutes: number;
  absent_after_minutes: number;
};

export type AttendanceOvertimeSettings = {
  overtime_applicable: 0 | 1;
  ot_calculation: "daily" | "monthly";
  minimum_ot_minutes: number;
  ot_round_off_minutes: number;
  ot_requires_approval: 0 | 1;
  maximum_ot_per_day_hours: number;
  holiday_ot: 0 | 1;
  weekly_off_ot: 0 | 1;
};

export type AttendanceSettings = AttendanceLateEarlySettings & AttendanceOvertimeSettings;

export const MOCK_DOCUMENT_SETTINGS: DocumentSettings = {
  approval_required: 1,
  allow_edit_after_approval: 0,
  allow_cancel_after_approval: 0,
  allow_reprint: 1,
  show_duplicate_on_reprint: 1,
};

export const MOCK_ATTENDANCE_SETTINGS: AttendanceSettings = {
  late_grace_period_minutes: 15,
  early_leaving_grace_minutes: 15,
  late_mark_after_minutes: 15,
  half_day_after_minutes: 120,
  absent_after_minutes: 240,
  overtime_applicable: 1,
  ot_calculation: "daily",
  minimum_ot_minutes: 30,
  ot_round_off_minutes: 30,
  ot_requires_approval: 1,
  maximum_ot_per_day_hours: 4,
  holiday_ot: 1,
  weekly_off_ot: 1,
};

export type LeaveSettings = {
  apply_for_future_leave: 0 | 1;
  apply_for_previous_date_leave: 0 | 1;
  half_day_leave_allowed: 0 | 1;
  apply_during_probation: 0 | 1;
  reason_mandatory: 0 | 1;
  prevent_overlapping_leave: 0 | 1;
};

export const MOCK_LEAVE_SETTINGS: LeaveSettings = {
  apply_for_future_leave: 1,
  apply_for_previous_date_leave: 1,
  half_day_leave_allowed: 1,
  apply_during_probation: 1,
  reason_mandatory: 1,
  prevent_overlapping_leave: 1,
};

export type PayrollSettings = {
  salary_basis: "monthly" | "daily" | "hourly";
  working_days_basis: "calendar_days" | "actual_working_days" | "fixed_26" | "fixed_30";
  salary_calculation_based_on: "attendance" | "paid_days" | "working_days";
  ot_applicable: 0 | 1;
  ot_calculation_based_on: "basic" | "hourly_rate";
  normal_day_ot_rate: number;
  weekly_off_ot_rate: number;
  holiday_ot_rate: number;
  minimum_ot_minutes: number;
  generate_salary_slip_automatically: 0 | 1;
  salary_slip_format: "a4" | "a5" | "letter";
  show_attendance_details: 0 | 1;
  show_leave_details: 0 | 1;
  show_earnings: 0 | 1;
  show_deductions: 0 | 1;
  show_employer_contributions: 0 | 1;
  show_bank_details: 0 | 1;
  digital_signature: 0 | 1;
};

export const MOCK_PAYROLL_SETTINGS: PayrollSettings = {
  salary_basis: "monthly",
  working_days_basis: "calendar_days",
  salary_calculation_based_on: "attendance",
  ot_applicable: 1,
  ot_calculation_based_on: "basic",
  normal_day_ot_rate: 1.5,
  weekly_off_ot_rate: 2.0,
  holiday_ot_rate: 2.0,
  minimum_ot_minutes: 30,
  generate_salary_slip_automatically: 1,
  salary_slip_format: "a4",
  show_attendance_details: 1,
  show_leave_details: 1,
  show_earnings: 1,
  show_deductions: 1,
  show_employer_contributions: 1,
  show_bank_details: 1,
  digital_signature: 1,
};

export type ProfessionalTaxSlab = {
  id: string;
  from_amount: number;
  to_amount: number | null;
  tax_amount: number;
};

export type TaxSettings = {
  pt_applicable: 0 | 1;
  pt_state: string;
  pt_deduction_frequency: "monthly" | "half_yearly" | "yearly";
  pt_based_on: "gross" | "basic";
  pt_slabs: ProfessionalTaxSlab[];
  tds_applicable: 0 | 1;
  tax_regime: "old" | "new";
  financial_year: string;
  tds_calculation_method: "monthly_projection" | "actual";
  standard_deduction: number;
  round_off_tds: 0 | 1;
  consider_previous_employment: 0 | 1;
  auto_generate_form16: 0 | 1;
  show_tds_on_payslip: 0 | 1;
};

export const MOCK_TAX_SETTINGS: TaxSettings = {
  pt_applicable: 1,
  pt_state: "gujarat",
  pt_deduction_frequency: "monthly",
  pt_based_on: "gross",
  pt_slabs: [
    { id: "1", from_amount: 0, to_amount: 5999, tax_amount: 0 },
    { id: "2", from_amount: 6000, to_amount: 8999, tax_amount: 80 },
    { id: "3", from_amount: 9000, to_amount: 11999, tax_amount: 150 },
    { id: "4", from_amount: 12000, to_amount: null, tax_amount: 200 },
  ],
  tds_applicable: 1,
  tax_regime: "new",
  financial_year: "2026-2027",
  tds_calculation_method: "monthly_projection",
  standard_deduction: 75000,
  round_off_tds: 1,
  consider_previous_employment: 1,
  auto_generate_form16: 1,
  show_tds_on_payslip: 1,
};

export type NotificationChannelSettings = {
  inapp_notification: 0 | 1;
  email_notification: 0 | 1;
  sms_notification: 0 | 1;
  push_notification: 0 | 1;
  whatsapp_notification: 0 | 1;
};

export const MOCK_NOTIFICATION_SETTINGS: NotificationChannelSettings = {
  inapp_notification: 1,
  email_notification: 1,
  sms_notification: 1,
  push_notification: 1,
  whatsapp_notification: 0,
};

export const MOCK_SMS_GATEWAY: SmsGatewayConfig = {
  api_url: "https://sms.prioritysolutions.in/api/v1/send",
  api_key: "demo-sms-api-key-••••••••",
  sender_id: "PRISOL",
  message_type: "transactional",
  status: 1,
};

export const MOCK_SMS_EVENTS: SmsEventSetting[] = [
  {
    key: "employee_joining",
    label: "Employee Joining",
    description: "Notify HR and the employee when a new joiner is onboarded.",
    enabled: 1,
  },
  {
    key: "salary_generated",
    label: "Salary Generated",
    description: "Send an SMS when payroll is processed for an employee.",
    enabled: 1,
  },
  {
    key: "leave_approved",
    label: "Leave Approved",
    description: "Notify the employee when leave is approved.",
    enabled: 1,
  },
  {
    key: "attendance_alert",
    label: "Attendance Alert",
    description: "Alert employees for late punch or missing attendance.",
    enabled: 1,
  },
];

export const MOCK_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: "1",
    template_name: "Salary Processed",
    event: "Salary",
    message_template:
      "Dear {EmployeeName}, your salary for {Month} has been processed. Net pay: {NetPay}. - PRISOL",
    status: 1,
  },
  {
    id: "2",
    template_name: "Leave Approved",
    event: "Leave",
    message_template:
      "Dear {EmployeeName}, your leave from {FromDate} to {ToDate} has been approved. - PRISOL",
    status: 1,
  },
  {
    id: "3",
    template_name: "Attendance Alert",
    event: "Attendance",
    message_template:
      "Dear {EmployeeName}, you were marked late on {Date}. Please contact HR if this is incorrect. - PRISOL",
    status: 1,
  },
];

export const MOCK_NUMBERING_SEQUENCES: NumberingSequenceType[] = [
  {
    id: 1,
    entityModule: "Kendra Centre Code Series",
    customPrefix: "CEN-",
    nextCounter: 3,
    paddingDigits: 2,
    suffix: "",
    liveFormattedSample: "CEN-03",
    status: 1
  },
  {
    id: 2,
    entityModule: "Borrower / Member ID Series",
    customPrefix: "CUST-2026-",
    nextCounter: 4,
    paddingDigits: 4,
    suffix: "",
    liveFormattedSample: "CUST-2026-0004",
    status: 1
  },
  {
    id: 3,
    entityModule: "Staff / Employee ID Series",
    customPrefix: "EMP-",
    nextCounter: 5,
    paddingDigits: 3,
    suffix: "",
    liveFormattedSample: "EMP-005",
    status: 1
  },
  {
    id: 4,
    entityModule: "Joint Liability Group (JLG) Code",
    status: 1
  },
  {
    id: 5,
    entityModule: "Legal Demand Notice Reference Series",
    status: 1
  },
  {
    id: 6,
    entityModule: "Loan Account Number Series",
    customPrefix: "LN-2026-",
    nextCounter: 4,
    paddingDigits: 5,
    suffix: "",
    liveFormattedSample: "LN-2026-00004",
    status: 1
  },
  {
    id: 7,
    entityModule: "No Objection Certificate (NOC) Series",
    status: 1
  },
  {
    id: 8,
    entityModule: "Double-Entry Journal Voucher Series",
    status: 1
  }
];

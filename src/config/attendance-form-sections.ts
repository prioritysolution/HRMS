import type { FormSection } from "@/types/hrms";

export const ATTENDANCE_RULE_FORM_SECTIONS: FormSection[] = [
  {
    id: "shift-timing",
    title: "Shift Timing",
    description: "Define shift start, end, and break windows for attendance calculation.",
    fields: [
      { name: "Rule_name", label: "Rule Name", required: true, placeholder: "Standard Attendance Rule" },
      {
        name: "Shift_name",
        label: "Shift",
        type: "select",
        required: true,
        options: ["General Shift", "Night Shift", "Flexible Shift"],
      },
      { name: "Shift_start", label: "Shift Start", type: "time", required: true },
      { name: "Shift_end", label: "Shift End", type: "time", required: true },
      { name: "Break_minutes", label: "Break Duration (min)", type: "number", defaultValue: "60" },
    ],
  },
  {
    id: "grace-late-early",
    title: "Grace & Thresholds",
    description: "Configure grace period, late arrival, and early departure thresholds.",
    fields: [
      { name: "Grace_minutes", label: "Grace Period (min)", type: "number", defaultValue: "15" },
      { name: "Late_threshold_minutes", label: "Late Threshold (min)", type: "number", defaultValue: "15" },
      {
        name: "Early_leaving_threshold_minutes",
        label: "Early Leaving Threshold (min)",
        type: "number",
        defaultValue: "15",
      },
    ],
  },
  {
    id: "working-hours",
    title: "Working Hours",
    description: "Minimum working hours required for a full-day attendance mark.",
    fields: [
      { name: "Min_working_hours", label: "Minimum Working Hours", type: "number", defaultValue: "8" },
      {
        name: "Half_day_hours",
        label: "Half-Day Minimum Hours",
        type: "number",
        defaultValue: "4",
      },
    ],
  },
  {
    id: "overtime-halfday",
    title: "Overtime & Half-Day Rules",
    description: "Rules for overtime eligibility and half-day calculation.",
    fields: [
      { name: "Overtime_after", label: "Overtime After (hours)", type: "number", defaultValue: "9" },
      {
        name: "Overtime_multiplier",
        label: "Overtime Multiplier",
        type: "select",
        options: ["1.0", "1.5", "2.0"],
        defaultValue: "1.5",
      },
      {
        name: "Half_day_rule",
        label: "Half-Day Rule",
        type: "select",
        options: [
          "Below minimum working hours",
          "Single punch only",
          "Late beyond threshold",
        ],
        defaultValue: "Below minimum working hours",
      },
    ],
  },
  {
    id: "regularization",
    title: "Attendance Regularization",
    description: "Allow employees to request attendance corrections with approval workflow.",
    fields: [
      {
        name: "Allow_regularization",
        label: "Allow regularization requests",
        type: "checkbox",
        defaultValue: "1",
        span: "full",
      },
      {
        name: "Regularization_window_days",
        label: "Request window (days)",
        type: "number",
        defaultValue: "7",
      },
      {
        name: "Auto_approve_regularization",
        label: "Auto-approve regularization",
        type: "checkbox",
      },
      {
        name: "Status",
        label: "Rule Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
        defaultValue: "Active",
        span: "full",
      },
    ],
  },
];

export const ATTENDANCE_SOURCE_TYPES = [
  "Biometric machine",
  "Mobile application",
  "Web login",
  "Manual attendance",
  "API integration",
] as const;

export const ATTENDANCE_STATUS_OPTIONS = [
  "Present",
  "Absent",
  "Half Day",
  "Late",
  "Early Departure",
  "Holiday",
  "Weekly Off",
  "On-Duty",
  "Leave",
] as const;

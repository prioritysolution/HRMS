import type { FormSection } from "@/types/hrms";

type SelectOption = { value: string; label: string };

function toSelectOptions(values: string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

export const EMPLOYEE_APPL_OPTION_FALLBACKS = {
  gender: toSelectOptions(["Male", "Female", "Transgender", "Not Specified"]),
  bloodGroup: toSelectOptions(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  maritalStatus: toSelectOptions(["Single", "Married", "Divorced", "Widowed"]),
} as const;
const departmentOptions = ["IT", "HR", "Finance", "Operations", "Design", "Engineering"];
const designationOptions = ["Manager", "Executive", "Analyst", "Senior Developer", "HR Executive"];
const branchOptions = ["Head Office", "Branch 1", "Branch 2"];
const employmentTypeOptions = ["Full Time", "Part Time", "Contract", "Internship"];
const gradeOptions = ["Grade A", "Grade B", "Grade C"];
const shiftOptions = ["General Shift", "Night Shift", "Flexible"];
const employmentStatusOptions = ["Active", "Inactive", "Probation", "On Leave"];

export const EMPLOYEE_FORM_SECTIONS: FormSection[] = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Basic identity and contact details for the employee.",
    fields: [
      // {
      //   name: "Org_Id",
      //   label: "Organization",
      //   type: "select",
      //   required: true,
      // },
      { name: "Employee_code", label: "Employee ID", required: true, placeholder: "EMP-1001" },
      { name: "First_name", label: "First Name", required: true },
      { name: "Middle_name", label: "Middle Name" },
      { name: "Last_name", label: "Last Name", required: true },
      {
        name: "Photo",
        label: "Photograph",
        type: "file",
        span: "full",
        accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
        maxSizeMb: 2,
        previewKey: "Photo_path",
        fileNameKey: "Photo_path",
        hint: "JPG, PNG, WEBP · max 2 MB",
      },
      { name: "Date_of_birth", label: "Date of Birth", type: "date" },
      { name: "Gender", label: "Gender", type: "select" },
      { name: "Blood_group", label: "Blood Group", type: "select" },
      {
        name: "Marital_status",
        label: "Marital Status",
        type: "select",
      },
      { name: "Father_name", label: "Father's Name" },
      { name: "Mother_name", label: "Mother's Name" },
      { name: "Spouse_name", label: "Spouse's Name" },
      { name: "Mobile", label: "Mobile Number", type: "tel", required: true },
      { name: "Email", label: "Email", type: "email", required: true },
      { name: "Address_line1", label: "Address Line 1", span: "full" },
      { name: "Address_line2", label: "Address Line 2", span: "full" },
      { name: "City", label: "City" },
      { name: "State", label: "State" },
      { name: "Pincode", label: "Pincode" },
      { name: "Emergency_contact", label: "Emergency Contact", type: "tel" },
    ],
  },
  {
    id: "employment",
    title: "Employment Information",
    description: "Job role, reporting structure, and work assignment details.",
    fields: [
      { name: "Date_of_joining", label: "Date of Joining", type: "date", required: true },
      { name: "Confirmation_date", label: "Confirmation Date", type: "date" },
      {
        name: "Employment_type",
        label: "Employee Type",
        type: "select",
        options: employmentTypeOptions,
        required: true,
      },
      { name: "Department", label: "Department", type: "select", options: departmentOptions, required: true },
      { name: "Branch", label: "Branch", type: "select", options: branchOptions, required: true },
      { name: "Designation", label: "Designation", type: "select", options: designationOptions, required: true },
      { name: "Grade", label: "Grade", type: "select", options: gradeOptions},
      { name: "Reporting_manager", label: "Reporting Manager", placeholder: "Manager name" },
      {
        name: "Employment_status",
        label: "Employment Status",
        type: "select",
        options: employmentStatusOptions,
        defaultValue: "Active",
        required: true,
      },
      { name: "Probation_period", label: "Probation Period", placeholder: "e.g. 6 months" },
      { name: "Work_location", label: "Work Location", placeholder: "Office / city" },
      { name: "Shift", label: "Shift", type: "select", options: shiftOptions, required: true },
    ],
  },
  {
    id: "identification",
    title: "Identification Details",
    description: "Government and other identity documents.",
    fields: [
      { name: "PAN", label: "PAN", placeholder: "ABCDE1234F" },
      { name: "Aadhaar_no", label: "Aadhaar / Other ID", placeholder: "XXXX XXXX XXXX" },
      { name: "Passport_no", label: "Passport" },
      { name: "Driving_licence", label: "Driving Licence" },
      {
        name: "Other_identification",
        label: "Other Identification Documents",
        type: "textarea",
        span: "full",
        placeholder: "Voter ID, ration card, or other document details",
      },
    ],
  },
  {
    id: "bank",
    title: "Bank Details",
    description: "Salary account information from mst_employee_bank.",
    fields: [
      { name: "Bank_name", label: "Bank Name" },
      { name: "Account_number", label: "Account Number" },
      { name: "IFSC_code", label: "IFSC" },
      { name: "Bank_branch", label: "Branch" },
      { 
      name: "Account_type", 
      label: "Account Type", 
      type: "select", 
      options: ["Savings", "Current", "Salary"] 
    }, // <-- Added field
      { name: "Account_holder_name", label: "Account Holder Name", span: "full" },
    ],
  },
  {
    id: "statutory",
    title: "Statutory Information",
    description: "PF, ESI, tax, and other compliance details as per organization requirements.",
    fields: [
      { name: "PF_number", label: "PF" },
      { name: "UAN", label: "UAN" },
      { name: "ESI_number", label: "ESI" },
      { name: "Professional_tax", label: "Professional Tax" },
      { name: "TDS", label: "TDS" },
      {
        name: "Other_statutory",
        label: "Other Statutory Information",
        type: "textarea",
        span: "full",
        placeholder: "Any additional statutory or compliance notes",
      },
    ],
  },
];
